import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { setThemeMode, type ThemeMode } from '../ui/theme';

/** Per device: the phone at night and a laptop at noon can differ. Never synced. */
const KEY = 'bwya/theme/v1';

function stored(value: string | null | undefined): ThemeMode | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

export interface ThemeControls {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Dark unless this device opted into light. */
export function useThemeMode(): ThemeControls {
  const [mode, setState] = useState<ThemeMode>(() => {
    setThemeMode('dark');
    return 'dark';
  });

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { const m = stored(v); if (m) { setThemeMode(m); setState(m); } })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setThemeMode(next);
    setState(next);
    void AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  return { mode, setMode };
}
