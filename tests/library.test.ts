import { describe, expect, it } from 'vitest';
import { catalog, simData, twists } from '../src/data/library';
import {
  inspectContent,
  descriptionSimilarity,
  normalizedName,
} from '../src/data/validation';
import { defaultPreferences } from '../src/data/defaults';
import { defaultSettings, validStoredSettings } from '../src/utils/preferences';
import { createSeededRandom } from '../src/utils/random';
import { composeHousehold } from '../src/generators/households';
import { eligibilityReasons, modeWeight } from '../src/generators/eligibility';
import { matchesWorld, selectAesthetic } from '../src/generators/aesthetics';
import { generateStoryline } from '../src/generators/storylines';
import { generateConcept } from '../src/generators/concepts';
import { LIFE_STAGES } from '../src/types/models';
import type { RandomizationMode } from '../src/types/models';

const allPacks = catalog.packs.map((pack) => pack.id);
const full = {
  ...defaultPreferences(),
  ownedPacks: allPacks,
  allowedAges: [...LIFE_STAGES],
  allowCrime: true,
  allowSubstanceUse: true,
  allowAdultRomance: true,
};
const roll = (seed: string) => ({
  seed,
  iteration: 0,
  random: (field: string) => createSeededRandom(JSON.stringify([seed, field])),
});
const modes: RandomizationMode[] = [
  'random',
  'world-inspired',
  'balanced',
  'realistic',
  'chaos',
];
describe('expanded library integrity', () => {
  it('passes the full validator and reports exact, separately classified counts', () => {
    const report = inspectContent(catalog, simData.personalities, twists);
    expect(report.issues).toEqual([]);
    expect(report.counts).toMatchObject({
      packs: 116,
      worlds: 34,
      households: 300,
      aesthetics: 200,
      relationships: 150,
      backgrounds: 150,
      maturePrompts: 78,
      lots: 14,
      unverifiedEntries: 0,
    });
    expect(
      catalog.worlds.filter((world) => world.origin === 'official'),
    ).toHaveLength(31);
  });
  it('composes every household with valid ages, roles, genealogy, and owned-pack requirements', () => {
    for (const prompt of catalog.households)
      expect(
        composeHousehold(prompt, full, createSeededRandom(prompt.id)),
        prompt.name,
      ).toMatchObject({ success: true });
    expect(
      new Set(catalog.households.map((prompt) => prompt.memberSlots.length)),
    ).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
  });
  it('rejects duplicate IDs, normalized names, aliases, missing fields and invalid refs', () => {
    const data = structuredClone(catalog);
    data.aesthetics[1].id = data.aesthetics[0].id;
    data.aesthetics[1].name = data.aesthetics[0].name.toUpperCase();
    data.aesthetics[2].aliases = [data.aesthetics[0].name];
    data.aesthetics[3].worldAssociations = ['unknown-world'];
    data.aesthetics[4].requiredPacks = ['unknown-pack'];
    data.aesthetics[5].description = '';
    data.aesthetics[6].category = 'Made up category';
    data.aesthetics[7].weight = -1;
    data.traits[0].allowedAges = ['invalid' as never];
    const codes = inspectContent(
      data,
      simData.personalities,
      twists,
    ).issues.map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'duplicate-id',
        'duplicate-name',
        'alias-collision',
        'world-reference',
        'pack-reference',
        'missing-description',
        'aesthetic-fields',
        'weight',
        'ages',
      ]),
    );
  });
  it('flags similar descriptions for review without modifying the data', () => {
    const data = structuredClone(catalog);
    data.households[1].description = data.households[0].description;
    const before = JSON.stringify(data);
    expect(
      inspectContent(data, simData.personalities, twists).issues,
    ).toContainEqual(
      expect.objectContaining({
        code: 'similar-description',
        severity: 'review',
      }),
    );
    expect(JSON.stringify(data)).toBe(before);
    expect(normalizedName('Móri-kei!')).toBe('morikei');
    expect(descriptionSimilarity('tiny text', 'tiny text')).toBe(0);
  });
  it('rejects impossible household roles and unverified official content', () => {
    const data = structuredClone(catalog);
    const family = data.households.find(
      (prompt) => prompt.category === 'families',
    )!;
    family.memberSlots[0].allowedAges = ['child'];
    data.worlds[0].verification.status = 'unverified';
    const codes = inspectContent(
      data,
      simData.personalities,
      twists,
    ).issues.map((issue) => issue.code);
    expect(codes).toContain('household-composition');
    expect(codes).toContain('official-verification');
  });
  it('retains stable legacy IDs while strengthening active mature metadata', () => {
    expect(
      catalog.households.some((entry) => entry.id.startsWith('starter:')),
    ).toBe(true);
    expect(
      twists.filter((entry) => entry.id.startsWith('starter:')),
    ).toHaveLength(3);
    expect(
      twists.every(
        (entry) =>
          entry.adultOnly &&
          entry.allowedAges?.every((age) =>
            ['young-adult', 'adult', 'elder'].includes(age),
          ),
      ),
    ).toBe(true);
  });
  it('persists newly supported packs and retains legacy category preferences', () => {
    const settings = defaultSettings();
    settings.preferences.ownedPacks = [
      'royalty-and-legacy',
      'enchanted-by-nature',
      'life-and-death',
    ];
    settings.preferences.aestheticCategories = ['Everyday', 'Fantasy'];
    expect(validStoredSettings(settings)).toBe(true);
  });
});
describe('expanded library filters and randomization', () => {
  it('does not admit pack-dependent fields when no optional packs are owned', () => {
    const entries = [
      ...catalog.worlds,
      ...catalog.careers,
      ...catalog.households,
    ];
    for (const entry of entries.filter((item) => item.requiredPacks.length))
      expect(
        eligibilityReasons(entry, defaultPreferences(), ['adult']),
      ).toContain('A required pack is disabled.');
  });
  it('supports alias search without duplicate canonical records', () => {
    const result = selectAesthetic(
      catalog.aesthetics,
      { ...defaultPreferences(), aestheticSearch: 'Forest Girl' },
      createSeededRandom('alias'),
      { age: 'adult' },
    );
    expect(result).toMatchObject({
      success: true,
      value: { name: 'Mori Kei' },
    });
    expect(
      catalog.aesthetics.filter((item) => item.name === 'Mori Kei'),
    ).toHaveLength(1);
  });
  it.each(modes)(
    'keeps coherent deterministic residential concepts in %s mode',
    (mode) => {
      const settings = {
        ...defaultSettings(),
        preferences: { ...defaultPreferences(), mode, ownedPacks: allPacks },
      };
      for (let i = 0; i < 5; i++) {
        const seed = `phase-five-${mode}-${i}`;
        const result = generateConcept(
          catalog,
          simData,
          twists,
          settings,
          { categories: [], finance: '', living: '' },
          roll(seed),
        );
        expect(result).toMatchObject({ success: true });
        expect(
          generateConcept(
            catalog,
            simData,
            twists,
            settings,
            { categories: [], finance: '', living: '' },
            roll(seed),
          ),
        ).toEqual(result);
        if (result.success) {
          expect(result.value.world.worldType).toBe('residential');
          expect(result.value.twist).toBeUndefined();
        }
      }
    },
  );
  it('keeps balanced bucket proportions with the real expanded catalog', () => {
    const world = catalog.worlds.find((item) => item.name === 'Willow Creek')!;
    const random = createSeededRandom('expanded-balanced');
    const counts = [0, 0, 0];
    for (let i = 0; i < 10000; i++) {
      const result = selectAesthetic(
        catalog.aesthetics,
        { ...defaultPreferences(), mode: 'balanced' },
        random,
        { world, age: 'adult' },
      );
      expect(result.success).toBe(true);
      if (result.success)
        counts[
          result.value.wildcard ? 2 : matchesWorld(result.value, world) ? 0 : 1
        ]++;
    }
    expect(counts[0] / 10000).toBeCloseTo(0.75, 1);
    expect(counts[1] / 10000).toBeCloseTo(0.2, 1);
    expect(counts[2] / 10000).toBeCloseTo(0.05, 1);
  });
  it('weights common and unusual concepts in opposite directions without bypassing restrictions', () => {
    const ordinary = catalog.households.find(
      (item) => item.name === 'The spare key',
    )!;
    const unusual = catalog.households.find(
      (item) => item.category === 'occult',
    )!;
    expect(
      modeWeight(ordinary, { ...full, mode: 'realistic' }),
    ).toBeGreaterThan(modeWeight(unusual, { ...full, mode: 'realistic' }));
    expect(modeWeight(unusual, { ...full, mode: 'chaos' })).toBeGreaterThan(
      modeWeight(ordinary, { ...full, mode: 'chaos' }),
    );
    expect(
      eligibilityReasons(unusual, { ...defaultPreferences(), mode: 'chaos' }, [
        'adult',
      ]),
    ).toContain('A required pack is disabled.');
  });
  it.each(['allowAdultRomance', 'allowCrime', 'allowSubstanceUse'] as const)(
    'enables only %s prompts',
    (toggle) => {
      const preferences = { ...defaultPreferences(), [toggle]: true };
      const theme = {
        allowAdultRomance: 'adult-romance',
        allowCrime: 'crime',
        allowSubstanceUse: 'substance-use',
      }[toggle];
      for (let i = 0; i < 30; i++) {
        const result = generateStoryline(
          twists,
          [{ id: 'adult', age: 'adult' }],
          preferences,
          createSeededRandom(i),
        );
        expect(result).toMatchObject({
          success: true,
          value: { themes: [theme], participantIds: ['adult'] },
        });
      }
    },
  );
  it.each(['newborn', 'infant', 'toddler', 'child', 'teen'] as const)(
    'excludes every mature prompt for %s even with toggles enabled',
    (age) => {
      expect(
        generateStoryline(
          twists,
          [{ id: 'minor', age }],
          full,
          createSeededRandom(age),
        ),
      ).toMatchObject({ success: false });
    },
  );
  it('keeps all mature toggles off by default', () =>
    expect(
      generateStoryline(
        twists,
        [{ id: 'adult', age: 'adult' }],
        defaultPreferences(),
        createSeededRandom('off'),
      ),
    ).toMatchObject({ success: false }));
  it('rolls the expanded library promptly without changing its data', () => {
    const before = JSON.stringify(catalog);
    const start = performance.now();
    for (let i = 0; i < 10; i++)
      expect(
        generateConcept(
          catalog,
          simData,
          twists,
          defaultSettings(),
          { categories: [], finance: '', living: '' },
          roll(`performance-${i}`),
        ).success,
      ).toBe(true);
    expect(performance.now() - start).toBeLessThan(5000);
    expect(JSON.stringify(catalog)).toBe(before);
  });
});
