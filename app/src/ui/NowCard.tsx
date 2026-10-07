import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { RESHAPE_DEPTH } from '../domain/firstStep';
import { intentionSentence, obstacleSentence } from '../domain/intention';
import type { Becoming, Task } from '../domain/model';
import type { Dispatch } from '../state/useAppState';
import { Button, s as shared, useBackToClose } from './components';
import { completionLine, copy } from './copy';
import { clockLabel } from '../domain/duration';
import { PlanEditor } from './PlanEditor';
import { colors, fonts, space } from './theme';

interface Props {
  task: Task;
  reason?: string;
  becomings: Becoming[];
  /** All tasks, for "after X" plans. */
  tasks: Task[];
  dispatch: Dispatch;
  onWin: (text: string, sub?: string) => void;
}

/** The heart of the app: one task, shown as its first physical step. */
export function NowCard({ task, reason, becomings, tasks, dispatch, onWin }: Props) {
  const [justStarted, setJustStarted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [draft, setDraft] = useState(task.firstStep.text);

  // Start latency is measured from the moment this card first shows the task.
  // The reducer ignores repeat opens, so this also re-arms the clock after "not now" leaves the same task here.
  useEffect(() => {
    if (!task.openedAt && task.state === 'open') dispatch({ type: 'open', taskId: task.id });
  }, [task.id, task.openedAt, task.state]);
  useEffect(() => {
    setJustStarted(false);
    setEditing(false);
    setPlanning(false);
  }, [task.id]);

  const closeEditors = useCallback(() => { setEditing(false); setPlanning(false); }, []);
  useBackToClose(editing || planning, closeEditors);

  const id = task.id;
  const feeds = becomings.find((b) => b.status === 'active' && task.becomingIds?.includes(b.id));
  const fired = !!task.intention?.firedAt;
  const plan = task.intention && !fired ? intentionSentence(task, tasks) : undefined;
  const stall = task.intention ? obstacleSentence(task.intention) : undefined;
  const meta = [task.title, task.duration.experiential.label, feeds ? copy.feeds(feeds.statement) : fired ? undefined : reason].filter(Boolean).join(' · ');

  if (planning) {
    return <PlanEditor task={task} tasks={tasks} dispatch={dispatch} onDone={(saved) => { setPlanning(false); if (saved) onWin(copy.plan.saved); }} />;
  }

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
          {!task.intention ? (
            <Button label={copy.plan.slipOption} onPress={() => { dispatch({ type: 'keep_anyway', taskId: id }); setPlanning(true); }} />
          ) : null}
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
        {stall ? <Text style={st.stall}>{stall}</Text> : null}
        <View style={shared.row}>
          <Button kind="primary" label={copy.done} onPress={() => { dispatch({ type: 'complete', taskId: id }); onWin(copy.doneFlash, completionLine(Date.now())); }} />
          <Button label={copy.notNow} onPress={() => dispatch({ type: 'pause', taskId: id })} />
        </View>
      </View>
    );
  }

  return (
    <View style={st.card}>
      <Text style={[shared.label, fired && { color: colors.accent }]}>{fired ? copy.plan.firedHeader : copy.nowHeader}</Text>
      <Text style={st.step} accessibilityRole="header">{task.firstStep.text}</Text>
      <Text style={shared.faint}>{meta}</Text>
      {plan ? <Text style={st.stall}>{plan}</Text> : null}
      {stall ? <Text style={st.stall}>{stall}</Text> : null}
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
        <Text style={st.link} onPress={() => setPlanning(true)}>{task.intention ? copy.plan.change : copy.plan.link}</Text>
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
  stall: { color: colors.muted, fontFamily: fonts.serif, fontSize: 15, lineHeight: 21, fontStyle: 'italic' },
  link: { color: colors.muted, fontFamily: fonts.sans, fontSize: 13, textDecorationLine: 'underline' },
});
