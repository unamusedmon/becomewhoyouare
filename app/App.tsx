import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { pickNow, rankTasks } from './src/domain/planner';
import { newId, useAppState } from './src/state/useAppState';
import { AlsoHere, CaptureBar, EnergyBar, WinFlash, s as shared, type Flash } from './src/ui/components';
import { copy } from './src/ui/copy';
import { NowCard } from './src/ui/NowCard';
import { colors, fonts, space } from './src/ui/theme';

export default function App() {
  const { state, hydrated, dispatch } = useAppState();
  const [flash, setFlash] = useState<Flash | null>(null);
  const [aphorismHidden, setAphorismHidden] = useState(false);

  const onWin = useCallback((text: string, sub?: string) => setFlash({ key: Date.now(), text, sub }), []);

  const now = pickNow(state);
  // Only what fits current energy; the rest is summarized by the "resting" line.
  const others = rankTasks(state.tasks, state.energy).filter((t) => t.id !== now.task?.id);

  return (
    <View style={st.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          <Text style={st.brand}>{copy.appName}</Text>

          <EnergyBar value={state.energy} onChange={(level) => dispatch({ type: 'set_energy', level })} />
          {state.energy === 'fried' ? <Text style={st.note}>{copy.friedNote}</Text> : null}

          {!hydrated ? null : now.task ? (
            <NowCard task={now.task} reason={now.reason} dispatch={dispatch} onWin={onWin} />
          ) : (
            <View style={st.empty}>
              <Text style={st.emptyText}>{copy.emptyNow}</Text>
              {!aphorismHidden ? (
                <Pressable onPress={() => setAphorismHidden(true)} accessibilityHint="Tap to hide">
                  <Text style={st.aphorism}>"{copy.aphorism.text}"</Text>
                  <Text style={shared.faint}>{copy.aphorism.source}</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {now.heldBack > 0 ? <Text style={shared.faint}>{copy.heldBack(now.heldBack)}</Text> : null}

          <CaptureBar onCapture={(title) => dispatch({ type: 'capture', id: newId(), title })} />

          <AlsoHere tasks={others} onPick={(taskId) => dispatch({ type: 'pin_now', taskId })} />
        </ScrollView>
      </KeyboardAvoidingView>
      <WinFlash flash={flash} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.md, paddingTop: space.xl + space.md, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  brand: { color: colors.faint, fontFamily: fonts.serif, fontSize: 15, letterSpacing: 1, fontStyle: 'italic' },
  note: { color: colors.accent, fontFamily: fonts.sans, fontSize: 14 },
  empty: { paddingVertical: space.lg, gap: space.lg },
  emptyText: { color: colors.ink, fontFamily: fonts.serif, fontSize: 22, lineHeight: 30 },
  aphorism: { color: colors.muted, fontFamily: fonts.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 23, marginBottom: space.xs },
});
