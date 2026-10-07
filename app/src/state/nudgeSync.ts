/**
 * The only place that talks to the phone's notification system. It mirrors the
 * pure plan from domain/nudges.ts: whenever the plan changes, clear and reschedule.
 * Local notifications only; nothing is sent to a server. Web does nothing.
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { planNudges, type PlannedNudge } from '../domain/nudges';
import type { AppState } from '../domain/reducer';
import { colors } from '../ui/theme';
import type { Dispatch } from './useAppState';

const CHANNEL = 'nudges';
const supported = Platform.OS !== 'web';

if (supported) {
  // Shown quietly if the app is open: no sound, no badge.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Nudges',
    description: 'Times you planned, and at most one daily nudge.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: colors.accent,
    vibrationPattern: [0, 120],
  });
}

/** Asks Android (13+) for permission. The channel must exist first or the prompt never shows. */
export async function requestNudgePermission(): Promise<boolean> {
  if (!supported) return false;
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function schedule(plan: PlannedNudge[]): Promise<void> {
  await ensureChannel();
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, data: { taskId: n.taskId, kind: n.kind } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at), channelId: CHANNEL },
    });
  }
}

/** Keeps scheduled notifications in step with state, and turns a tap into the right Now card. */
export function useNudgeSync(state: AppState, hydrated: boolean, dispatch: Dispatch): void {
  const lastKey = useRef<string | null>(null);
  const handled = useRef<string | null>(null);
  const response = supported ? Notifications.useLastNotificationResponse() : null;

  // The plan only changes when something relevant changes; the key keeps us from rescheduling every tick.
  const plan = hydrated ? planNudges(state, new Date().toISOString()) : [];
  const key = JSON.stringify([state.nudges.enabled, plan.map((n) => [n.id, n.at, n.title, n.body])]);

  useEffect(() => {
    if (!supported || !hydrated || key === lastKey.current) return;
    lastKey.current = key;
    const run = state.nudges.enabled ? schedule(plan) : Notifications.cancelAllScheduledNotificationsAsync();
    // Scheduling can fail (permission revoked, OS limits). The app works the same without it.
    run.catch(() => {});
  }, [key, hydrated]);

  useEffect(() => {
    if (!hydrated || !response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const data = response.notification.request.content.data as { taskId?: string; kind?: string } | undefined;
    if (!data?.taskId) return;
    if (data.kind === 'intention') dispatch({ type: 'fire_intention', taskId: data.taskId });
    else dispatch({ type: 'pin_now', taskId: data.taskId });
    router.navigate('/');
  }, [response, hydrated, dispatch]);
}
