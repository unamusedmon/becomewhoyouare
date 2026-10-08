/**
 * WebDAV sync, for the phone and the web version alike. One JSON file holds the
 * synced state; an optional .org file mirrors it for Emacs or Orgzly, and edits
 * made there come back in (src/domain/org.ts). Merging rules: src/domain/sync.ts.
 *
 * Credentials live on this device only (AsyncStorage on Android, localStorage on the
 * web) and are never part of the synced state.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';

import { editsSince, renderOrg } from '../domain/org';
import { reducer, type Action, type AppState } from '../domain/reducer';
import { mergeStates, parseRemote, toRemote } from '../domain/sync';
import { davGet, davPut, type DavConfig } from './webdav';
import { newId, type Dispatch } from './useAppState';

export const DATA_FILE = 'become-who-you-are.json';
export const ORG_FILE = 'become-who-you-are.org';
const CONFIG_KEY = 'bwya/sync/v1';

/** After a change, wait this long for more before syncing. */
const DEBOUNCE_MS = 15_000;
/** While the app is open, check for the other device's changes this often. */
const POLL_MS = 5 * 60_000;

export interface SyncConfig extends DavConfig {
  enabled: boolean;
  org: boolean;
}

export interface SyncStatus {
  syncing: boolean;
  lastSyncedAt?: string;
  error?: string;
}

export interface SyncControls {
  config?: SyncConfig;
  status: SyncStatus;
  save: (config: SyncConfig) => Promise<void>;
  syncNow: () => void;
}

class SyncError extends Error {}

function explain(status: number): string {
  if (status === 401 || status === 403) return 'The server said no to that username or password.';
  if (status === 404 || status === 409) return "That folder doesn't exist on the server. Create it first.";
  return `The server answered ${status}.`;
}

/** One full round: read, merge, apply Org edits, write back. Returns the state that was written. */
export async function syncOnce(cfg: SyncConfig, local: AppState): Promise<AppState> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const got = await davGet(cfg, DATA_FILE);
    if (got.status !== 200 && got.status !== 404) throw new SyncError(explain(got.status));
    const remote = got.status === 200 && got.text ? parseRemote(got.text) : undefined;
    if (got.status === 200 && !remote) throw new SyncError(`${DATA_FILE} on the server isn't a file this app wrote.`);

    const now = new Date().toISOString();
    let merged = remote ? mergeStates(local, remote.state) : local;

    if (cfg.org && remote) {
      const org = await davGet(cfg, ORG_FILE);
      if (org.status === 200 && org.text !== undefined) {
        const edits = editsSince(org.text, remote, merged, newId);
        merged = edits.reduce((s, a) => reducer(s, { ...a, at: now } as Action), merged);
      }
    }

    const put = await davPut(cfg, DATA_FILE, JSON.stringify(toRemote(merged, now)), 'application/json',
      remote ? { ifMatch: got.etag } : { create: true });
    // Someone else wrote in between: read their version and go again.
    if (put.status === 412 && attempt === 0) { local = merged; continue; }
    if (put.status < 200 || put.status >= 300) throw new SyncError(explain(put.status));

    if (cfg.org) {
      const wrote = await davPut(cfg, ORG_FILE, renderOrg(merged, now), 'text/plain; charset=utf-8');
      if (wrote.status < 200 || wrote.status >= 300) throw new SyncError(`Synced, but the .org file couldn't be written: ${explain(wrote.status)}`);
    }
    return merged;
  }
  throw new SyncError('Another device kept writing at the same moment. Try again.');
}

/** Keeps this device in sync while the app is open. */
export function useSync(state: AppState, hydrated: boolean, dispatch: Dispatch): SyncControls {
  const [config, setConfig] = useState<SyncConfig | undefined>();
  const [status, setStatus] = useState<SyncStatus>({ syncing: false });
  const stateRef = useRef(state);
  stateRef.current = state;
  const running = useRef(false);
  const syncedChange = useRef<string | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(CONFIG_KEY)
      .then((json) => { if (json) setConfig(JSON.parse(json) as SyncConfig); })
      .catch(() => undefined);
  }, []);

  const run = useCallback(async (cfg: SyncConfig | undefined) => {
    if (!cfg?.enabled || !cfg.url || running.current) return;
    running.current = true;
    setStatus((s) => ({ ...s, syncing: true }));
    try {
      const written = await syncOnce(cfg, stateRef.current);
      dispatch({ type: 'sync_merge', remote: written });
      syncedChange.current = written.changedAt;
      setStatus({ syncing: false, lastSyncedAt: new Date().toISOString() });
    } catch (e) {
      const message = e instanceof SyncError ? e.message : "Couldn't reach the server. It'll try again later.";
      setStatus((s) => ({ ...s, syncing: false, error: message }));
    } finally {
      running.current = false;
    }
  }, [dispatch]);

  // On start, on return to the app, and now and then while open.
  useEffect(() => {
    if (!hydrated || !config?.enabled) return;
    void run(config);
    const timer = setInterval(() => void run(config), POLL_MS);
    const sub = RNAppState.addEventListener('change', (s) => { if (s === 'active') void run(config); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [hydrated, config, run]);

  // A little while after something changes here.
  useEffect(() => {
    if (!hydrated || !config?.enabled || !state.changedAt || state.changedAt === syncedChange.current) return;
    const timer = setTimeout(() => void run(config), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [hydrated, config, state.changedAt, run]);

  const save = useCallback(async (next: SyncConfig) => {
    setConfig(next);
    setStatus({ syncing: false });
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(next)).catch(() => undefined);
    if (next.enabled) void run(next);
  }, [run]);

  const syncNow = useCallback(() => void run(config), [run, config]);

  return { config, status, save, syncNow };
}
