import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isFresh, UNDO_MS } from '../domain/undo';
import { useApp } from '../state/AppStateContext';
import { copy } from './copy';
import { colors, fonts, space } from './theme';

/** A quiet bar at the bottom after a tap that's easy to regret. Gone on its own. */
export function UndoBar() {
  const { undo, undoLast } = useApp();
  const insets = useSafeAreaInsets();
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!undo) return;
    const left = UNDO_MS - (Date.now() - Date.parse(undo.at));
    if (left <= 0) return;
    const t = setTimeout(() => rerender((n) => n + 1), left);
    return () => clearTimeout(t);
  }, [undo]);
  if (!isFresh(undo, Date.now())) return null;
  return (
    <View style={[st.wrap, { bottom: insets.bottom + space.md }]} pointerEvents="box-none">
      <View style={st.bar} accessibilityLiveRegion="polite">
        <Text style={st.text}>{undo.label}</Text>
        <Pressable accessibilityRole="button" onPress={undoLast} hitSlop={12} style={st.btn}>
          <Text style={st.btnText}>{copy.undo}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md, alignItems: 'center' },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, maxWidth: 480, width: '100%',
    backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 12,
    paddingLeft: space.md, paddingRight: space.xs, paddingVertical: space.xs,
  },
  text: { flex: 1, color: colors.ink, fontFamily: fonts.sans, fontSize: 15 },
  btn: { paddingHorizontal: space.md, paddingVertical: 10 },
  btnText: { color: colors.accent, fontFamily: fonts.sans, fontSize: 15, fontWeight: '600' },
});
