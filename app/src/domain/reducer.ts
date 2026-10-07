/**
 * All state changes, as a pure reducer. Every action carries its own timestamp
 * so the reducer stays deterministic and testable.
 */
import { inferEnergy, categorize } from './classify';
import { defaultRawMinutes, estimateDuration } from './duration';
import { generateFirstStep, nextAlternative, shrinkFirstStep, validateFirstStep } from './firstStep';
import type { EnergyCost, EnergyLevel, ID, ISODateTime, Task, TaskEvent, TaskEventType, UserProfile } from './model';

export const SLIP_PROMPT_AFTER = 3;

export interface AppState {
  version: 1;
  tasks: Task[];
  events: TaskEvent[];
  energy?: EnergyLevel;
  /** The task the user explicitly pulled onto the Now card, if any. */
  pinnedNowId?: ID;
  profile: UserProfile;
}

export const initialState: AppState = {
  version: 1,
  tasks: [],
  events: [],
  profile: {
    knownTools: {},
    estimateCalibration: { deep: 1.5, medium: 1.5, autopilot: 1.5 },
  },
};

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
  | { type: 'set_energy'; at: ISODateTime; level: EnergyLevel | undefined };

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
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
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
  }
}
