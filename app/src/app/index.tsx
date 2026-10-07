import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Routine } from '../domain/model';
import { pickNow, rankTasks } from '../domain/planner';
import { DISMISSALS_BEFORE_ASKING, selectQuestions, shouldOfferSession } from '../domain/recurrence';
import { useApp } from '../state/AppStateContext';
import { newId } from '../state/useAppState';
import { AlsoHere, CaptureBar, EnergyBar, WinFlash, s as shared, type Flash } from '../ui/components';
import { copy } from '../ui/copy';
import { NowCard } from '../ui/NowCard';
import { FrequencyCard, RecurrenceCard } from '../ui/RecurrenceCard';
import { Screen, screenStyles } from '../ui/Screen';
import { colors, fonts } from '../ui/theme';

export default function NowScreen() {
  const { state, hydrated, dispatch } = useApp();
  const [flash, setFlash] = useState<Flash | null>(null);
  const [aphorismHidden, setAphorismHidden] = useState(false);
  const [session, setSession] = useState<Routine[] | null>(null);

  const onWin = useCallback((text: string, sub?: string) => setFlash({ key: Date.now(), text, sub }), []);

  // The recurrence question rides the day's first win. Its queue is fixed when it opens.
  useEffect(() => {
    if (!hydrated || session) return;
    const at = new Date().toISOString();
    if (shouldOfferSession(state, at)) {
      setSession(selectQuestions(state, at));
      dispatch({ type: 'start_recurrence_session' });
    }
  }, [hydrated, state, session, dispatch]);

  if (hydrated && !state.onboarding.completedAt) return <Redirect href="/onboarding" />;

  const now = pickNow(state);
  // Only what fits current energy; the rest is summarized by the "resting" line.
  const others = rankTasks(state.tasks, state.energy).filter((t) => t.id !== now.task?.id);
  const becoming = state.becomings.find((b) => b.status === 'active');
  const askFrequency =
    state.recurrence.enabled && !state.recurrence.askedAboutFrequency && state.recurrence.dismissStreak >= DISMISSALS_BEFORE_ASKING;

  return (
    <View style={{ flex: 1 }}>
      <Screen nav={{ href: '/becoming', label: copy.becomingLink }}>
        {becoming ? <Text style={{ color: colors.muted, fontFamily: fonts.serif, fontStyle: 'italic', marginTop: -12 }}>becoming {becoming.statement}</Text> : null}

        <EnergyBar value={state.energy} onChange={(level) => dispatch({ type: 'set_energy', level })} />
        {state.energy === 'fried' ? <Text style={{ color: colors.accent, fontFamily: fonts.sans, fontSize: 14 }}>{copy.friedNote}</Text> : null}

        {askFrequency ? <FrequencyCard dispatch={dispatch} /> : null}
        {session?.length ? (
          <RecurrenceCard queue={session} state={state} dispatch={dispatch} onWin={onWin} onClose={() => setSession([])} />
        ) : null}

        {!hydrated ? null : now.task ? (
          <NowCard task={now.task} reason={now.reason} becomings={state.becomings} dispatch={dispatch} onWin={onWin} />
        ) : (
          <View style={{ paddingVertical: 24, gap: 24 }}>
            <Text style={screenStyles.h2}>{copy.emptyNow}</Text>
            {!aphorismHidden ? (
              <Pressable onPress={() => setAphorismHidden(true)} accessibilityHint="Tap to hide">
                <Text style={screenStyles.aphorism}>"{copy.aphorism.text}"</Text>
                <Text style={shared.faint}>{copy.aphorism.source}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {now.heldBack > 0 ? <Text style={shared.faint}>{copy.heldBack(now.heldBack)}</Text> : null}

        <CaptureBar onCapture={(title) => dispatch({ type: 'capture', id: newId(), title })} />

        <AlsoHere tasks={others} onPick={(taskId) => dispatch({ type: 'pin_now', taskId })} />
      </Screen>
      <WinFlash flash={flash} />
    </View>
  );
}
