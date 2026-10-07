/** User-facing strings. Every line follows docs/design/04-copy-tone-guide.md. */
import type { EnergyLevel } from '../domain/model';

export const copy = {
  appName: 'Become Who You Are',
  energyQuestion: 'How much force have you got right now?',
  energyLabels: { high: 'plenty', medium: 'some', low: 'not much', fried: 'fried' } as Record<EnergyLevel, string>,
  friedNote: 'Then today is autopilot day. Only the light things are showing.',

  nowHeader: 'Next',
  didIt: 'I did it',
  tooBig: 'still too big',
  notNow: 'not now',
  anotherStep: 'another step',
  editStep: 'in my words',
  save: 'save',
  cancel: 'cancel',

  started: 'Started.',
  keepGoing: 'Keep going',
  thatCounts: 'That counts. Stop here.',
  pickUp: 'Pick up where you left off.',
  done: 'Done',
  doneFlash: 'Done.',
  completions: ['Imposed on the world.', 'That exists now because of you.', 'One less weight.'],

  slipTitle: 'This one keeps slipping.',
  slipBody: "That usually means it's built wrong, not that you are. Shrink it, or let it go?",
  reshapeTitle: 'This might need a different shape.',
  reshapeBody: "Smaller didn't help, so size isn't the problem. Put the first step in your own words, or let it go?",
  shrink: 'shrink it',
  letGo: 'let it go',
  itsFine: "it's fine",
  released: 'Released. Looking away is allowed.',

  capturePlaceholder: "Dump it here. Don't sort it.",
  captured: 'Captured. First step ready.',
  alsoHere: 'Also here',
  heldBack: (n: number) => `${n} heavier ${n === 1 ? 'thing is' : 'things are'} resting until you have more force.`,

  emptyNow: "Nothing here. Either you're done, or you're about to capture something. Both are good.",
  aphorism: {
    text: 'One must still have chaos in oneself to be able to give birth to a dancing star.',
    source: 'Thus Spoke Zarathustra, Prologue §5',
  },
};

export function completionLine(seed: number): string {
  return copy.completions[Math.abs(seed) % copy.completions.length];
}
