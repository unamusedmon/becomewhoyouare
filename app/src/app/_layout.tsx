import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppStateProvider } from '../state/AppStateContext';
import { colors } from '../ui/theme';
import { UndoBar } from '../ui/UndoBar';

export default function RootLayout() {
  return (
    <AppStateProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
        {/* Quick add floats over whatever screen you were on. Also reachable as becomewhoyouare://add. */}
        <Stack.Screen
          name="add"
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
        />
      </Stack>
      <UndoBar />
    </AppStateProvider>
  );
}
