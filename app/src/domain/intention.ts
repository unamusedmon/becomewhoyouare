/**
 * Implementation intentions: "When X, I'll do Y." Planning the cue hands the start
 * over to the situation instead of to willpower (Gollwitzer & Sheeran 2006, d ≈ 0.65).
 * See docs/design/05-additional-science.md.
 */
import type { ImplementationIntention, Task } from './model';

/** Common anchors: things that already happen every day, so the plan rides on them. */
export const CUE_SUGGESTIONS = [
  'I finish my coffee',
  'I sit down at my desk',
  'lunch is over',
  'I get home',
  'the kids are asleep',
];

/** "When I finish coffee." → "I finish coffee". People type the "when" themselves half the time. */
export function cleanCue(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(when(ever)?|once|as soon as|after)(\s+|$)/i, '')
    .replace(/[,.;:!?]+$/, '')
    .trim();
}

function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

export function cueText(intention: ImplementationIntention, tasks: Task[]): string {
  if (intention.trigger.kind === 'event') return `When ${intention.trigger.text}`;
  const anchorId = intention.trigger.taskId;
  const anchor = tasks.find((t) => t.id === anchorId);
  return `After ${anchor ? lowerFirst(anchor.title) : 'the other thing'}`;
}

/** "When I finish my coffee, at my desk, I'll open the report doc." */
export function intentionSentence(task: Task, tasks: Task[]): string {
  const i = task.intention;
  if (!i) return '';
  const where = i.context ? `, ${i.context.trim()}` : '';
  return `${cueText(i, tasks)}${where}, I'll ${lowerFirst(task.firstStep.text.replace(/[.!]+$/, ''))}.`;
}

/** "If I open Twitter instead, then I'll close it and type one bullet." */
export function obstacleSentence(i: ImplementationIntention): string | undefined {
  if (!i.ifObstacle) return undefined;
  let obstacle = cleanCue(i.ifObstacle.obstacle.replace(/^if\s+/i, ''));
  // The field is labelled "If I…", so most people type only the rest.
  if (!/^(i|i'm|i've|my|it|the|a|an|someone|they|he|she|we|you)\b/i.test(obstacle)) obstacle = `I ${obstacle}`;
  const response = i.ifObstacle.response.trim().replace(/^(then\s+)?(i'?ll\s+)?/i, '').replace(/[.!]+$/, '');
  return `If ${obstacle}, then I'll ${lowerFirst(response)}.`;
}

/**
 * When a planned task gets started, set aside or released, its cue has done its job.
 * Event cues re-arm for next time; an "after X" cue is spent once X is done.
 */
export function settleIntention(task: Task): Task {
  const i = task.intention;
  if (!i?.firedAt) return task;
  if (i.trigger.kind === 'after_task') return { ...task, intention: undefined };
  return { ...task, intention: { ...i, firedAt: undefined } };
}

export function isWaitingOnCue(task: Task): boolean {
  return !!task.intention && !task.intention.firedAt;
}
