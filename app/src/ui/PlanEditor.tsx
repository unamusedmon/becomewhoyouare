import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { cleanCue, CUE_SUGGESTIONS, intentionSentence, parseClock, timePresets } from '../domain/intention';
import type { IntentionTrigger, Task } from '../domain/model';
import { isActive } from '../domain/planner';
import { useApp } from '../state/AppStateContext';
import { requestNudgePermission } from '../state/nudgeSync';
import type { Dispatch } from '../state/useAppState';
import { Button, s as shared } from './components';
import { copy } from './copy';
import { colors, fonts, space } from './theme';

const p = copy.plan;

/** "When X, where Y, I'll do the first step. If I stall, then Z." Nothing in it is required but the when. */
export function PlanEditor({ task, tasks, dispatch, onDone }: { task: Task; tasks: Task[]; dispatch: Dispatch; onDone: (saved: boolean) => void }) {
  const i = task.intention;
  const [cue, setCue] = useState(i?.trigger.kind === 'event' ? i.trigger.text : '');
  const [afterId, setAfterId] = useState<string | undefined>(i?.trigger.kind === 'after_task' ? i.trigger.taskId : undefined);
  const [timeAt, setTimeAt] = useState<Date | undefined>(i?.trigger.kind === 'time' ? new Date(i.trigger.at) : undefined);
  const [timeText, setTimeText] = useState('');
  const { state } = useApp();
  const [presets] = useState(() => timePresets());
  // Picking one kind of "when" clears the others: a plan has exactly one cue.
  const chooseCue = (text: string) => { setCue(text); setAfterId(undefined); setTimeAt(undefined); setTimeText(''); };
  const chooseAfter = (id: string | undefined) => { setAfterId(id); setTimeAt(undefined); setTimeText(''); };
  const chooseTime = (d: Date | undefined) => { setTimeAt(d); setAfterId(undefined); setCue(''); };
  const [where, setWhere] = useState(i?.context ?? '');
  const [stall, setStall] = useState(!!i?.ifObstacle);
  const [obstacle, setObstacle] = useState(i?.ifObstacle?.obstacle ?? '');
  const [response, setResponse] = useState(i?.ifObstacle?.response ?? '');

  const anchors = tasks.filter((t) => isActive(t) && t.id !== task.id).slice(0, 4);
  const trigger: IntentionTrigger | undefined = timeAt
    ? { kind: 'time', at: timeAt.toISOString() }
    : afterId
      ? { kind: 'after_task', taskId: afterId }
      : cleanCue(cue) ? { kind: 'event', text: cleanCue(cue) } : undefined;
  const preview = trigger
    ? intentionSentence({ ...task, intention: { trigger, context: where, setAt: '' } }, tasks)
    : undefined;

  const save = async () => {
    if (!trigger) return;
    // A clock time only helps if it can reach you when the app is closed.
    if (trigger.kind === 'time' && !state.nudges.enabled) {
      const granted = await requestNudgePermission().catch(() => false);
      if (granted) dispatch({ type: 'set_nudges', patch: { enabled: true } });
    }
    dispatch({
      type: 'set_intention',
      taskId: task.id,
      trigger,
      context: where,
      ifObstacle: stall ? { obstacle, response } : undefined,
    });
    onDone(true);
  };

  return (
    <View style={st.card}>
      <Text style={st.title}>{p.title}</Text>
      <Text style={st.body}>{p.body}</Text>
      <Text style={shared.faint}>{task.title}</Text>

      <View style={st.field}>
        <Text style={shared.label}>{p.when}</Text>
        <TextInput
          value={cue}
          onChangeText={chooseCue}
          placeholder={p.whenPlaceholder}
          placeholderTextColor={colors.faint}
          style={st.input}
          accessibilityLabel="When"
        />
        <View style={shared.row}>
          {CUE_SUGGESTIONS.map((c) => (
            <Chip key={c} label={c} on={!afterId && !timeAt && cue === c} onPress={() => chooseCue(c)} />
          ))}
        </View>
      </View>

      {anchors.length ? (
        <View style={st.field}>
          <Text style={shared.label}>{p.after}</Text>
          <View style={shared.row}>
            {anchors.map((t) => (
              <Chip key={t.id} label={t.title} on={afterId === t.id} onPress={() => chooseAfter(afterId === t.id ? undefined : t.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={st.field}>
        <Text style={shared.label}>{p.atTime}</Text>
        <View style={shared.row}>
          {presets.map((x) => (
            <Chip
              key={x.label}
              label={x.label}
              on={!!timeAt && !timeText && timeAt.getTime() === x.at.getTime()}
              onPress={() => { setTimeText(''); chooseTime(x.at); }}
            />
          ))}
        </View>
        <TextInput
          value={timeText}
          onChangeText={(t) => { setTimeText(t); chooseTime(parseClock(t)); }}
          placeholder={p.timePlaceholder}
          placeholderTextColor={colors.faint}
          style={st.input}
          keyboardType={Platform.OS === 'android' ? 'default' : 'numbers-and-punctuation'}
          autoCapitalize="none"
          accessibilityLabel="At a time"
        />
        {timeText && !timeAt ? <Text style={shared.faint}>{p.timeHelp}</Text> : null}
      </View>

      <View style={st.field}>
        <Text style={shared.label}>{p.where}</Text>
        <TextInput
          value={where}
          onChangeText={setWhere}
          placeholder={p.wherePlaceholder}
          placeholderTextColor={colors.faint}
          style={st.input}
          accessibilityLabel="Where"
        />
      </View>

      {stall ? (
        <View style={st.field}>
          <Text style={shared.label}>{p.ifLabel}</Text>
          <TextInput value={obstacle} onChangeText={setObstacle} placeholder={p.ifPlaceholder} placeholderTextColor={colors.faint} style={st.input} accessibilityLabel="If I" />
          <Text style={shared.label}>{p.thenLabel}</Text>
          <TextInput value={response} onChangeText={setResponse} placeholder={p.thenPlaceholder} placeholderTextColor={colors.faint} style={st.input} accessibilityLabel="Then I'll" />
        </View>
      ) : (
        <Text style={st.link} onPress={() => setStall(true)}>{p.stall}</Text>
      )}

      {preview ? <Text style={st.preview}>{preview}</Text> : null}
      {timeAt && !state.nudges.enabled && Platform.OS !== 'web' ? <Text style={shared.faint}>{p.willAsk}</Text> : null}

      <View style={shared.row}>
        <Button kind="primary" label={p.save} onPress={() => { save(); }} />
        <Button label={copy.cancel} onPress={() => onDone(false)} />
        {i ? <Button label={p.remove} onPress={() => { dispatch({ type: 'clear_intention', taskId: task.id }); onDone(false); }} /> : null}
      </View>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      android_ripple={{ color: colors.line, borderless: false }}
      style={[shared.chip, on && shared.chipOn, { maxWidth: '100%' }]}
    >
      <Text style={[shared.chipText, on && shared.chipTextOn]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.md },
  title: { color: colors.ink, fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  body: { color: colors.ink, fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, opacity: 0.85 },
  field: { gap: space.sm },
  input: {
    color: colors.ink, fontFamily: fonts.sans, fontSize: 16, backgroundColor: colors.bg,
    borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 11,
  },
  preview: { color: colors.accent, fontFamily: fonts.serif, fontSize: 18, lineHeight: 25, fontStyle: 'italic' },
  link: { color: colors.muted, fontFamily: fonts.sans, fontSize: 13, textDecorationLine: 'underline' },
});
