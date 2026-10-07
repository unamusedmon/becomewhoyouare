import type { DurationEstimate, DurationUnit, EnergyCost, Minutes } from './model';

/** Lived-time units. Ordered small to large. */
export const DURATION_UNITS: DurationUnit[] = [
  { id: 'song', singular: 'song', plural: 'songs', minutes: 4 },
  { id: 'episode_sitcom', singular: 'sitcom episode', plural: 'sitcom episodes', minutes: 22 },
  { id: 'podcast', singular: 'podcast episode', plural: 'podcast episodes', minutes: 30 },
  { id: 'laundry_wash', singular: 'laundry cycle', plural: 'laundry cycles', minutes: 45 },
  { id: 'episode_drama', singular: 'drama episode', plural: 'drama episodes', minutes: 55 },
  { id: 'movie', singular: 'movie', plural: 'movies', minutes: 110 },
];

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

/** "about two sitcom episodes". Picks the unit that gives a count of 1–3, closest to a whole number. */
export function toExperiential(minutes: Minutes): DurationEstimate['experiential'] {
  let best = { unit: DURATION_UNITS[0], count: 1, err: Infinity };
  for (const unit of DURATION_UNITS) {
    const exact = minutes / unit.minutes;
    const count = Math.max(1, Math.round(exact));
    if (count > 3) continue;
    const err = Math.abs(exact - count) / count;
    if (err < best.err) best = { unit, count, err };
  }
  if (best.err === Infinity) {
    // Longer than three movies: fall back to the biggest unit.
    const unit = DURATION_UNITS[DURATION_UNITS.length - 1];
    best = { unit, count: Math.round(minutes / unit.minutes), err: 0 };
  }
  const n = best.count < WORDS.length ? WORDS[best.count] : String(best.count);
  const label = `about ${n} ${best.count === 1 ? best.unit.singular : best.unit.plural}`;
  return { unitId: best.unit.id, count: best.count, label };
}

/** rawMinutes × calibration, rounded up to 5 min. */
export function estimateDuration(rawMinutes: Minutes, calibration: number): DurationEstimate {
  const planned = Math.max(5, Math.ceil((rawMinutes * calibration) / 5) * 5);
  return {
    rawMinutes,
    plannedMinutes: planned,
    experiential: toExperiential(planned),
    confidence: 'guess',
  };
}

/** Rough first guess before we have any history. */
export function defaultRawMinutes(energy: EnergyCost, category: string): Minutes {
  if (category === 'call' || category === 'text') return 5;
  if (category === 'email') return 15;
  return energy === 'deep' ? 45 : energy === 'medium' ? 20 : 10;
}

/** Shown under the lived unit, dimmer: "45 min" or "1 h 30 min". */
export function clockLabel(minutes: Minutes): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
