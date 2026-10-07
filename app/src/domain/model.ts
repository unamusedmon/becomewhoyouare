/**
 * The slice of the data model this first build implements.
 * Full design reference: docs/design/01-data-model.ts. Names and shapes match it,
 * so later slices extend these types rather than replace them.
 */

export type ID = string;
export type ISODateTime = string;
export type Minutes = number;

export type EnergyCost = 'deep' | 'medium' | 'autopilot';
export type EnergyLevel = 'high' | 'medium' | 'low' | 'fried';

export type TaskState = 'open' | 'started' | 'done' | 'resting' | 'released';

export type DurationUnitId =
  | 'song' | 'episode_sitcom' | 'podcast' | 'episode_drama' | 'laundry_wash' | 'movie';

export interface DurationUnit {
  id: DurationUnitId;
  singular: string; // "song"
  plural: string;   // "songs"
  minutes: Minutes;
}

export interface DurationEstimate {
  rawMinutes: Minutes;
  plannedMinutes: Minutes;
  experiential: { unitId: DurationUnitId; count: number; label: string };
  confidence: 'guess' | 'learned';
}

export interface FirstStep {
  text: string;
  verb: string;
  object?: string;
  estSeconds: number;
  source: 'generated' | 'user' | 'template';
  shrinkDepth: number;
  alternatives?: string[];
  doneAt?: ISODateTime;
}

export interface TaskStats {
  timesSurfaced: number;
  timesSlipped: number; // in this slice: times the user tapped "not now"
  timesShrunk: number;
  firstStartedAt?: ISODateTime;
  lastStartLatencySec?: number;
}

export interface Task {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  title: string;
  state: TaskState;
  firstStep: FirstStep;
  energy: EnergyCost;
  energySource: 'inferred' | 'user';
  duration: DurationEstimate;
  stats: TaskStats;
  /** When the task card was last put in front of the user; start latency is measured from here. */
  openedAt?: ISODateTime;
  /** Last "not now"; the planner puts recently deferred tasks behind the others. */
  lastDeferredAt?: ISODateTime;
  /** True while the slip question is waiting for an answer. */
  slipPromptPending?: boolean;
  decayAfterDays: number;
}

export type TaskEventType =
  | 'created' | 'opened' | 'first_step_done' | 'completed'
  | 'slipped' | 'shrunk' | 'released' | 'alternative_shown' | 'step_edited';

export interface TaskEvent {
  id: ID;
  taskId: ID;
  type: TaskEventType;
  at: ISODateTime;
  energyNow?: EnergyLevel;
  meta?: Record<string, unknown>;
}

export interface UserProfile {
  knownTools: { mail?: string; docs?: string; calendar?: string };
  /** Starts at 1.5: generous buffers by default (planning fallacy). */
  estimateCalibration: Record<EnergyCost, number>;
}
