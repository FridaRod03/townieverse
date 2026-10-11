import { describe, expect, it } from 'vitest';
import {
  blendAesthetics,
  matchesWorld,
  selectAesthetic,
} from '../src/generators/aesthetics';
import { defaultPreferences } from '../src/data/defaults';
import { createSeededRandom } from '../src/utils/random';
import { aesthetic, world } from './fixtures';

describe('aesthetic engine', () => {
  const pool = [
    aesthetic('inspired', { worldAssociations: ['test-world'] }),
    ...Array.from({ length: 20 }, (_, index) => aesthetic(`outside-${index}`)),
    aesthetic('wild', { wildcard: true, tags: ['coastal'] }),
  ];
  it('uses explicit world associations or matching tags', () => {
    expect(matchesWorld(pool[0], world())).toBe(true);
    expect(matchesWorld(pool[1], world())).toBe(false);
    expect(matchesWorld(pool.at(-1)!, world())).toBe(true);
    expect(matchesWorld(pool[0])).toBe(false);
  });
  it('balanced mode chooses buckets at 75/20/5 regardless of bucket sizes', () => {
    const preferences = { ...defaultPreferences(), mode: 'balanced' as const };
    const random = createSeededRandom('balanced');
    const counts = { inspired: 0, outsider: 0, wildcard: 0 };
    for (let index = 0; index < 20000; index++) {
      const result = selectAesthetic(pool, preferences, random, {
        world: world(),
      });
      expect(result.success).toBe(true);
      if (result.success)
        counts[
          result.value.wildcard
            ? 'wildcard'
            : result.value.id === 'inspired'
              ? 'inspired'
              : 'outsider'
        ]++;
    }
    expect(counts.inspired / 20000).toBeGreaterThan(0.73);
    expect(counts.inspired / 20000).toBeLessThan(0.77);
    expect(counts.outsider / 20000).toBeGreaterThan(0.18);
    expect(counts.outsider / 20000).toBeLessThan(0.22);
    expect(counts.wildcard / 20000).toBeGreaterThan(0.04);
    expect(counts.wildcard / 20000).toBeLessThan(0.06);
  });
  it('redistributes missing inspired probability proportionally: outsiders 80%, wildcard 20%', () => {
    const random = createSeededRandom('missing');
    let wildcard = 0;
    for (let index = 0; index < 10000; index++) {
      const result = selectAesthetic(
        pool.slice(1),
        { ...defaultPreferences(), mode: 'balanced' },
        random,
      );
      if (result.success && result.value.wildcard) wildcard++;
    }
    expect(wildcard / 10000).toBeGreaterThan(0.18);
    expect(wildcard / 10000).toBeLessThan(0.22);
  });
  it('uses the only available bucket and excludes zero weights in balanced mode', () => {
    expect(
      selectAesthetic(
        [aesthetic('wild', { wildcard: true })],
        { ...defaultPreferences(), mode: 'balanced' },
        () => 0,
      ),
    ).toMatchObject({ success: true, value: { id: 'wild' } });
    expect(
      selectAesthetic(
        [aesthetic('zero', { weight: 0 })],
        { ...defaultPreferences(), mode: 'balanced' },
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'INVALID_WEIGHT' } });
  });
  it.each([
    'random',
    'world-inspired',
    'balanced',
    'realistic',
    'chaos',
  ] as const)('is reproducible in %s mode', (mode) => {
    const preferences = { ...defaultPreferences(), mode };
    expect(
      selectAesthetic(pool, preferences, createSeededRandom('same'), {
        world: world(),
      }),
    ).toEqual(
      selectAesthetic(pool, preferences, createSeededRandom('same'), {
        world: world(),
      }),
    );
  });
  it('world-inspired favors an associated aesthetic', () => {
    const items = [
      aesthetic('local', { tags: ['coastal'] }),
      aesthetic('visitor'),
    ];
    const random = createSeededRandom('world-inspired');
    let local = 0;
    for (let index = 0; index < 10000; index++) {
      const result = selectAesthetic(
        items,
        { ...defaultPreferences(), mode: 'world-inspired' },
        random,
        { world: world() },
      );
      if (result.success && result.value.id === 'local') local++;
    }
    expect(local / 10000).toBeGreaterThan(0.83);
    expect(local / 10000).toBeLessThan(0.89);
  });
  it('realistic favors common content; chaos favors unusual content', () => {
    const items = [
      aesthetic('common', { commonness: 1 }),
      aesthetic('rare', { commonness: 0 }),
    ];
    for (const mode of ['realistic', 'chaos'] as const) {
      let preferred = 0;
      const random = createSeededRandom(mode);
      for (let index = 0; index < 5000; index++) {
        const result = selectAesthetic(
          items,
          { ...defaultPreferences(), mode },
          random,
        );
        if (
          result.success &&
          result.value.id === (mode === 'realistic' ? 'common' : 'rare')
        )
          preferred++;
      }
      expect(preferred / 5000).toBeGreaterThan(0.88);
    }
  });
  it('age suggestions remain soft but allowedAges remain hard', () => {
    const item = aesthetic('soft', { suggestedAges: ['elder'] });
    expect(
      selectAesthetic([item], defaultPreferences(), () => 0, { age: 'child' })
        .success,
    ).toBe(true);
    expect(
      selectAesthetic(
        [{ ...item, allowedAges: ['elder'] }],
        defaultPreferences(),
        () => 0,
        { age: 'child' },
      ).success,
    ).toBe(false);
  });
  it('applies case-insensitive search and category filters; empty category selection means all', () => {
    const items = [
      aesthetic('casual', { name: 'Soft Layers' }),
      aesthetic('formal', { category: 'formal' }),
    ];
    expect(
      selectAesthetic(
        items,
        { ...defaultPreferences(), aestheticSearch: 'LAYERS' },
        () => 0,
      ),
    ).toMatchObject({ success: true, value: { id: 'casual' } });
    expect(
      selectAesthetic(
        items,
        { ...defaultPreferences(), aestheticCategories: ['missing'] },
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
  it('blends distinct aesthetics and deduplicates styling and tags', () => {
    const result = blendAesthetics(
      [aesthetic('a'), aesthetic('b')],
      defaultPreferences(),
      () => 0,
    );
    expect(result).toMatchObject({
      success: true,
      value: {
        first: { id: 'a' },
        second: { id: 'b' },
        casSuggestions: ['Layer simple separates.'],
      },
    });
  });
  it('preserves either locked half and rejects ineligible or duplicate locks', () => {
    const items = [aesthetic('a'), aesthetic('b'), aesthetic('c')];
    expect(
      blendAesthetics(
        items,
        defaultPreferences(),
        () => 0,
        {},
        { second: items[0] },
      ),
    ).toMatchObject({
      success: true,
      value: { second: items[0], first: items[1] },
    });
    expect(
      blendAesthetics(
        items,
        defaultPreferences(),
        () => 0,
        {},
        { first: items[0] },
      ),
    ).toMatchObject({ success: true, value: { first: items[0] } });
    expect(
      blendAesthetics(
        items,
        defaultPreferences(),
        () => 0,
        {},
        { first: items[0], second: items[0] },
      ),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
    expect(
      blendAesthetics(
        items,
        { ...defaultPreferences(), aestheticCategories: ['missing'] },
        () => 0,
        {},
        { first: items[0] },
      ),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
  });
  it('returns helpful errors for empty pools and fewer than two styles', () => {
    expect(selectAesthetic([], defaultPreferences(), () => 0).success).toBe(
      false,
    );
    expect(
      blendAesthetics([aesthetic('a')], defaultPreferences(), () => 0),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
});
