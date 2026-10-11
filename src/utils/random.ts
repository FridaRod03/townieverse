import { failure, success } from '../types/engine';
import type { EngineResult, RandomSource } from '../types/engine';

/** FNV-1a string hash followed by Mulberry32. All arithmetic is unsigned 32-bit. */
export function createSeededRandom(seed: string | number): RandomSource {
  let state = 2166136261;
  for (const char of String(seed)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomUnit(random: RandomSource): EngineResult<number> {
  const value = random();
  return Number.isFinite(value) && value >= 0 && value < 1
    ? success(value)
    : failure(
        'INVALID_RANDOM',
        'Random sources must return a finite number in [0, 1).',
      );
}

export function weightedSelect<T>(
  entries: readonly T[],
  weight: (entry: T) => number,
  random: RandomSource,
): EngineResult<T> {
  if (!entries.length)
    return failure(
      'EMPTY_POOL',
      'No eligible options remain. Broaden your filters or add content.',
    );
  const weights = entries.map(weight);
  if (weights.some((value) => !Number.isFinite(value) || value < 0))
    return failure(
      'INVALID_WEIGHT',
      'Weights must be finite, non-negative numbers.',
    );
  const largest = weights.reduce(
    (maximum, value) => Math.max(maximum, value),
    0,
  );
  if (largest === 0)
    return failure(
      'INVALID_WEIGHT',
      'At least one eligible option must have a positive weight.',
    );
  // Scale first to prevent overflow when valid weights are very large.
  const scaled = weights.map((value) => value / largest);
  const total = scaled.reduce((sum, value) => sum + value, 0);
  const draw = randomUnit(random);
  if (!draw.success) return draw;
  const threshold = draw.value * total;
  let cumulative = 0;
  let fallback = 0;
  for (let index = 0; index < entries.length; index++) {
    if (scaled[index] > 0) fallback = index;
    cumulative += scaled[index];
    if (threshold < cumulative) return success(entries[index]);
  }
  return success(entries[fallback]);
}

export const uniformSelect = <T>(entries: readonly T[], random: RandomSource) =>
  weightedSelect(entries, () => 1, random);

export function shuffled<T>(
  entries: readonly T[],
  random: RandomSource,
): EngineResult<T[]> {
  const copy = [...entries];
  for (let index = copy.length - 1; index > 0; index--) {
    const draw = randomUnit(random);
    if (!draw.success) return draw;
    const other = Math.floor(draw.value * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return success(copy);
}
