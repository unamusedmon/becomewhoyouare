import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import type { AppState } from '../domain/reducer';
import { useAppState, type Dispatch } from './useAppState';

interface Ctx {
  state: AppState;
  hydrated: boolean;
  dispatch: Dispatch;
}

const AppStateContext = createContext<Ctx | null>(null);

const TICK_MS = 60_000;

/** Holds app state for every screen, and keeps routines spawning their tasks on time. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const value = useAppState();
  const { hydrated, dispatch } = value;

  useEffect(() => {
    if (!hydrated) return;
    dispatch({ type: 'tick' });
    const timer = setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && dispatch({ type: 'tick' }));
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [hydrated, dispatch]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider');
  return ctx;
}
