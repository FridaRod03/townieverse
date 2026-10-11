import type {
  Aesthetic,
  Aspiration,
  Career,
  ContentCatalog,
  ContentEntry,
  HouseholdMember,
  HouseholdPrompt,
  PersonalityProfile,
  Relationship,
  Trait,
  World,
} from '../src/types/models';
import type { SimData } from '../src/generators/sims';

// Deliberately fictional roleplay/test content. Nothing here is an official Sims catalog.
export function entry(
  id: string,
  overrides: Partial<ContentEntry> = {},
): ContentEntry {
  return {
    id,
    name: id,
    description: 'Test fixture, not official content.',
    origin: 'roleplay',
    requiredPacks: [],
    verification: { status: 'not-applicable', sources: [] },
    categories: [],
    tags: [],
    weight: 1,
    commonness: 0.5,
    adultOnly: false,
    themes: [],
    ...overrides,
  };
}
export function aesthetic(
  id: string,
  overrides: Partial<Aesthetic> = {},
): Aesthetic {
  return {
    ...entry(id),
    category: 'everyday',
    worldAssociations: [],
    suggestedAges: ['adult'],
    casSuggestions: ['Layer simple separates.'],
    wildcard: false,
    ...overrides,
  };
}
export function world(
  id = 'test-world',
  overrides: Partial<World> = {},
): World {
  return {
    ...entry(id),
    worldType: 'residential',
    tags: ['coastal'],
    neighborhoods: [{ ...entry(`${id}:neighborhood`), worldId: id }],
    lots: [
      {
        ...entry(`${id}:lot`),
        worldId: id,
        neighborhoodId: `${id}:neighborhood`,
        size: { width: 20, height: 30 },
        lotType: 'residential',
      },
    ],
    ...overrides,
  };
}
export function prompt(
  id = 'test-family',
  overrides: Partial<HouseholdPrompt> = {},
): HouseholdPrompt {
  return {
    ...entry(id),
    category: 'families',
    minimumMembers: 2,
    maximumMembers: 2,
    ageRequirements: [],
    memberSlots: [
      {
        id: 'parent',
        name: 'Parent',
        allowedAges: ['young-adult', 'adult', 'elder'],
        occult: 'human',
        requiredPacks: [],
      },
      {
        id: 'child',
        name: 'Child',
        allowedAges: ['child', 'teen'],
        occult: 'human',
        requiredPacks: [],
      },
    ],
    dynamics: [
      {
        id: 'parent-child',
        fromSlotId: 'parent',
        toSlotId: 'child',
        kind: 'biological-parent',
      },
    ],
    financialSituation: 'Stable',
    livingArrangement: 'Shared home',
    backstory: 'A family settles in.',
    ...overrides,
  };
}
export function member(
  id: string,
  age: HouseholdMember['age'],
): HouseholdMember {
  return { id, name: id, age, slotId: id, occult: 'human', requiredPacks: [] };
}
export function simData(): SimData {
  const traits: Trait[] = [
    'roleplay:patient',
    'roleplay:curious',
    'roleplay:generous',
    'roleplay:reserved',
  ].map((id) => ({ ...entry(id), conflictsWith: [] }));
  const aspirations: Aspiration[] = [
    { ...entry('roleplay:goal'), traitRequirements: [] },
  ];
  const careers: Career[] = [
    { ...entry('roleplay:work'), kind: 'roleplay' },
    { ...entry('roleplay:other-work'), kind: 'roleplay' },
  ];
  const personalities: PersonalityProfile[] = [
    {
      ...entry('roleplay:profile'),
      hobbies: ['Drawing'],
      likes: ['Rain'],
      dislikes: ['Noise'],
      personalGoal: 'Make a friend.',
      flaw: 'Avoids asking for help.',
    },
  ];
  return { traits, aspirations, careers, personalities };
}
export function relationship(
  id = 'test-friends',
  overrides: Partial<Relationship> = {},
): Relationship {
  return { ...entry(id), kind: 'friendship', tone: 'positive', ...overrides };
}
export function catalog(): ContentCatalog {
  const sim = simData();
  return {
    packs: [
      {
        id: 'test-pack',
        name: 'Fictional test pack',
        type: 'expansion',
        verification: { status: 'not-applicable', sources: [] },
      },
    ],
    worlds: [world()],
    households: [prompt()],
    aesthetics: [
      aesthetic('inspired', { tags: ['coastal'] }),
      aesthetic('outsider'),
      aesthetic('wildcard', { wildcard: true }),
    ],
    traits: sim.traits,
    aspirations: sim.aspirations,
    careers: sim.careers,
    relationships: [relationship()],
  };
}
