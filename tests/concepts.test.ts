import { describe, expect, it } from 'vitest';
import {
  starterCatalog,
  starterSimData,
  starterTwists,
} from '../src/data/starter';
import { generateConcept, validateConcept } from '../src/generators/concepts';
import { validateCatalog } from '../src/generators/eligibility';
import { defaultSettings } from '../src/utils/preferences';
import { createSeededRandom } from '../src/utils/random';
import { conceptText } from '../src/utils/resultText';
const filters = { categories: [], finance: '', living: '' };
const roll = (seed: string, iteration = 0) => ({
  seed,
  iteration,
  random: (field: string) =>
    createSeededRandom(JSON.stringify([seed, iteration, field])),
});

describe('combined household generator', () => {
  it('has a valid small starter catalog with explicitly fictional content', () => {
    expect(validateCatalog(starterCatalog).success).toBe(true);
    expect(starterCatalog.households.length).toBe(10);
    expect(starterCatalog.aesthetics.length).toBe(12);
    expect(
      starterCatalog.traits.every((trait) => trait.origin === 'roleplay'),
    ).toBe(true);
  });
  it('generates 50 coherent concepts with matching profile IDs and ages', () => {
    for (let index = 0; index < 50; index++) {
      const generated = generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        defaultSettings(),
        filters,
        roll(`combined-${index}`),
      );
      expect(generated.success).toBe(true);
      if (generated.success) {
        expect(
          validateConcept(
            generated.value,
            starterCatalog,
            starterSimData,
            defaultSettings().preferences,
          ).success,
        ).toBe(true);
        expect(generated.value.sims.map((sim) => [sim.id, sim.age])).toEqual(
          generated.value.household.members.map((member) => [
            member.id,
            member.age,
          ]),
        );
        expect(generated.value.twist).toBeUndefined();
        expect(generated.value.lot).toBeUndefined();
        expect(conceptText(generated.value)).not.toMatch(
          /undefined|NaN|\[object Object\]/,
        );
      }
    }
  });
  it('is reproducible and respects locked world and household concepts', () => {
    const generated = generateConcept(
      starterCatalog,
      starterSimData,
      starterTwists,
      defaultSettings(),
      filters,
      roll('same'),
    );
    expect(generated).toEqual(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        defaultSettings(),
        filters,
        roll('same'),
      ),
    );
    if (!generated.success) throw new Error(generated.error.message);
    const rerolled = generateConcept(
      starterCatalog,
      starterSimData,
      starterTwists,
      defaultSettings(),
      filters,
      roll('same', 1),
      generated.value,
      ['world', 'household'],
    );
    expect(rerolled.success).toBe(true);
    if (rerolled.success) {
      expect(rerolled.value.world).toBe(generated.value.world);
      expect(rerolled.value.household).toBe(generated.value.household);
    }
  });
  it('returns errors for conflicting sizes and impossible filters', () => {
    const settings = defaultSettings();
    settings.minimumHouseholdSize = 3;
    settings.preferences.maximumHouseholdSize = 1;
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        settings,
        filters,
        roll('bad'),
      ),
    ).toMatchObject({ success: false, error: { code: 'INVALID_CONFIG' } });
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        defaultSettings(),
        { ...filters, finance: 'Nonexistent' },
        roll('bad'),
      ).success,
    ).toBe(false);
  });
  it('does not enable adult-only concepts by default and detects conflicting locked filters', () => {
    const first = generateConcept(
      starterCatalog,
      starterSimData,
      starterTwists,
      defaultSettings(),
      { ...filters, categories: ['singles'] },
      roll('locked'),
    );
    if (!first.success) throw new Error(first.error.message);
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        defaultSettings(),
        { ...filters, categories: ['families'] },
        roll('locked', 1),
        first.value,
        ['household'],
      ),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        defaultSettings(),
        { ...filters, categories: ['adult-only'] },
        roll('adult'),
      ).success,
    ).toBe(false);
  });
  it('adds a private adult twist without involving children', () => {
    const settings = defaultSettings();
    settings.preferences.allowAdultRomance = true;
    const generated = generateConcept(
      starterCatalog,
      starterSimData,
      starterTwists,
      settings,
      { ...filters, categories: ['families'] },
      roll('family'),
    );
    expect(generated.success).toBe(true);
    if (generated.success) {
      expect(generated.value.twist?.participantIds).toHaveLength(1);
      const participant = generated.value.sims.find(
        (sim) => sim.id === generated.value.twist?.participantIds[0],
      );
      expect(participant?.age).toBe('adult');
    }
  });
  it('honors missing packs and disabled roleplay and handles empty datasets', () => {
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        defaultSettings(),
        { ...filters, categories: ['occult'] },
        roll('occult'),
      ).success,
    ).toBe(false);
    const settings = defaultSettings();
    settings.preferences.ownedPacks = ['vampires'];
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        settings,
        { ...filters, categories: ['occult'] },
        roll('occult'),
      ).success,
    ).toBe(true);
    settings.preferences.allowRoleplayContent = false;
    expect(
      generateConcept(
        starterCatalog,
        starterSimData,
        starterTwists,
        settings,
        filters,
        roll('off'),
      ).success,
    ).toBe(false);
    expect(
      generateConcept(
        { ...starterCatalog, worlds: [] },
        starterSimData,
        starterTwists,
        defaultSettings(),
        filters,
        roll('empty'),
      ).success,
    ).toBe(false);
  });
});
