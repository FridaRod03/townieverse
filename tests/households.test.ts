import { describe, expect, it } from 'vitest';
import { defaultPreferences } from '../src/data/defaults';
import {
  composeHousehold,
  generateHousehold,
  parentChildCompatible,
  validateHousehold,
} from '../src/generators/households';
import { createSeededRandom } from '../src/utils/random';
import type { Household, HouseholdPrompt } from '../src/types/models';
import { entry, member, prompt } from './fixtures';

function family(): Household {
  const result = composeHousehold(
    prompt(),
    defaultPreferences(),
    createSeededRandom('family'),
  );
  if (!result.success) throw new Error(result.error.message);
  return result.value;
}
describe('household composition', () => {
  it('is deterministic and always satisfies its prompt across 100 seeds', () => {
    expect(
      composeHousehold(
        prompt(),
        defaultPreferences(),
        createSeededRandom('same'),
      ),
    ).toEqual(
      composeHousehold(
        prompt(),
        defaultPreferences(),
        createSeededRandom('same'),
      ),
    );
    for (let index = 0; index < 100; index++) {
      const result = composeHousehold(
        prompt(),
        defaultPreferences(),
        createSeededRandom(index),
      );
      expect(result.success).toBe(true);
      if (result.success)
        expect(
          validateHousehold(result.value, defaultPreferences(), prompt())
            .success,
        ).toBe(true);
    }
  });
  it('respects smaller size limits, the eight-Sim cap, and invalid ranges', () => {
    expect(
      composeHousehold(
        prompt(),
        { ...defaultPreferences(), maximumHouseholdSize: 1 },
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      composeHousehold(
        prompt('large', { maximumMembers: 9 }),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      composeHousehold(
        prompt('bad', { minimumMembers: 3, maximumMembers: 2 }),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      validateHousehold(
        {
          ...family(),
          members: Array.from({ length: 9 }, (_, index) =>
            member(`member-${index}`, 'adult'),
          ),
        },
        defaultPreferences(),
      ).success,
    ).toBe(false);
  });
  it('distinguishes biological, adoptive, and stepfamily ties', () => {
    expect(
      parentChildCompatible('young-adult', 'teen', 'biological-parent'),
    ).toBe(false);
    expect(
      parentChildCompatible('young-adult', 'teen', 'adoptive-parent'),
    ).toBe(true);
    expect(parentChildCompatible('adult', 'young-adult', 'step-parent')).toBe(
      true,
    );
    expect(parentChildCompatible('teen', 'child', 'biological-parent')).toBe(
      false,
    );
    expect(parentChildCompatible('adult', 'adult', 'biological-parent')).toBe(
      false,
    );
    expect(parentChildCompatible('elder', 'adult', 'biological-parent')).toBe(
      true,
    );
  });
  it('solves constrained ages rather than returning a contradictory random composition', () => {
    const item = prompt();
    item.memberSlots[0].allowedAges = ['young-adult', 'adult'];
    item.memberSlots[1].allowedAges = ['teen'];
    expect(
      composeHousehold(item, defaultPreferences(), () => 0.99),
    ).toMatchObject({
      success: true,
      value: { members: [{ age: 'adult' }, { age: 'teen' }] },
    });
  });
  it('reports impossible age filters and contradictory age-count requirements', () => {
    expect(
      composeHousehold(
        prompt(),
        { ...defaultPreferences(), allowedAges: ['child'] },
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      composeHousehold(
        prompt('impossible', {
          ageRequirements: [{ ages: ['elder'], minimum: 2, maximum: 2 }],
        }),
        defaultPreferences(),
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'INVALID_HOUSEHOLD' } });
  });
  it('rejects duplicate slots, duplicate members, and missing relationship endpoints', () => {
    const item = prompt();
    item.memberSlots[1].id = 'parent';
    expect(composeHousehold(item, defaultPreferences(), () => 0).success).toBe(
      false,
    );
    const household = family();
    household.members[1].id = household.members[0].id;
    expect(validateHousehold(household, defaultPreferences()).success).toBe(
      false,
    );
    const missing = prompt();
    missing.dynamics[0].toSlotId = 'missing';
    expect(
      composeHousehold(missing, defaultPreferences(), () => 0).success,
    ).toBe(false);
  });
  it('rejects contradictory romance, ancestry cycles, and shared-parent romance', () => {
    const household = family();
    household.dynamics.push({
      id: 'romance',
      fromId: household.members[0].id,
      toId: household.members[1].id,
      kind: 'partners',
    });
    expect(validateHousehold(household, defaultPreferences()).success).toBe(
      false,
    );
    const cycle = family();
    cycle.dynamics.push({
      id: 'cycle',
      fromId: cycle.members[1].id,
      toId: cycle.members[0].id,
      kind: 'adoptive-parent',
    });
    expect(validateHousehold(cycle, defaultPreferences()).success).toBe(false);
    const siblings: Household = {
      ...family(),
      members: [
        member('p', 'elder'),
        member('a', 'adult'),
        member('b', 'adult'),
      ],
      dynamics: [
        { id: 'pa', fromId: 'p', toId: 'a', kind: 'biological-parent' },
        { id: 'pb', fromId: 'p', toId: 'b', kind: 'biological-parent' },
        { id: 'ab', fromId: 'a', toId: 'b', kind: 'partners' },
      ],
    };
    expect(validateHousehold(siblings, defaultPreferences()).success).toBe(
      false,
    );
  });
  it('rejects romantic adult/teen pairing but allows ordinary teen/teen partners', () => {
    const household: Household = {
      ...family(),
      category: 'couples',
      members: [member('a', 'adult'), member('b', 'teen')],
      dynamics: [{ id: 'couple', fromId: 'a', toId: 'b', kind: 'partners' }],
    };
    expect(validateHousehold(household, defaultPreferences()).success).toBe(
      false,
    );
    household.members[0].age = 'teen';
    expect(validateHousehold(household, defaultPreferences()).success).toBe(
      true,
    );
  });
  it('rejects adult-only classification for households containing minors', () => {
    expect(
      validateHousehold({ ...family(), adultOnly: true }, defaultPreferences())
        .success,
    ).toBe(false);
    expect(
      composeHousehold(
        prompt('adult-only', { adultOnly: true }),
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
  });
  it('allows an adult private storyline in a family without involving minors', () => {
    const household = family();
    household.storylines = [
      {
        ...entry('private', { themes: ['adult-romance'] }),
        participantIds: [household.members[0].id],
      },
    ];
    expect(validateHousehold(household, defaultPreferences()).success).toBe(
      false,
    );
    const preferences = { ...defaultPreferences(), allowAdultRomance: true };
    expect(validateHousehold(household, preferences).success).toBe(true);
    household.storylines[0].participantIds.push(household.members[1].id);
    expect(validateHousehold(household, preferences).success).toBe(false);
    household.storylines[0].participantIds = ['missing'];
    expect(validateHousehold(household, preferences).success).toBe(false);
  });
  it('rejects pack-exclusive occult content without required packs', () => {
    const item = prompt();
    item.category = 'occult';
    item.memberSlots[0].occult = 'vampire';
    item.memberSlots[0].requiredPacks = ['test-pack'];
    expect(composeHousehold(item, defaultPreferences(), () => 0).success).toBe(
      false,
    );
    expect(
      composeHousehold(
        item,
        { ...defaultPreferences(), ownedPacks: ['test-pack'] },
        () => 0,
      ).success,
    ).toBe(true);
    item.memberSlots[0].requiredPacks = [];
    expect(composeHousehold(item, defaultPreferences(), () => 0).success).toBe(
      false,
    );
  });
  it('supports newborns in family compositions, but not unaccompanied minor households', () => {
    const item = prompt();
    item.memberSlots[1].allowedAges = ['newborn'];
    expect(composeHousehold(item, defaultPreferences(), () => 0).success).toBe(
      true,
    );
    expect(
      validateHousehold(
        {
          ...family(),
          category: 'singles',
          members: [member('baby', 'newborn')],
          dynamics: [],
        },
        defaultPreferences(),
      ).success,
    ).toBe(false);
  });
  it('returns a helpful empty-pool explanation rather than undefined', () => {
    expect(generateHousehold([], defaultPreferences(), () => 0)).toMatchObject({
      success: false,
      error: { code: 'EMPTY_POOL' },
    });
    const result = generateHousehold(
      [prompt()],
      { ...defaultPreferences(), maximumHouseholdSize: 1 },
      () => 0,
    );
    expect(result).toMatchObject({
      success: false,
      error: { code: 'EMPTY_POOL' },
    });
    if (!result.success) expect(result.error.details.length).toBeGreaterThan(0);
  });
  it.each([
    'singles',
    'couples',
    'families',
    'single-parents',
    'blended-families',
    'roommates',
    'multigenerational',
    'elders',
    'occult',
    'adult-only',
  ] as const)('supports valid %s structures', (category) => {
    const household: Household = {
      ...family(),
      category,
      members: [member('a', 'adult'), member('b', 'child')],
      dynamics: [
        { id: 'ab', fromId: 'a', toId: 'b', kind: 'biological-parent' },
      ],
    };
    if (
      category === 'singles' ||
      category === 'elders' ||
      category === 'adult-only' ||
      category === 'occult'
    ) {
      household.members = [
        member('a', category === 'elders' ? 'elder' : 'adult'),
      ];
      household.dynamics = [];
    }
    if (category === 'adult-only') household.adultOnly = true;
    if (category === 'occult') household.members[0].occult = 'ghost';
    if (category === 'couples' || category === 'roommates') {
      household.members[1].age = 'adult';
      household.dynamics[0].kind =
        category === 'couples' ? 'partners' : 'roommates';
    }
    if (category === 'blended-families') {
      household.members.push(member('c', 'adult'));
      household.dynamics.push({
        id: 'cb',
        fromId: 'c',
        toId: 'b',
        kind: 'step-parent',
      });
    }
    if (category === 'multigenerational') {
      household.members.push(member('c', 'elder'));
      household.dynamics.push({
        id: 'ca',
        fromId: 'c',
        toId: 'a',
        kind: 'biological-parent',
      });
    }
    expect(validateHousehold(household, defaultPreferences()).success).toBe(
      true,
    );
  });
  it('rejects a household that no longer satisfies its prompt slots or dynamics', () => {
    const household = family();
    household.members[0].slotId = 'unknown';
    expect(
      validateHousehold(household, defaultPreferences(), prompt()).success,
    ).toBe(false);
    const altered = family();
    altered.dynamics = [];
    expect(
      validateHousehold(altered, defaultPreferences(), prompt()).success,
    ).toBe(false);
  });
  it('validates category requirements instead of trusting a label', () => {
    for (const category of [
      'singles',
      'couples',
      'blended-families',
      'roommates',
      'multigenerational',
      'elders',
      'occult',
      'adult-only',
    ] as HouseholdPrompt['category'][])
      expect(
        validateHousehold({ ...family(), category }, defaultPreferences())
          .success,
      ).toBe(false);
  });
});
