/**
 * All state changes, as a pure reducer. Every action carries its own timestamp
 * so the reducer stays deterministic and testable.
 */
import { inferEnergy, categorize } from './classify';
import { defaultRawMinutes, estimateDuration } from './duration';
import { generateFirstStep, nextAlternative, shrinkFirstStep, validateFirstStep } from './firstStep';
import type {
  Becoming, EnergyCost, EnergyLevel, ID, ISODateTime, LooseCadence, OnboardingState, RecurrenceAnswer,
  RecurrenceFollowUp, RecurrenceSettings, RecurrenceVerdict, Routine, Task, TaskEvent, TaskEventType, UserProfile,
} from './model';
import { applyAnswer, isRoutineDue, localDay, looserCadence, newRoutine } from './recurrence';

export const SLIP_PROMPT_AFTER = 3;

export interface AppState {
  version: 1;
  tasks: Task[];
  events: TaskEvent[];
  energy?: EnergyLevel;
  /** The task the user explicitly pulled onto the Now card, if any. */
  pinnedNowId?: ID;
  profile: UserProfile;
  becomings: Becoming[];
  routines: Routine[];
  verdicts: RecurrenceVerdict[];
  recurrence: RecurrenceSettings;
  onboarding: OnboardingState;
}

export const MAX_BECOMINGS = 3;

export const initialState: AppState = {
  version: 1,
  tasks: [],
  events: [],
  profile: {
    knownTools: {},
    estimateCalibration: { deep: 1.5, medium: 1.5, autopilot: 1.5 },
  },
  becomings: [],
  routines: [],
  verdicts: [],
  // Off until the person opts in. Never a daily ritual by default.
  recurrence: { enabled: false, maxQuestionsPerSession: 3, dismissStreak: 0, askedAboutFrequency: false },
  onboarding: {},
};

/** Fills fields added after a state was saved, so older saves keep working. */
export function migrate(saved: Partial<AppState> & { version: 1 }): AppState {
  return {
    ...initialState,
    ...saved,
    profile: { ...initialState.profile, ...saved.profile },
    recurrence: { ...initialState.recurrence, ...saved.recurrence },
    onboarding: { ...initialState.onboarding, ...saved.onboarding },
  };
}

export type Action =
  | { type: 'capture'; at: ISODateTime; id: ID; title: string }
  | { type: 'open'; at: ISODateTime; taskId: ID }
  | { type: 'first_step_done'; at: ISODateTime; taskId: ID }
  | { type: 'complete'; at: ISODateTime; taskId: ID }
  | { type: 'not_now'; at: ISODateTime; taskId: ID }
  /** "That counts. Stop here." Steps aside without counting as a slip. */
  | { type: 'pause'; at: ISODateTime; taskId: ID }
  | { type: 'shrink'; at: ISODateTime; taskId: ID }
  | { type: 'next_alternative'; at: ISODateTime; taskId: ID }
  | { type: 'edit_step'; at: ISODateTime; taskId: ID; text: string }
  | { type: 'release'; at: ISODateTime; taskId: ID }
  | { type: 'keep_anyway'; at: ISODateTime; taskId: ID }
  | { type: 'pin_now'; at: ISODateTime; taskId: ID }
  | { type: 'set_energy'; at: ISODateTime; level: EnergyLevel | undefined }
  /** Onboarding's "not now": out of sight, fully retrievable. */
  | { type: 'rest'; at: ISODateTime; taskId: ID }
  | { type: 'complete_onboarding'; at: ISODateTime }
  | { type: 'add_becoming'; at: ISODateTime; id: ID; statement: string }
  | { type: 'edit_becoming'; at: ISODateTime; id: ID; statement: string }
  | { type: 'outgrow_becoming'; at: ISODateTime; id: ID }
  | { type: 'link_task_becoming'; at: ISODateTime; taskId: ID; becomingId: ID }
  | { type: 'add_routine'; at: ISODateTime; id: ID; title: string; cadence: LooseCadence }
  /** Spawns tasks for routines that are due. Ids are derived, so ticking twice is harmless. */
  | { type: 'tick'; at: ISODateTime }
  | { type: 'set_recurrence_enabled'; at: ISODateTime; enabled: boolean }
  | { type: 'start_recurrence_session'; at: ISODateTime }
  | { type: 'dismiss_recurrence_session'; at: ISODateTime }
  | { type: 'set_recurrence_frequency'; at: ISODateTime; choice: 'same' | 'less' | 'off' }
  | { type: 'answer_recurrence'; at: ISODateTime; id: ID; routineId: ID; answer: RecurrenceAnswer }
  | { type: 'follow_up_recurrence'; at: ISODateTime; routineId: ID; followUp: RecurrenceFollowUp }
  | { type: 'reshape_routine'; at: ISODateTime; routineId: ID; title: string }
  /** becomingId null = "skip"; it still records that we asked. */
  | { type: 'link_routine_becoming'; at: ISODateTime; routineId: ID; becomingId: ID | null };

let eventSeq = 0;
function eventId(at: ISODateTime): ID {
  eventSeq = (eventSeq + 1) % 1_000_000;
  return `${Date.parse(at).toString(36)}-${eventSeq.toString(36)}`;
}

function logEvent(state: AppState, taskId: ID, type: TaskEventType, at: ISODateTime, meta?: Record<string, unknown>): TaskEvent[] {
  return [...state.events, { id: eventId(at), taskId, type, at, energyNow: state.energy, meta }];
}

function updateTask(state: AppState, taskId: ID, at: ISODateTime, fn: (t: Task) => Task): Task[] {
  return state.tasks.map((t) => (t.id === taskId ? { ...fn(t), updatedAt: at } : t));
}

function updateRoutine(state: AppState, routineId: ID, at: ISODateTime, fn: (r: Routine) => Routine): Routine[] {
  return state.routines.map((r) => (r.id === routineId ? { ...fn(r), updatedAt: at } : r));
}

export function createTask(id: ID, title: string, at: ISODateTime, profile: UserProfile): Task {
  const clean = title.trim().replace(/\s+/g, ' ');
  const energy: EnergyCost = inferEnergy(clean);
  const raw = defaultRawMinutes(energy, categorize(clean));
  return {
    id,
    createdAt: at,
    updatedAt: at,
    title: clean,
    state: 'open',
    firstStep: generateFirstStep(clean, profile),
    energy,
    energySource: 'inferred',
    duration: estimateDuration(raw, profile.estimateCalibration[energy]),
    stats: { timesSurfaced: 0, timesSlipped: 0, timesShrunk: 0 },
    decayAfterDays: 21,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  const { at } = action;
  switch (action.type) {
    case 'capture': {
      if (!action.title.trim()) return state;
      const task = createTask(action.id, action.title, at, state.profile);
      return { ...state, tasks: [...state.tasks, task], events: logEvent(state, task.id, 'created', at) };
    }

    case 'open': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      // Only the first open counts: start latency runs from when the card first appeared.
      if (!task || task.openedAt) return state;
      return {
        ...state,
        tasks: updateTask(state, task.id, at, (t) => ({
          ...t,
          openedAt: at,
          stats: { ...t.stats, timesSurfaced: t.stats.timesSurfaced + 1 },
        })),
        events: logEvent(state, task.id, 'opened', at),
      };
    }

    case 'first_step_done': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task || task.firstStep.doneAt) return state;
      const latencySec = task.openedAt
        ? Math.max(0, Math.round((Date.parse(at) - Date.parse(task.openedAt)) / 1000))
        : undefined;
      return {
        ...state,
        tasks: updateTask(state, task.id, at, (t) => ({
          ...t,
          state: 'started',
          openedAt: undefined,
          firstStep: { ...t.firstStep, doneAt: at },
          stats: {
            ...t.stats,
            firstStartedAt: t.stats.firstStartedAt ?? at,
            lastStartLatencySec: latencySec ?? t.stats.lastStartLatencySec,
          },
        })),
        events: logEvent(state, task.id, 'first_step_done', at, latencySec === undefined ? undefined : { latencySec }),
      };
    }

    case 'complete': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      return {
        ...state,
        routines: task.routineId
          ? updateRoutine(state, task.routineId, at, (r) => ({ ...r, lastDoneAt: at }))
          : state.routines,
        pinnedNowId: state.pinnedNowId === action.taskId ? undefined : state.pinnedNowId,
        tasks: updateTask(state, action.taskId, at, (t) => ({ ...t, state: 'done', openedAt: undefined })),
        events: logEvent(state, action.taskId, 'completed', at),
      };
    }

    case 'not_now': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const slipped = task.stats.timesSlipped + 1;
      return {
        ...state,
        pinnedNowId: state.pinnedNowId === task.id ? undefined : state.pinnedNowId,
        tasks: updateTask(state, task.id, at, (t) => ({
          ...t,
          openedAt: undefined,
          lastDeferredAt: at,
          slipPromptPending: slipped >= SLIP_PROMPT_AFTER && slipped % SLIP_PROMPT_AFTER === 0,
          stats: { ...t.stats, timesSlipped: slipped },
        })),
        events: logEvent(state, task.id, 'slipped', at),
      };
    }

    case 'pause': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        pinnedNowId: state.pinnedNowId === action.taskId ? undefined : state.pinnedNowId,
        tasks: updateTask(state, action.taskId, at, (t) => ({ ...t, openedAt: undefined, lastDeferredAt: at })),
      };
    }

    case 'shrink': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const smaller = shrinkFirstStep(task.title, task.firstStep, state.profile);
      return {
        ...state,
        tasks: updateTask(state, task.id, at, (t) => ({
          ...t,
          // Out of smaller steps: the slip question ("built wrong, not you") takes over.
          firstStep: smaller ?? t.firstStep,
          slipPromptPending: smaller ? t.slipPromptPending : true,
          stats: { ...t.stats, timesShrunk: t.stats.timesShrunk + 1 },
        })),
        events: logEvent(state, task.id, 'shrunk', at, { depth: smaller?.shrinkDepth ?? 'reshape' }),
      };
    }

    case 'next_alternative': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        tasks: updateTask(state, action.taskId, at, (t) => ({ ...t, firstStep: nextAlternative(t.firstStep) })),
        events: logEvent(state, action.taskId, 'alternative_shown', at),
      };
    }

    case 'edit_step': {
      const text = action.text.trim();
      if (!text || !state.tasks.some((t) => t.id === action.taskId)) return state;
      // The user's own words always win; validation is only recorded, never enforced on them.
      const check = validateFirstStep(text);
      return {
        ...state,
        tasks: updateTask(state, action.taskId, at, (t) => ({
          ...t,
          firstStep: { ...t.firstStep, text, verb: text.split(/\s+/)[0].toLowerCase(), source: 'user' },
        })),
        events: logEvent(state, action.taskId, 'step_edited', at, { passesRules: check.ok }),
      };
    }

    case 'release': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        pinnedNowId: state.pinnedNowId === action.taskId ? undefined : state.pinnedNowId,
        tasks: updateTask(state, action.taskId, at, (t) => ({ ...t, state: 'released', openedAt: undefined, slipPromptPending: false })),
        events: logEvent(state, action.taskId, 'released', at),
      };
    }

    case 'keep_anyway':
      return { ...state, tasks: updateTask(state, action.taskId, at, (t) => ({ ...t, slipPromptPending: false })) };

    case 'pin_now':
      return state.tasks.some((t) => t.id === action.taskId) ? { ...state, pinnedNowId: action.taskId } : state;

    case 'set_energy':
      return { ...state, energy: action.level };

    case 'rest':
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        pinnedNowId: state.pinnedNowId === action.taskId ? undefined : state.pinnedNowId,
        tasks: updateTask(state, action.taskId, at, (t) => ({ ...t, state: 'resting', openedAt: undefined })),
      };

    case 'complete_onboarding':
      return { ...state, onboarding: { ...state.onboarding, completedAt: state.onboarding.completedAt ?? at } };

    case 'add_becoming': {
      const statement = action.statement.trim();
      const active = state.becomings.filter((b) => b.status === 'active');
      if (!statement || active.length >= MAX_BECOMINGS) return state;
      return { ...state, becomings: [...state.becomings, { id: action.id, createdAt: at, statement, status: 'active' }] };
    }

    case 'edit_becoming': {
      const statement = action.statement.trim();
      if (!statement) return state;
      return { ...state, becomings: state.becomings.map((b) => (b.id === action.id ? { ...b, statement } : b)) };
    }

    case 'outgrow_becoming':
      return { ...state, becomings: state.becomings.map((b) => (b.id === action.id ? { ...b, status: 'outgrown' } : b)) };

    case 'link_task_becoming':
      return {
        ...state,
        tasks: updateTask(state, action.taskId, at, (t) => ({
          ...t,
          becomingIds: [...new Set([...(t.becomingIds ?? []), action.becomingId])],
        })),
      };

    case 'add_routine': {
      if (!action.title.trim()) return state;
      const routine = newRoutine(action.id, action.title, action.cadence, at);
      return reducer({ ...state, routines: [...state.routines, routine] }, { type: 'tick', at });
    }

    case 'tick': {
      const due = state.routines.filter((r) => isRoutineDue(r, state.tasks, at));
      if (!due.length) return state;
      const spawned = due.map((r) => ({
        ...createTask(`${r.id}@${localDay(at)}`, r.title, at, state.profile),
        routineId: r.id,
        becomingIds: r.becomingIds,
      }));
      const fresh = spawned.filter((t) => !state.tasks.some((x) => x.id === t.id));
      if (!fresh.length) return state;
      return {
        ...state,
        tasks: [...state.tasks, ...fresh],
        events: fresh.reduce((events, t) => [...events, { id: eventId(at), taskId: t.id, type: 'created' as const, at }], state.events),
      };
    }

    case 'set_recurrence_enabled':
      return { ...state, recurrence: { ...state.recurrence, enabled: action.enabled, dismissStreak: 0 } };

    case 'start_recurrence_session':
      return { ...state, recurrence: { ...state.recurrence, lastSessionDay: localDay(at) } };

    case 'dismiss_recurrence_session':
      return {
        ...state,
        recurrence: { ...state.recurrence, lastSessionDay: localDay(at), dismissStreak: state.recurrence.dismissStreak + 1 },
      };

    case 'set_recurrence_frequency': {
      const rec = { ...state.recurrence, askedAboutFrequency: true, dismissStreak: 0 };
      if (action.choice === 'less') rec.maxQuestionsPerSession = 1;
      if (action.choice === 'off') rec.enabled = false;
      return { ...state, recurrence: rec };
    }

    case 'answer_recurrence': {
      if (!state.routines.some((r) => r.id === action.routineId)) return state;
      const verdict: RecurrenceVerdict = {
        id: action.id, routineId: action.routineId, askedAt: at, answer: action.answer, energyNow: state.energy,
      };
      return {
        ...state,
        verdicts: [...state.verdicts, verdict],
        routines: updateRoutine(state, action.routineId, at, (r) => applyAnswer(r, action.answer, at)),
        recurrence: action.answer === 'skipped' ? state.recurrence : { ...state.recurrence, dismissStreak: 0 },
      };
    }

    case 'follow_up_recurrence': {
      const routine = state.routines.find((r) => r.id === action.routineId);
      if (!routine) return state;
      const lastIdx = state.verdicts.map((v) => v.routineId).lastIndexOf(routine.id);
      const verdicts = lastIdx < 0 ? state.verdicts : state.verdicts.map((v, i) => (i === lastIdx ? { ...v, followUp: action.followUp } : v));
      let routines = state.routines;
      let tasks = state.tasks;
      switch (action.followUp) {
        case 'make_rarer':
          routines = updateRoutine(state, routine.id, at, (r) => ({ ...r, cadence: looserCadence(r.cadence) }));
          break;
        case 'mark_toll_and_lighten':
          routines = updateRoutine(state, routine.id, at, (r) => ({ ...r, nature: 'toll' }));
          break;
        case 'reshape':
          routines = updateRoutine(state, routine.id, at, (r) => ({ ...r, recurrence: { ...r.recurrence, standing: 'reshaping' } }));
          break;
        case 'release':
          routines = updateRoutine(state, routine.id, at, (r) => ({ ...r, status: 'released' }));
          // Its open occurrence goes with it, quietly.
          tasks = state.tasks.map((t) =>
            t.routineId === routine.id && (t.state === 'open' || t.state === 'started') ? { ...t, state: 'released', updatedAt: at } : t);
          break;
        case 'later':
          // "Ask me again on a better day."
          routines = updateRoutine(state, routine.id, at, (r) => ({
            ...r, recurrence: { ...r.recurrence, nextEligibleAt: new Date(Date.parse(at) + 86_400_000).toISOString() },
          }));
          break;
        case 'keep_anyway':
          break;
      }
      return { ...state, verdicts, routines, tasks };
    }

    case 'reshape_routine': {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        routines: updateRoutine(state, action.routineId, at, (r) => ({ ...r, title, recurrence: { ...r.recurrence, standing: 'reshaping' } })),
        // The current occurrence takes the new shape too, with a fresh first step.
        tasks: state.tasks.map((t) =>
          t.routineId === action.routineId && t.state === 'open'
            ? { ...createTask(t.id, title, t.createdAt, state.profile), routineId: t.routineId, becomingIds: t.becomingIds, stats: t.stats, updatedAt: at }
            : t),
      };
    }

    case 'link_routine_becoming':
      return {
        ...state,
        routines: updateRoutine(state, action.routineId, at, (r) => ({
          ...r,
          becomingIds: action.becomingId ? [...new Set([...r.becomingIds, action.becomingId])] : r.becomingIds,
          recurrence: { ...r.recurrence, lastLinkPromptAt: at },
        })),
        tasks: action.becomingId
          ? state.tasks.map((t) =>
              t.routineId === action.routineId ? { ...t, becomingIds: [...new Set([...(t.becomingIds ?? []), action.becomingId!])] } : t)
          : state.tasks,
      };
  }
}
