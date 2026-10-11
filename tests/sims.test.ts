import { describe, expect, it } from 'vitest';
import { defaultPreferences } from '../src/data/defaults';
import {
  generateSim,
  rerollSimFields,
  validateSim,
} from '../src/generators/sims';
import { generateRelationship } from '../src/generators/relationships';
import { composeHousehold } from '../src/generators/households';
import { createSeededRandom } from '../src/utils/random';
import { member, prompt, relationship, simData } from './fixtures';

const settings = {
  id: 'sim:test',
  name: 'Test Sim',
  age: 'adult' as const,
  traitCount: 3,
};
describe('individual Sim engine', () => {
  it('can replace an ineligible unlocked career without rerolling a locked personality', () => {
    const data = simData();
    data.careers[0].requiredPacks = ['test-pack'];
    const first = generateSim(
      data,
      { ...defaultPreferences(), ownedPacks: ['test-pack'] },
      () => 0,
      settings,
    );
    if (!first.success) throw new Error(first.error.message);
    expect(
      rerollSimFields(first.value, data, defaultPreferences(), () => 0, {
        fields: ['career'],
        locks: ['personality'],
        traitCount: 3,
      }),
    ).toMatchObject({
      success: true,
      value: {
        career: { id: data.careers[1].id },
        personality: first.value.personality,
      },
    });
  });
  it('produces reproducible, validated Sims and distinct seed outcomes', () => {
    const data = simData();
    const preferences = defaultPreferences();
    const first = generateSim(
      data,
      preferences,
      createSeededRandom('same'),
      settings,
    );
    expect(first).toEqual(
      generateSim(data, preferences, createSeededRandom('same'), settings),
    );
    expect(first.success).toBe(true);
    if (first.success)
      expect(validateSim(first.value, data, preferences).success).toBe(true);
    const outputs = new Set(
      Array.from({ length: 20 }, (_, index) =>
        JSON.stringify(
          generateSim(data, preferences, createSeededRandom(index), settings),
        ),
      ),
    );
    expect(outputs.size).toBeGreaterThan(1);
  });
  it('filters exclusive traits, aspirations, and careers independently', () => {
    for (const field of ['traits', 'aspirations', 'careers'] as const) {
      const data = simData();
      for (const item of data[field]) item.requiredPacks = ['test-pack'];
      expect(
        generateSim(
          data,
          defaultPreferences(),
          createSeededRandom('test'),
          settings,
        ).success,
      ).toBe(false);
      expect(
        generateSim(
          data,
          { ...defaultPreferences(), ownedPacks: ['test-pack'] },
          createSeededRandom('test'),
          settings,
        ).success,
      ).toBe(true);
    }
  });
  it('finds compatible trait combinations and enforces aspiration requirements', () => {
    const data = simData();
    data.traits[0].conflictsWith = [data.traits[1].id];
    data.aspirations[0].traitRequirements = [data.traits[0].id];
    const result = generateSim(
      data,
      defaultPreferences(),
      createSeededRandom('test'),
      settings,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.value.personality.traits.map((entry) => entry.id),
      ).toContain(data.traits[0].id);
      expect(
        result.value.personality.traits.map((entry) => entry.id),
      ).not.toContain(data.traits[1].id);
    }
    data.aspirations[0].traitRequirements = ['missing'];
    expect(
      generateSim(data, defaultPreferences(), () => 0, settings).success,
    ).toBe(false);
  });
  it('rejects excessive trait counts, invalid identity, and unsupported ages', () => {
    expect(
      generateSim(simData(), defaultPreferences(), () => 0, {
        ...settings,
        age: 'teen',
        traitCount: 3,
      }).success,
    ).toBe(false);
    expect(
      generateSim(simData(), defaultPreferences(), () => 0, {
        ...settings,
        age: 'child',
        traitCount: 2,
      }).success,
    ).toBe(false);
    expect(
      generateSim(simData(), defaultPreferences(), () => 0, {
        ...settings,
        traitCount: 0,
      }).success,
    ).toBe(false);
    expect(
      generateSim(simData(), defaultPreferences(), () => 0, {
        ...settings,
        name: '',
      }).success,
    ).toBe(false);
    expect(
      generateSim(
        simData(),
        { ...defaultPreferences(), allowedAges: ['elder'] },
        () => 0,
        settings,
      ).success,
    ).toBe(false);
  });
  it('rejects contradictory likes and dislikes and missing profiles', () => {
    const data = simData();
    data.personalities[0].dislikes.push('Rain');
    expect(
      generateSim(data, defaultPreferences(), () => 0, settings).success,
    ).toBe(false);
    data.personalities = [];
    expect(
      generateSim(data, defaultPreferences(), () => 0, settings),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
  it('locks career while rerolling personality, without mutating input', () => {
    const data = simData();
    const generated = generateSim(
      data,
      defaultPreferences(),
      createSeededRandom('first'),
      settings,
    );
    if (!generated.success) throw new Error(generated.error.message);
    const snapshot = JSON.stringify(generated.value);
    const changed = rerollSimFields(
      generated.value,
      data,
      defaultPreferences(),
      createSeededRandom('second'),
      { fields: ['career', 'personality'], locks: ['career'], traitCount: 3 },
    );
    expect(changed.success).toBe(true);
    if (changed.success)
      expect(changed.value.career).toBe(generated.value.career);
    expect(JSON.stringify(generated.value)).toBe(snapshot);
  });
  it('reports a lock conflict when an owned pack is disabled', () => {
    const data = simData();
    data.careers.forEach((career) => {
      career.requiredPacks = ['test-pack'];
    });
    const generated = generateSim(
      data,
      { ...defaultPreferences(), ownedPacks: ['test-pack'] },
      () => 0,
      settings,
    );
    if (!generated.success) throw new Error(generated.error.message);
    expect(
      rerollSimFields(generated.value, data, defaultPreferences(), () => 0, {
        fields: ['personality'],
        locks: ['career'],
        traitCount: 3,
      }),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
  });
  it('restricts adult-themed personality profiles by age and toggle', () => {
    const data = simData();
    data.personalities[0].themes = ['adult-romance'];
    expect(
      generateSim(data, defaultPreferences(), () => 0, settings).success,
    ).toBe(false);
    expect(
      generateSim(
        data,
        { ...defaultPreferences(), allowAdultRomance: true },
        () => 0,
        settings,
      ).success,
    ).toBe(true);
    expect(
      generateSim(
        data,
        { ...defaultPreferences(), allowAdultRomance: true },
        () => 0,
        { ...settings, age: 'teen', traitCount: 2 },
      ).success,
    ).toBe(false);
  });
});

describe('relationship engine', () => {
  it('returns a relationship between two existing distinct Sims', () => {
    expect(
      generateRelationship(
        [relationship()],
        member('a', 'adult'),
        member('b', 'elder'),
        defaultPreferences(),
        () => 0,
      ),
    ).toMatchObject({ success: true, value: { fromId: 'a', toId: 'b' } });
    expect(
      generateRelationship(
        [relationship()],
        member('a', 'adult'),
        member('a', 'adult'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
  });
  it('rejects impossible parent ages and undefined family ties', () => {
    const parent = relationship('parent', {
      kind: 'family',
      familyTie: 'biological-parent',
    });
    expect(
      generateRelationship(
        [parent],
        member('a', 'young-adult'),
        member('b', 'teen'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      generateRelationship(
        [parent],
        member('a', 'adult'),
        member('b', 'teen'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(true);
    expect(
      generateRelationship(
        [relationship('unknown-family', { kind: 'family' })],
        member('a', 'adult'),
        member('b', 'child'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
  });
  it('allows nonsexual teen romance but never adult sexual themes for teens', () => {
    const romance = relationship('romance', { kind: 'romantic' });
    expect(
      generateRelationship(
        [romance],
        member('a', 'teen'),
        member('b', 'teen'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(true);
    expect(
      generateRelationship(
        [romance],
        member('a', 'adult'),
        member('b', 'teen'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    romance.themes = ['adult-romance'];
    expect(
      generateRelationship(
        [romance],
        member('a', 'teen'),
        member('b', 'teen'),
        { ...defaultPreferences(), allowAdultRomance: true },
        () => 0,
      ).success,
    ).toBe(false);
  });
  it('respects existing household family relationships when evaluating romance', () => {
    const household = composeHousehold(prompt(), defaultPreferences(), () => 0);
    if (!household.success) throw new Error(household.error.message);
    expect(
      generateRelationship(
        [relationship('romance', { kind: 'romantic' })],
        household.value.members[0],
        household.value.members[1],
        defaultPreferences(),
        () => 0,
        household.value,
      ).success,
    ).toBe(false);
    expect(
      generateRelationship(
        [relationship()],
        member('missing', 'adult'),
        household.value.members[0],
        defaultPreferences(),
        () => 0,
        household.value,
      ).success,
    ).toBe(false);
  });
  it('handles empty and fully filtered relationship pools', () => {
    expect(
      generateRelationship(
        [],
        member('a', 'adult'),
        member('b', 'adult'),
        defaultPreferences(),
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
    expect(
      generateRelationship(
        [relationship('crime', { themes: ['crime'] })],
        member('a', 'adult'),
        member('b', 'adult'),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
  });
});
