import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { EnergyLevel, Task } from '../domain/model';
import { copy } from './copy';
import { colors, fonts, space } from './theme';

export function Button({ label, onPress, kind = 'quiet' }: { label: string; onPress: () => void; kind?: 'primary' | 'quiet' }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [kind === 'primary' ? s.primary : s.quiet, pressed && { opacity: 0.7 }]}
    >
      <Text style={kind === 'primary' ? s.primaryText : s.quietText}>{label}</Text>
    </Pressable>
  );
}

const LEVELS: EnergyLevel[] = ['high', 'medium', 'low', 'fried'];

export function EnergyBar({ value, onChange }: { value?: EnergyLevel; onChange: (v: EnergyLevel | undefined) => void }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={s.label}>{copy.energyQuestion}</Text>
      <View style={s.row}>
        {LEVELS.map((lvl) => {
          const on = value === lvl;
          return (
            <Pressable
              key={lvl}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(on ? undefined : lvl)}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{copy.energyLabels[lvl]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CaptureBar({ onCapture }: { onCapture: (title: string) => void }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2200);
    return () => clearTimeout(t);
  }, [note]);
  const submit = () => {
    if (!text.trim()) return;
    onCapture(text);
    setText('');
    setNote(copy.captured);
  };
  return (
    <View style={{ gap: space.xs }}>
      <View style={s.captureRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder={copy.capturePlaceholder}
          placeholderTextColor={colors.faint}
          returnKeyType="done"
          style={s.captureInput}
          accessibilityLabel="Capture a task"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={submit} style={s.addBtn}>
          <Text style={s.addText}>+</Text>
        </Pressable>
      </View>
      <Text style={[s.faint, { minHeight: 16 }]}>{note ?? ' '}</Text>
    </View>
  );
}

export function AlsoHere({ tasks, onPick }: { tasks: Task[]; onPick: (id: string) => void }) {
  if (!tasks.length) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Text style={s.label}>{copy.alsoHere}</Text>
      {tasks.map((t) => (
        <Pressable key={t.id} accessibilityRole="button" onPress={() => onPick(t.id)} style={s.listItem}>
          <Text style={s.listTitle} numberOfLines={1}>{t.title}</Text>
          <Text style={s.faint} numberOfLines={1}>
            {t.state === 'started' ? 'started · ' : ''}{t.duration.experiential.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export interface Flash {
  key: number;
  text: string;
  sub?: string;
}

/** The vivid completion signal: fast, bright, gone in under a second and a half. */
export function WinFlash({ flash }: { flash: Flash | null }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!flash) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
      Animated.delay(650),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [flash?.key]);
  if (!flash) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[s.flash, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}
    >
      <Text style={s.flashText}>{flash.text}</Text>
      {flash.sub ? <Text style={s.flashSub}>{flash.sub}</Text> : null}
    </Animated.View>
  );
}

export const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  label: { color: colors.muted, fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.3 },
  faint: { color: colors.faint, fontFamily: fonts.sans, fontSize: 13 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { borderColor: colors.accent, backgroundColor: '#2A2214' },
  chipText: { color: colors.muted, fontFamily: fonts.sans, fontSize: 14 },
  chipTextOn: { color: colors.accent },
  primary: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 13 },
  primaryText: { color: '#17130A', fontFamily: fonts.sans, fontSize: 16, fontWeight: '600' },
  quiet: { paddingHorizontal: 10, paddingVertical: 13 },
  quietText: { color: colors.muted, fontFamily: fonts.sans, fontSize: 15 },
  captureRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  captureInput: {
    flex: 1, color: colors.ink, fontFamily: fonts.sans, fontSize: 16, backgroundColor: colors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 12,
  },
  addBtn: { width: 46, height: 46, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.accent, fontSize: 24, lineHeight: 26 },
  listItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 2 },
  listTitle: { color: colors.ink, fontFamily: fonts.sans, fontSize: 15 },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,14,13,0.82)' },
  flashText: { color: colors.win, fontFamily: fonts.serif, fontSize: 56 },
  flashSub: { color: colors.ink, fontFamily: fonts.serif, fontSize: 18, marginTop: space.sm, fontStyle: 'italic' },
});
