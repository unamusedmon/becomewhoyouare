import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { RESHAPE_DEPTH } from '../domain/firstStep';
import type { Task } from '../domain/model';
import type { Dispatch } from '../state/useAppState';
import { Button, s as shared } from './components';
import { completionLine, copy } from './copy';
import { clockLabel } from '../domain/duration';
import { colors, fonts, space } from './theme';

interface Props {
  task: Task;
  reason?: string;
  dispatch: Dispatch;
  onWin: (text: string, sub?: string) => void;
}

/** The heart of the app: one task, shown as its first physical step. */
export function NowCard({ task, reason, dispatch, onWin }: Props) {
  const [justStarted, setJustStarted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.firstStep.text);

  // Start latency is measured from the moment this card first shows the task.
  // The reducer ignores repeat opens, so this also re-arms the clock after "not now" leaves the same task here.
  useEffect(() => {
    if (!task.openedAt && task.state === 'open') dispatch({ type: 'open', taskId: task.id });
  }, [task.id, task.openedAt, task.state]);
  useEffect(() => {
    setJustStarted(false);
    setEditing(false);
  }, [task.id]);

  const id = task.id;
  const meta = [task.title, task.duration.experiential.label, reason].filter(Boolean).join(' · ');

  if (editing) {
    return (
      <View style={st.card}>
        <Text style={shared.label}>{task.title}</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          multiline
          style={[st.step, st.input]}
          accessibilityLabel="First step in your own words"
        />
        <View style={shared.row}>
          <Button kind="primary" label={copy.save} onPress={() => { dispatch({ type: 'edit_step', taskId: id, text: draft }); dispatch({ type: 'keep_anyway', taskId: id }); setEditing(false); }} />
          <Button label={copy.cancel} onPress={() => setEditing(false)} />
        </View>
      </View>
    );
  }

  if (task.slipPromptPending) {
    const reshape = task.firstStep.shrinkDepth >= RESHAPE_DEPTH - 1;
    return (
      <View style={st.card}>
        <Text style={st.title}>{reshape ? copy.reshapeTitle : copy.slipTitle}</Text>
        <Text style={st.body}>{reshape ? copy.reshapeBody : copy.slipBody}</Text>
        <Text style={shared.faint}>{task.title}</Text>
        <View style={shared.row}>
          {reshape ? (
            <Button kind="primary" label={copy.editStep} onPress={() => { setDraft(task.firstStep.text); setEditing(true); }} />
          ) : (
            <Button kind="primary" label={copy.shrink} onPress={() => { dispatch({ type: 'keep_anyway', taskId: id }); dispatch({ type: 'shrink', taskId: id }); }} />
          )}
          <Button label={copy.letGo} onPress={() => { dispatch({ type: 'release', taskId: id }); onWin(copy.released); }} />
          <Button label={copy.itsFine} onPress={() => dispatch({ type: 'keep_anyway', taskId: id })} />
        </View>
      </View>
    );
  }

  if (task.state === 'started') {
    if (justStarted) {
      return (
        <View style={st.card}>
          <Text style={[st.step, { color: colors.win }]}>{copy.started}</Text>
          <Text style={shared.faint}>{task.title}</Text>
          <View style={shared.row}>
            <Button kind="primary" label={copy.keepGoing} onPress={() => setJustStarted(false)} />
            <Button label={copy.thatCounts} onPress={() => dispatch({ type: 'pause', taskId: id })} />
          </View>
        </View>
      );
    }
    return (
      <View style={st.card}>
        <Text style={shared.label}>{copy.pickUp}</Text>
        <Text style={st.step}>{task.title}</Text>
        <Text style={shared.faint}>{task.duration.experiential.label} · {clockLabel(task.duration.plannedMinutes)}</Text>
        <View style={shared.row}>
          <Button kind="primary" label={copy.done} onPress={() => { dispatch({ type: 'complete', taskId: id }); onWin(copy.doneFlash, completionLine(Date.now())); }} />
          <Button label={copy.notNow} onPress={() => dispatch({ type: 'pause', taskId: id })} />
        </View>
      </View>
    );
  }

  return (
    <View style={st.card}>
      <Text style={shared.label}>{copy.nowHeader}</Text>
      <Text style={st.step} accessibilityRole="header">{task.firstStep.text}</Text>
      <Text style={shared.faint}>{meta}</Text>
      <View style={shared.row}>
        <Button
          kind="primary"
          label={copy.didIt}
          onPress={() => { dispatch({ type: 'first_step_done', taskId: id }); setJustStarted(true); onWin(copy.started); }}
        />
        <Button label={copy.tooBig} onPress={() => dispatch({ type: 'shrink', taskId: id })} />
        <Button label={copy.notNow} onPress={() => dispatch({ type: 'not_now', taskId: id })} />
      </View>
      <View style={[shared.row, { gap: space.md }]}>
        {task.firstStep.alternatives?.length ? (
          <Text style={st.link} onPress={() => dispatch({ type: 'next_alternative', taskId: id })}>{copy.anotherStep}</Text>
        ) : null}
        <Text style={st.link} onPress={() => { setDraft(task.firstStep.text); setEditing(true); }}>{copy.editStep}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.md },
  step: { color: colors.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 38 },
  input: { borderBottomWidth: 1, borderBottomColor: colors.accent, paddingVertical: space.xs },
  title: { color: colors.ink, fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  body: { color: colors.ink, fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, opacity: 0.85 },
  link: { color: colors.muted, fontFamily: fonts.sans, fontSize: 13, textDecorationLine: 'underline' },
});
