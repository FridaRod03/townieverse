import { describe, expect, it } from 'vitest';
import { defaultPreferences } from '../src/data/defaults';
import { rerollFields } from '../src/generators/locking';
import { rollCoreResult } from '../src/generators/results';
import { failure, success } from '../src/types/engine';
import { catalog } from './fixtures';

describe('atomic field locking', () => {
  it('preserves locks and untouched values and calls only unlocked generators', () => {
    const previous = { world: 'old', household: 'old', aesthetic: 'old' };
    let calls = 0;
    const result = rerollFields({
      previous,
      fields: ['world', 'household'],
      locks: ['world'],
      validate: () => success(true),
      generators: {
        world: () => {
          throw new Error('Locked generator called');
        },
        household: () => {
          calls++;
          return success('new');
        },
      },
    });
    expect(result).toEqual(
      success({ world: 'old', household: 'new', aesthetic: 'old' }),
    );
    expect(calls).toBe(1);
    expect(previous.household).toBe('old');
  });
  it('reports conflicting locks without overwriting fields', () => {
    const previous = { world: 'disabled' };
    expect(
      rerollFields({
        previous,
        fields: ['world'],
        locks: ['world'],
        validate: () => failure('INVALID_CONFIG', 'Disabled pack'),
        generators: { world: () => success('new') },
      }),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
    expect(previous.world).toBe('disabled');
  });
  it('rejects duplicate field requests, missing generators, and empty locks', () => {
    expect(
      rerollFields({
        previous: { a: 1 },
        fields: ['a', 'a'],
        locks: [],
        validate: () => success(true),
        generators: {},
      }).success,
    ).toBe(false);
    expect(
      rerollFields({
        previous: { a: 1 },
        fields: ['a'],
        locks: [],
        validate: () => success(true),
        generators: {},
      }).success,
    ).toBe(false);
    expect(
      rerollFields({
        previous: { a: undefined },
        fields: [],
        locks: ['a'],
        validate: () => success(true),
        generators: {},
      }),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
  });
  it('is atomic when generation or final validation fails', () => {
    const previous = { a: 1, b: 2 };
    const result = rerollFields({
      previous,
      fields: ['a', 'b'],
      locks: [],
      validate: () => success(true),
      generators: {
        a: () => success(99),
        b: () => failure('EMPTY_POOL', 'No options'),
      },
    });
    expect(result.success).toBe(false);
    expect(previous).toEqual({ a: 1, b: 2 });
    expect(
      rerollFields({
        previous,
        fields: ['a'],
        locks: ['b'],
        validate: (draft) =>
          draft.a < 10 ? success(true) : failure('INVALID_CONFIG', 'Conflict'),
        generators: { a: () => success(99) },
      }),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
  });
});

describe('seeded result orchestration', () => {
  it('replaces an invalid unlocked world while preserving a valid household lock', () => {
    const data = catalog();
    data.worlds[0].requiredPacks = ['test-pack'];
    const first = rollCoreResult(
      data,
      { ...defaultPreferences(), ownedPacks: ['test-pack'] },
      'save',
    );
    if (!first.success) throw new Error(first.error.message);
    const base = catalog().worlds[0];
    base.id = 'new-world';
    base.neighborhoods[0].worldId = 'new-world';
    base.lots[0].worldId = 'new-world';
    base.neighborhoods[0].id = 'new-neighborhood';
    base.lots[0].id = 'new-lot';
    base.lots[0].neighborhoodId = 'new-neighborhood';
    data.worlds.push(base);
    expect(
      rollCoreResult(data, defaultPreferences(), 'save', {
        previous: first.value,
        fields: ['world'],
        locks: ['household'],
        iteration: 1,
      }),
    ).toMatchObject({
      success: true,
      value: { world: { id: 'new-world' }, household: first.value.household },
    });
  });
  it('reproduces a complete core roll from seed, data, preferences, and settings', () => {
    const result = rollCoreResult(catalog(), defaultPreferences(), 'save-one');
    expect(result.success).toBe(true);
    expect(result).toEqual(
      rollCoreResult(catalog(), defaultPreferences(), 'save-one'),
    );
  });
  it('locks world while rerolling household and locks household while rerolling aesthetic', () => {
    const data = catalog();
    const preferences = defaultPreferences();
    const first = rollCoreResult(data, preferences, 'save');
    if (!first.success) throw new Error(first.error.message);
    const second = rollCoreResult(data, preferences, 'save', {
      previous: first.value,
      fields: ['world', 'household'],
      locks: ['world'],
      iteration: 1,
    });
    expect(second.success).toBe(true);
    if (second.success) expect(second.value.world).toBe(first.value.world);
    const third = rollCoreResult(data, preferences, 'save', {
      previous: first.value,
      fields: ['household', 'aesthetic'],
      locks: ['household'],
      iteration: 2,
    });
    expect(third.success).toBe(true);
    if (third.success)
      expect(third.value.household).toBe(first.value.household);
  });
  it('independent streams prevent a world lock from changing the household draw', () => {
    const data = catalog();
    const first = rollCoreResult(data, defaultPreferences(), 'save');
    if (!first.success) throw new Error(first.error.message);
    const unlocked = rollCoreResult(data, defaultPreferences(), 'save', {
      previous: first.value,
      iteration: 1,
    });
    const locked = rollCoreResult(data, defaultPreferences(), 'save', {
      previous: first.value,
      locks: ['world'],
      iteration: 1,
    });
    if (!unlocked.success || !locked.success)
      throw new Error('Unexpected reroll failure');
    expect(locked.value.household).toEqual(unlocked.value.household);
    expect(locked.value.aesthetic).toEqual(unlocked.value.aesthetic);
  });
  it('rejects disabled locked worlds, invalid iteration, and invalid catalogs', () => {
    const data = catalog();
    data.worlds[0].requiredPacks = ['test-pack'];
    const first = rollCoreResult(
      data,
      { ...defaultPreferences(), ownedPacks: ['test-pack'] },
      'save',
    );
    if (!first.success) throw new Error(first.error.message);
    expect(
      rollCoreResult(data, defaultPreferences(), 'save', {
        previous: first.value,
        locks: ['world'],
        fields: ['aesthetic'],
      }),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
    expect(
      rollCoreResult(data, defaultPreferences(), 'save', { iteration: -1 }),
    ).toMatchObject({ success: false, error: { code: 'INVALID_CONFIG' } });
    data.aesthetics.push(data.aesthetics[0]);
    expect(rollCoreResult(data, defaultPreferences(), 'save').success).toBe(
      false,
    );
  });
  it('can roll a blend independently and reports empty catalogs', () => {
    expect(
      rollCoreResult(catalog(), defaultPreferences(), 'blend', {
        fields: ['blend'],
      }),
    ).toMatchObject({ success: true, value: { blend: {} } });
    const data = catalog();
    data.worlds = [];
    expect(rollCoreResult(data, defaultPreferences(), 'empty')).toMatchObject({
      success: false,
      error: { code: 'EMPTY_POOL' },
    });
  });
});
