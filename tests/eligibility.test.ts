import { describe, expect, it } from 'vitest';
import { defaultPreferences } from '../src/data/defaults';
import {
  eligibleEntries,
  eligibilityReasons,
  hasPacks,
  isAdult,
  validateCatalog,
  validateEntries,
  validatePreferences,
} from '../src/generators/eligibility';
import {
  selectLot,
  selectNeighborhood,
  selectWorld,
} from '../src/generators/worlds';
import { catalog, entry, world } from './fixtures';

describe('content and pack filters', () => {
  it('has independent content controls, all off by default', () => {
    const preferences = defaultPreferences();
    expect([
      preferences.allowAdultRomance,
      preferences.allowCrime,
      preferences.allowSubstanceUse,
    ]).toEqual([false, false, false]);
    const entries = [
      entry('romance', { themes: ['adult-romance'] }),
      entry('crime', { themes: ['crime'] }),
      entry('substances', { themes: ['substance-use'] }),
    ];
    expect(
      eligibleEntries(entries, { ...preferences, allowCrime: true }, ['adult']),
    ).toMatchObject({ success: true, value: [{ id: 'crime' }] });
    expect(
      eligibleEntries(entries, { ...preferences, allowAdultRomance: true }, [
        'adult',
      ]),
    ).toMatchObject({ success: true, value: [{ id: 'romance' }] });
    expect(
      eligibleEntries(entries, { ...preferences, allowSubstanceUse: true }, [
        'adult',
      ]),
    ).toMatchObject({ success: true, value: [{ id: 'substances' }] });
  });
  it.each(['newborn', 'infant', 'toddler', 'child', 'teen'] as const)(
    'never assigns sexual content to %s',
    (age) => {
      expect(
        eligibilityReasons(
          entry('romance', { themes: ['adult-romance'] }),
          { ...defaultPreferences(), allowAdultRomance: true },
          [age],
        ),
      ).not.toHaveLength(0);
      expect(isAdult(age)).toBe(false);
    },
  );
  it.each(['young-adult', 'adult', 'elder'] as const)(
    'allows enabled adult content for %s',
    (age) => {
      expect(
        eligibilityReasons(
          entry('romance', { themes: ['adult-romance'] }),
          { ...defaultPreferences(), allowAdultRomance: true },
          [age],
        ),
      ).toHaveLength(0);
    },
  );
  it('requires explicit participants for adult content and rejects mixed adult/minor participants', () => {
    const item = entry('romance', { themes: ['adult-romance'] });
    const preferences = { ...defaultPreferences(), allowAdultRomance: true };
    expect(eligibilityReasons(item, preferences)).not.toHaveLength(0);
    expect(
      eligibilityReasons(item, preferences, ['adult', 'teen']),
    ).not.toHaveLength(0);
  });
  it('keeps base-game content with no owned packs and requires every exclusive pack', () => {
    expect(hasPacks(['base-game'], [])).toBe(true);
    expect(hasPacks(['a', 'b'], ['a'])).toBe(false);
    expect(
      eligibleEntries(
        [
          entry('base', { requiredPacks: ['base-game'] }),
          entry('exclusive', { requiredPacks: ['test-pack'] }),
        ],
        defaultPreferences(),
      ),
    ).toMatchObject({ success: true, value: [{ id: 'base' }] });
  });
  it('distinguishes official, roleplay, and custom options', () => {
    const official = entry('official', {
      origin: 'official',
      verification: {
        status: 'verified',
        sources: ['https://example.invalid/test-only'],
      },
    });
    expect(
      eligibleEntries(
        [official, entry('roleplay'), entry('custom', { origin: 'custom' })],
        { ...defaultPreferences(), allowRoleplayContent: false },
      ),
    ).toMatchObject({ success: true, value: [{ id: 'official' }] });
  });
  it('does not use unverified official content or accept verified content without sources', () => {
    expect(
      eligibleEntries(
        [
          entry('unknown', {
            origin: 'official',
            verification: { status: 'unverified', sources: [] },
          }),
        ],
        defaultPreferences(),
      ),
    ).toMatchObject({ success: true, value: [] });
    expect(
      validateEntries([
        entry('false-verification', {
          origin: 'official',
          verification: { status: 'verified', sources: [] },
        }),
      ]).success,
    ).toBe(false);
  });
  it.each([0, 9, 2.5, NaN])(
    'rejects invalid maximum size %s',
    (maximumHouseholdSize) => {
      expect(
        validatePreferences({ ...defaultPreferences(), maximumHouseholdSize }),
      ).toMatchObject({ success: false, error: { code: 'INVALID_CONFIG' } });
    },
  );
  it('rejects empty ages, invalid modes, duplicate IDs, invalid commonness, and invalid age metadata', () => {
    expect(
      validatePreferences({ ...defaultPreferences(), allowedAges: [] }).success,
    ).toBe(false);
    expect(
      validatePreferences({ ...defaultPreferences(), mode: 'invalid' as never })
        .success,
    ).toBe(false);
    expect(validateEntries([entry('same'), entry('same')]).success).toBe(false);
    expect(validateEntries([entry('wrong', { commonness: 2 })]).success).toBe(
      false,
    );
    expect(
      validateEntries([entry('wrong', { allowedAges: ['invalid' as never] })])
        .success,
    ).toBe(false);
  });
  it('validates global catalog IDs, pack references, and nested world associations', () => {
    const data = catalog();
    expect(validateCatalog(data).success).toBe(true);
    expect(
      validateCatalog({
        ...data,
        traits: [{ ...data.traits[0], id: data.worlds[0].id }],
      }).success,
    ).toBe(false);
    expect(
      validateCatalog({
        ...data,
        worlds: [world('test-world', { requiredPacks: ['unknown-pack'] })],
      }).success,
    ).toBe(false);
    const bad = world();
    bad.lots[0].neighborhoodId = 'missing';
    expect(validateCatalog({ ...data, worlds: [bad] }).success).toBe(false);
  });
});

describe('world and lot selection', () => {
  it('excludes disabled pack worlds, but retains base game', () => {
    const items = [
      world('base'),
      world('exclusive', { requiredPacks: ['test-pack'] }),
    ];
    expect(selectWorld(items, defaultPreferences(), () => 0.99)).toMatchObject({
      success: true,
      value: { id: 'base' },
    });
    expect(
      selectWorld(
        items,
        { ...defaultPreferences(), ownedPacks: ['test-pack'] },
        () => 0.99,
      ),
    ).toMatchObject({ success: true, value: { id: 'exclusive' } });
  });
  it('reports empty worlds, neighborhoods, and lots', () => {
    expect(selectWorld([], defaultPreferences(), () => 0).success).toBe(false);
    expect(
      selectNeighborhood(
        world('empty', { neighborhoods: [], lots: [] }),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      selectLot(world('empty', { lots: [] }), defaultPreferences(), () => 0),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
  it('omits unverified official lot names/sizes and invalid dimensions', () => {
    const item = world();
    item.lots[0].origin = 'official';
    item.lots[0].verification = { status: 'unverified', sources: [] };
    expect(selectLot(item, defaultPreferences(), () => 0)).toMatchObject({
      success: false,
      error: { code: 'EMPTY_POOL' },
    });
    item.lots[0].origin = 'roleplay';
    item.lots[0].size = { width: 0, height: 30 };
    expect(selectLot(item, defaultPreferences(), () => 0).success).toBe(false);
  });
  it('supports enabled custom lots and avoids previously rolled IDs', () => {
    const item = world();
    item.lots[0].origin = 'custom';
    expect(selectLot(item, defaultPreferences(), () => 0).success).toBe(false);
    expect(
      selectLot(
        item,
        { ...defaultPreferences(), allowCustomContent: true },
        () => 0,
      ).success,
    ).toBe(true);
    expect(
      selectLot(
        item,
        { ...defaultPreferences(), allowCustomContent: true },
        () => 0,
        { previouslyRolledIds: [item.lots[0].id] },
      ).success,
    ).toBe(false);
  });
  it('filters neighborhoods and rejects mismatched or disabled world selection', () => {
    const item = world();
    expect(
      selectNeighborhood(item, defaultPreferences(), () => 0).success,
    ).toBe(true);
    expect(
      selectLot(item, defaultPreferences(), () => 0, {
        neighborhoodId: 'missing',
      }),
    ).toMatchObject({ success: false, error: { code: 'INVALID_CONFIG' } });
    expect(
      selectNeighborhood(
        world('disabled', { requiredPacks: ['test-pack'] }),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    item.neighborhoods[0].requiredPacks = ['test-pack'];
    expect(selectLot(item, defaultPreferences(), () => 0).success).toBe(false);
  });
});
