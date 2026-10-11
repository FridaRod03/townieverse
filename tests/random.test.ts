import { describe, expect, it } from 'vitest';
import {
  createSeededRandom,
  shuffled,
  uniformSelect,
  weightedSelect,
} from '../src/utils/random';

describe('seeded random selection', () => {
  it('repeats the same stream and stays in [0, 1)', () => {
    const a = createSeededRandom('townieverse');
    const b = createSeededRandom('townieverse');
    for (let index = 0; index < 1000; index++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
  it('different seeds produce different streams', () => {
    const a = createSeededRandom('a');
    const b = createSeededRandom('b');
    expect(Array.from({ length: 20 }, a)).not.toEqual(
      Array.from({ length: 20 }, b),
    );
  });
  it('does not call Math.random for seeded selections', () => {
    const before = Math.random;
    Math.random = () => {
      throw new Error('Unseeded draw');
    };
    try {
      expect(
        uniformSelect(['a', 'b'], createSeededRandom('test')).success,
      ).toBe(true);
    } finally {
      Math.random = before;
    }
  });
  it('respects zero weights and cumulative boundaries', () => {
    expect(
      weightedSelect(
        [0, 1, 3],
        (weight) => weight,
        () => 0,
      ),
    ).toEqual({ success: true, value: 1 });
    expect(
      weightedSelect(
        [1, 3],
        (weight) => weight,
        () => 0.25,
      ),
    ).toEqual({ success: true, value: 3 });
  });
  it.each([NaN, Infinity, -1])('rejects invalid weight %s', (weight) => {
    expect(
      weightedSelect([weight], (value) => value, createSeededRandom('a')),
    ).toMatchObject({ success: false, error: { code: 'INVALID_WEIGHT' } });
  });
  it('rejects all-zero and empty weighted pools', () => {
    expect(
      weightedSelect(
        [0],
        (value) => value,
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'INVALID_WEIGHT' } });
    expect(uniformSelect([], () => 0)).toMatchObject({
      success: false,
      error: { code: 'EMPTY_POOL' },
    });
  });
  it.each([1, -0.1, NaN, Infinity])(
    'rejects invalid random draw %s',
    (value) => {
      expect(uniformSelect(['a'], () => value)).toMatchObject({
        success: false,
        error: { code: 'INVALID_RANDOM' },
      });
    },
  );
  it('handles finite weights whose unscaled sum overflows', () => {
    expect(
      weightedSelect(
        [1e308, 1e308],
        (value) => value,
        () => 0.99,
      ).success,
    ).toBe(true);
  });
  it('approximates a 1:3 distribution in 20,000 seeded draws', () => {
    const random = createSeededRandom('weighted-sample');
    let heavy = 0;
    for (let index = 0; index < 20000; index++) {
      const result = weightedSelect(
        ['light', 'heavy'],
        (value) => (value === 'heavy' ? 3 : 1),
        random,
      );
      if (result.success && result.value === 'heavy') heavy++;
    }
    expect(heavy / 20000).toBeGreaterThan(0.73);
    expect(heavy / 20000).toBeLessThan(0.77);
  });
  it('uniform selection is equal regardless of attached weights', () => {
    const random = createSeededRandom('uniform');
    const counts = [0, 0, 0];
    for (let index = 0; index < 15000; index++) {
      const result = uniformSelect([0, 1, 2], random);
      if (result.success) counts[result.value]++;
    }
    for (const count of counts) expect(count / 15000).toBeGreaterThan(0.31);
    expect(shuffled([1, 2, 3], createSeededRandom('shuffle'))).toEqual(
      shuffled([1, 2, 3], createSeededRandom('shuffle')),
    );
  });
});
