import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, space } from './theme';

/** Shared page frame: dark, one column, readable width on web. */
export function Screen({ children, nav }: { children: ReactNode; nav?: { href: '/' | '/becoming'; label: string } }) {
  return (
    <View style={st.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          {nav ? (
            <View style={st.top}>
              <Text style={st.brand}>Become Who You Are</Text>
              <Link href={nav.href} style={st.nav}>{nav.label}</Link>
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export const screenStyles = StyleSheet.create({
  h1: { color: colors.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 38 },
  h2: { color: colors.ink, fontFamily: fonts.serif, fontSize: 22, lineHeight: 29 },
  body: { color: colors.ink, fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, opacity: 0.85 },
  aphorism: { color: colors.muted, fontFamily: fonts.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 23, marginBottom: space.xs },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.md, paddingTop: space.xl + space.md, paddingBottom: space.xl, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  brand: { color: colors.faint, fontFamily: fonts.serif, fontSize: 15, letterSpacing: 1, fontStyle: 'italic' },
  nav: { color: colors.accent, fontFamily: fonts.sans, fontSize: 15 },
});
