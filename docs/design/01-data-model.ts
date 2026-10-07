/**
 * Become Who You Are — core data model (v0.1, design draft)
 *
 * Shape of the whole thing, in one paragraph:
 *   A person names who they are BECOMING. Everything else hangs off that.
 *   Raw CAPTURES (voice/text, zero friction) become TASKS. Every task carries
 *   a FIRST STEP (a tiny physical action), an optional IMPLEMENTATION INTENTION
 *   (when/where/how), an ENERGY COST, and a DURATION expressed in lived units.
 *   Everything that happens to a task is an append-only TASK EVENT. Those events
 *   are the raw material for three things the app cares about more than
 *   completion counts: SLIP PATTERNS (data, not sin), RECURRENCE VERDICTS
 *   (does this belong in a life you'd live again?), and OVERCOMING EVIDENCE
 *   (proof you're becoming more capable — mainly: you start faster now).
 *
 * Conventions
 *   - IDs are opaque strings (ULIDs recommended: sortable, offline-safe).
 *   - All timestamps are ISO-8601 strings in UTC; display in the user's zone.
 *   - Offline-first: every entity has `updatedAt` + `deletedAt` for sync.
 *   - Nothing is ever "overdue". There is no overdue field. On purpose.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

export type ID = string;          // ULID
export type ISODateTime = string; // "2026-10-07T01:00:00Z"
export type ISODate = string;     // "2026-10-07"
export type Minutes = number;

interface Syncable {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime; // soft delete; hard-purged after 30 days
}

// ─────────────────────────────────────────────────────────────────────────────
// The person and who they are becoming
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile extends Syncable {
  displayName?: string;
  timeZone: string; // IANA, e.g. "America/Chicago"

  /** Lived-time units this person actually relates to (see DurationUnit). */
  preferredDurationUnits: DurationUnitId[];

  /** Tools/places they really use, so first steps can be concrete:
   *  "Gmail", "VS Code", "the kitchen table", "Notion". Learned + editable. */
  knownTools: string[];
  knownPlaces: string[];

  /** Multiplier learned from their own estimate-vs-actual history.
   *  Starts at 1.5 (generous buffer), converges per energy tier. */
  estimateCalibration: Record<EnergyCost, number>;

  settings: UserSettings;
}

export interface UserSettings {
  /** The recurrence question is OFF unless the user opts in during or after onboarding. */
  recurrenceTriage: {
    enabled: boolean;
    /** When to ask. "after_first_completion" = ride an existing win. */
    moment: 'morning' | 'evening' | 'after_first_completion' | 'manual_only';
    maxQuestionsPerSession: number; // default 3, hard cap 7
  };
  aphorisms: 'on' | 'rare' | 'off';      // default 'rare' (≤1 per screen, ≤3 per day)
  bodyDoubling: 'off' | 'ambient' | 'live'; // see 05-additional-science.md
  nudges: NudgeSettings;
  /** Optional, private, never required. Lets energy planning account for stimulant
   *  onset/peak/wear-off if the user wants it to. Stored on device only. */
  medicationWindow?: { onsetMin: Minutes; peakMin: Minutes; durationMin: Minutes };
  quietHours: { start: string; end: string }; // "22:00"–"08:00" local
  themeRotation: 'weekly' | 'monthly' | 'off';
}

export interface NudgeSettings {
  maxPerDay: number;        // default 6; nudges are a scarce resource
  timeRemainingNudges: boolean; // "about one episode left before you need to leave"
  transitionWarnings: boolean;  // warn 10 / 3 min before a hard switch (hyperfocus-safe)
}

/**
 * "Become who you are." A user can hold 1–3 of these at once.
 * Not goals. Identities-in-progress: "a writer", "a father who is present",
 * "someone whose apartment feels like a home".
 */
export interface Becoming extends Syncable {
  statement: string;          // "someone who finishes what they start writing"
  why?: string;               // optional, user's own words
  /** Optional imagery the app can reflect back (WOOP-style mental contrasting). */
  obstacle?: string;          // "I stall when the blank page is open"
  ifThenPlan?: string;        // "If I stall for 5 min, then I write one ugly sentence"
  status: 'active' | 'resting' | 'outgrown'; // "outgrown" is honorable, not failure
}

// ─────────────────────────────────────────────────────────────────────────────
// Capture: the zero-friction front door (working-memory externalization)
// ─────────────────────────────────────────────────────────────────────────────

export interface Capture extends Syncable {
  source: 'voice' | 'text' | 'share_sheet' | 'widget' | 'focus_parking_lot';
  raw: string;               // exactly what they said/typed, never lost
  audioRef?: string;         // local blob ref if voice; transcript lives in `raw`
  /** Semantic embedding for natural-language recall ("that thing about the landlord"). */
  embeddingRef?: string;
  /** What the parser thinks this is. A capture can stay a note forever. Fine. */
  disposition: 'unprocessed' | 'became_task' | 'note' | 'dismissed';
  taskId?: ID;
  /** Entities pulled out for search + concreteness: people, places, tools, dates. */
  entities: { kind: 'person' | 'place' | 'tool' | 'date' | 'org' | 'thing'; text: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Task
// ─────────────────────────────────────────────────────────────────────────────

export type EnergyCost = 'deep' | 'medium' | 'autopilot';

export type TaskState =
  | 'open'      // on the list
  | 'started'   // first step done or timer running; "started" is a real win state
  | 'done'
  | 'resting'   // auto-decayed or user-parked; out of sight, fully retrievable
  | 'released'; // deliberately let go. Not deleted, not failed. Chosen.

export interface Task extends Syncable {
  title: string;              // user's words, lightly cleaned
  notes?: string;
  captureId?: ID;

  state: TaskState;

  /** The heart of the app. Always present (generated on create, editable). */
  firstStep: FirstStep;
  /** Optional chain if the user asks to "break it up". Ordered. */
  steps?: FirstStep[];

  intention?: ImplementationIntention;

  energy: EnergyCost;
  energySource: 'inferred' | 'user';

  duration: DurationEstimate;

  /** Soft or hard. Hard deadlines exist in the world; we don't pretend otherwise.
   *  But a passed deadline changes the copy, never the color to red. */
  deadline?: { at: ISODateTime; kind: 'hard' | 'soft' };
  /** Earliest moment it makes sense to surface (snooze / scheduled). */
  surfaceAfter?: ISODateTime;

  /** "Why does this matter to who you're becoming?" Optional, never required. */
  becomingIds: ID[];
  becomingWhy?: string;

  /** Interest/novelty/urgency/challenge levers the planner can pull (see 05). */
  hooks?: {
    interestNote?: string;        // what's genuinely interesting in it
    pairedReward?: string;        // temptation bundling: "only with the good playlist"
    challengeFrame?: string;      // "can you do it in one episode?"
  };

  /** Set if this task was spawned from a Routine occurrence. */
  routineId?: ID;

  /** Derived, cached for the planner/UI. Recomputed from TaskEvents. */
  stats: TaskStats;

  /** Auto-decay: tasks untouched for `decayAfterDays` drift to 'resting'
   *  with a quiet note — no notification, no guilt. Default 21; hard-deadline tasks never decay. */
  decayAfterDays: number;
}

export interface TaskStats {
  timesSurfaced: number;   // shown on the Now card / today's plan
  timesSlipped: number;    // planned for a day and that day ended without a start
  timesShrunk: number;
  firstSurfacedAt?: ISODateTime;
  firstStartedAt?: ISODateTime;
  /** Seconds from opening the task card to marking the first step done. The key
   *  self-overcoming signal ("you used to take 40 minutes to start writing"). */
  lastStartLatencySec?: number;
  actualMinutesSpent: Minutes;
}

/**
 * A first step is a single, visible, physical action that takes under ~2 minutes
 * and contains no decisions. See 02-first-step-flow.md for the rules and generator.
 */
export interface FirstStep {
  text: string;                  // "Open Gmail and type the subject line"
  verb: string;                  // "open" — must be a physical verb (validated)
  object?: string;               // "Gmail"
  estSeconds: number;            // ≤ 120 by rule
  source: 'generated' | 'user' | 'template';
  /** How many times the user hit "still too big" to get here. Signal for the generator. */
  shrinkDepth: number;
  alternatives?: string[];       // the other 2 candidates, swipeable
  doneAt?: ISODateTime;
}

/** Gollwitzer's when-where-how. All three parts are optional individually;
 *  the UI prompts for them but never blocks on them. */
export interface ImplementationIntention {
  trigger: IntentionTrigger;     // WHEN
  context?: string;              // WHERE: "at my desk"
  action: string;                // HOW: defaults to firstStep.text
  /** Obstacle-based if-then (MCII): "If I open Twitter instead, then I close it and type one bullet." */
  ifObstacle?: { obstacle: string; response: string };
  /** Rendered sentence shown back: "When I finish coffee at my desk, I will open the report and write one bullet." */
  sentence: string;
}

export type IntentionTrigger =
  | { kind: 'event'; text: string }                      // "when I finish coffee" (habit-stacked)
  | { kind: 'time'; at: ISODateTime; text?: string }      // clock time — allowed, never sole support
  | { kind: 'place'; placeLabel: string; geofenceRef?: string }
  | { kind: 'after_task'; taskId: ID };                   // "after I send the invoice"

// ─────────────────────────────────────────────────────────────────────────────
// Time, in units a body can feel (time-blindness accommodation)
// ─────────────────────────────────────────────────────────────────────────────

export type DurationUnitId =
  | 'song' | 'episode_sitcom' | 'episode_drama' | 'laundry_wash' | 'coffee'
  | 'walk_block' | 'podcast' | 'movie' | 'shower' | 'commute' | 'custom';

export interface DurationUnit {
  id: DurationUnitId;
  label: string;        // "one sitcom episode"
  minutes: Minutes;     // 22
  custom?: boolean;     // user can define "one walk to the bodega" = 12 min
}

export interface DurationEstimate {
  /** What the user (or the model) guessed. */
  rawMinutes: Minutes;
  /** rawMinutes × calibration × buffer. This is what the planner uses. */
  plannedMinutes: Minutes;
  /** Rendered: "about two sitcom episodes". Never shown as "1h 4m" alone. */
  experiential: { unitId: DurationUnitId; count: number; label: string };
  confidence: 'guess' | 'learned'; // 'learned' once we have ≥3 similar completions
}

// ─────────────────────────────────────────────────────────────────────────────
// Routines + the eternal recurrence question
// ─────────────────────────────────────────────────────────────────────────────

export interface Routine extends Syncable {
  title: string;
  /** RFC-5545 RRULE, or a loose cadence for ADHD-friendly "about weekly". */
  cadence: { rrule?: string; loose?: 'daily' | 'few_per_week' | 'weekly' | 'monthly' };
  template: Pick<Task, 'firstStep' | 'energy' | 'duration' | 'intention' | 'becomingIds'>;

  /** Not every routine is chosen; some are tolls of being alive (taxes, dishes).
   *  'toll' routines get "how can this weigh less?" instead of "should this exist?". */
  nature: 'chosen' | 'toll' | 'unknown';

  /** Recurrence-question bookkeeping (see 03-recurrence-triage-flow.md). */
  recurrence: {
    lastAskedAt?: ISODateTime;
    nextEligibleAt: ISODateTime;   // spaced: 7d → 21d → 60d after consecutive "yes"
    consecutiveYes: number;
    standing: 'affirmed' | 'questioned' | 'reshaping' | 'unasked';
  };
  status: 'active' | 'paused' | 'released';
}

export interface RecurrenceVerdict extends Syncable {
  routineId?: ID;         // usually a routine…
  taskId?: ID;            // …or a one-off, if the user runs the question on today's list
  askedAt: ISODateTime;
  answer: 'yes' | 'no' | 'unsure' | 'skipped';
  /** What they did about a "no"/"unsure". */
  followUp?: 'reshape' | 'make_rarer' | 'mark_toll_and_lighten' | 'release' | 'keep_anyway' | 'later';
  note?: string;          // optional: "I keep this because my mom likes the calls" — sacred, never analyzed aloud
}

// ─────────────────────────────────────────────────────────────────────────────
// Events: one append-only log; all metrics derive from here
// ─────────────────────────────────────────────────────────────────────────────

export type TaskEventType =
  | 'created' | 'surfaced' | 'opened'
  | 'first_step_done'      // the moment that matters most
  | 'focus_started' | 'focus_ended'
  | 'step_done' | 'completed'
  | 'slipped'              // planned for today, day ended untouched (system-generated, silent)
  | 'shrunk' | 'split' | 'rescheduled'
  | 'decayed' | 'revived'
  | 'released'
  | 'energy_changed' | 'intention_set';

export interface TaskEvent {
  id: ID;
  taskId: ID;
  type: TaskEventType;
  at: ISODateTime;
  /** Energy the user reported at that moment, if any — powers energy/time-of-day learning. */
  energyNow?: EnergyLevel;
  meta?: Record<string, unknown>; // e.g. { latencySec: 95 } on first_step_done
}

// ─────────────────────────────────────────────────────────────────────────────
// Energy & the day's allocation ("will to power as energy")
// ─────────────────────────────────────────────────────────────────────────────

export type EnergyLevel = 'high' | 'medium' | 'low' | 'fried';

/** One tap, optional. If skipped, the planner infers from time-of-day history. */
export interface EnergyCheckin {
  id: ID;
  at: ISODateTime;
  level: EnergyLevel;
  source: 'user' | 'inferred';
  /** Optional context the planner may use; never required. */
  factors?: ('slept_badly' | 'meds_on' | 'meds_wearing_off' | 'moved_body' | 'anxious' | 'interested')[];
}

/** The day's plan is an allocation of finite force, not a list of demands. */
export interface DayAllocation {
  date: ISODate;
  /** Total available force in "focus units" — derived from energy + calendar + history. */
  forceBudget: { deep: number; medium: number; autopilot: number }; // in plannedMinutes
  /** Ordered by: current energy fit → hard deadline proximity → becoming-link → interest hooks. */
  picks: { taskId: ID; slot: EnergyCost; reason: AllocationReason }[];
  /** The ONE thing on the Now card. Everything else is one tap away, not in your face. */
  nowTaskId?: ID;
  /** Deliberately ≤ 70% of budget. Generous buffers are the default, not a setting. */
  bufferRatio: number; // default 0.3
}

export type AllocationReason =
  | 'fits_energy_now' | 'hard_deadline_soon' | 'feeds_becoming'
  | 'high_interest' | 'quick_win' | 'pairs_with_reward';

// ─────────────────────────────────────────────────────────────────────────────
// Slips (failure as data) and self-overcoming (the growth metric)
// ─────────────────────────────────────────────────────────────────────────────

/** Generated when a task's pattern says "this may be badly built", not "you are bad". */
export interface SlipInsight extends Syncable {
  taskId: ID;
  trigger: 'slipped_3x' | 'opened_not_started_3x' | 'shrunk_but_still_stuck' | 'deadline_passed';
  hypothesis: 'too_big' | 'unclear_first_step' | 'wrong_energy_slot' | 'aversive_feeling' | 'not_actually_wanted' | 'blocked_by_other';
  offered: ('shrink' | 'split' | 'move_energy_slot' | 'set_intention' | 'pair_reward' | 'body_double' | 'release')[];
  chosen?: SlipInsight['offered'][number] | 'dismissed';
  /** Self-knowledge question, shown at most once per insight. User may answer or not. */
  reflectionPrompt?: string;
  reflectionAnswer?: string;
}

/**
 * Selbstüberwindung — evidence you are becoming more capable. Computed weekly-ish,
 * shown only when real and meaningful (never fabricated encouragement).
 */
export interface OvercomingEvidence extends Syncable {
  kind:
    | 'start_latency_drop'      // "You used to take ~40 min to start writing. This month: ~6."
    | 'estimate_accuracy_gain'  // "Your time guesses got 30% closer to reality."
    | 'deep_work_capacity'      // "You held deep focus for two episodes, not one."
    | 'slip_recovery'           // "Tasks that slipped got restarted faster."
    | 'category_unlocked'       // "You started three admin tasks this month. In June: zero."
    | 'affirmed_list_share';    // "82% of your routines are ones you'd live again."
  becomingId?: ID;
  baseline: { value: number; window: [ISODate, ISODate] };
  current: { value: number; window: [ISODate, ISODate] };
  /** Minimum sample sizes enforced in the generator so we never celebrate noise. */
  sampleSize: number;
  headline: string;  // rendered per 04-copy-tone-guide.md
  seenAt?: ISODateTime;
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus sessions, body doubling, parking lot
// ─────────────────────────────────────────────────────────────────────────────

export interface FocusSession {
  id: ID;
  taskId: ID;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  plannedMinutes: Minutes;          // expressed to user in experiential units
  mode: 'solo' | 'ambient_double' | 'live_double';
  /** Distractions captured mid-focus, deferred instead of acted on (CBT "distractibility delay"). */
  parkedCaptureIds: ID[];
  /** Hyperfocus guard: if the session runs > 2× plan, offer (not force) a body check. */
  overrunNoticeShownAt?: ISODateTime;
}

// ─────────────────────────────────────────────────────────────────────────────
// Novelty without the slot machine
// ─────────────────────────────────────────────────────────────────────────────

export interface Theme {
  id: ID;
  name: string;          // "Sils-Maria", "Turin, January", "High Noon"
  palette: Record<'bg' | 'surface' | 'ink' | 'muted' | 'accent' | 'win', string>;
  completionAnimation: string; // asset key; vivid, < 800 ms, never variable-ratio
  activeFrom: ISODate;
}

/** Fixed, predictable rewards only. No random loot, no streak-loss punishment. */
export interface ProgressArt {
  id: ID;
  becomingId?: ID;
  /** Grows with started + completed tasks; never shrinks when you miss days. */
  stage: number;
  updatedAt: ISODateTime;
}
