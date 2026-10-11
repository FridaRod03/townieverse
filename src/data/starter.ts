import type {
  Aesthetic,
  ContentCatalog,
  ContentEntry,
  DynamicTemplate,
  GamePack,
  HouseholdCategory,
  HouseholdPrompt,
  LifeStage,
  MemberSlot,
  PersonalityProfile,
  Relationship,
  World,
} from '../types/models';
import type { SimData } from '../generators/sims';

// A deliberately small preview library, authored as roleplay suggestions.
const adult: LifeStage[] = ['young-adult', 'adult', 'elder'];
const supported: LifeStage[] = ['child', 'teen', ...adult];
function content(
  id: string,
  name: string,
  description: string,
  extra: Partial<ContentEntry> = {},
): ContentEntry {
  return {
    id: `starter:${id}`,
    name,
    description,
    origin: 'roleplay',
    requiredPacks: [],
    verification: { status: 'not-applicable', sources: [] },
    categories: [],
    tags: [],
    weight: 1,
    commonness: 0.7,
    adultOnly: false,
    themes: [],
    ...extra,
  };
}
export const starterPacks: GamePack[] = [
  {
    id: 'get-to-work',
    name: 'Get to Work',
    type: 'expansion',
    verification: {
      status: 'verified',
      sources: [
        'https://news.ea.com/press-releases/press-releases-details/2015/The-Sims-4-Get-to-Work-is-Now-Available/default.aspx',
      ],
    },
  },
  {
    id: 'vampires',
    name: 'Vampires',
    type: 'game',
    verification: {
      status: 'verified',
      sources: [
        'https://www.ea.com/games/the-sims/the-sims-4/buy/addon/the-sims-4-vampires',
      ],
    },
  },
];
function fictionalWorld(
  id: string,
  name: string,
  description: string,
  tags: string[],
  neighborhoods: string[],
  requiredPacks: string[] = [],
): World {
  const base = content(`world:${id}`, name, description, {
    tags,
    requiredPacks,
  });
  return {
    ...base,
    worldType: 'residential',
    neighborhoods: neighborhoods.map((name, index) => ({
      ...content(
        `neighborhood:${id}:${index}`,
        name,
        'A fictional neighborhood for your custom save.',
      ),
      worldId: base.id,
    })),
    lots: [],
  };
}
export const starterWorlds = [
  fictionalWorld(
    'harbor',
    'Rosewater Harbor',
    'A fictional coastal save concept: weathered homes, community gardens, and second chances.',
    ['coastal', 'casual'],
    ['Boardwalk Gardens', 'Old Ferry Row'],
  ),
  fictionalWorld(
    'arcade',
    'Silver Arcade',
    'A fictional city save concept: tiny apartments, creative workshops, and late-night diners.',
    ['urban', 'y2k'],
    ['Studio District', 'Neon Square'],
  ),
  fictionalWorld(
    'moon',
    'Moonlit Quarter',
    'A fictional Vampires-themed save concept. This is not an official game world.',
    ['goth', 'romantic'],
    ['Velvet Terrace', 'Quiet Courtyard'],
    ['vampires'],
  ),
];
const slot = (
  id: string,
  name: string,
  allowedAges: LifeStage[] = adult,
): MemberSlot => ({
  id,
  name,
  allowedAges,
  occult: 'human',
  requiredPacks: [],
});
const tie = (
  fromSlotId: string,
  toSlotId: string,
  kind: DynamicTemplate['kind'],
): DynamicTemplate => ({
  id: `${fromSlotId}:${toSlotId}:${kind}`,
  fromSlotId,
  toSlotId,
  kind,
});
function household(
  id: string,
  name: string,
  category: HouseholdCategory,
  members: MemberSlot[],
  dynamics: DynamicTemplate[],
  backstory: string,
  finance = 'Working class',
  living = 'Apartment',
  extra: Partial<HouseholdPrompt> = {},
): HouseholdPrompt {
  return {
    ...content(`household:${id}`, name, backstory),
    category,
    minimumMembers: members.length,
    maximumMembers: members.length,
    ageRequirements: [],
    memberSlots: members,
    dynamics,
    financialSituation: finance,
    livingArrangement: living,
    backstory,
    ...extra,
  };
}
export const starterHouseholds: HouseholdPrompt[] = [
  household(
    'zine',
    'The midnight zine',
    'singles',
    [slot('a', 'Morgan')],
    [],
    'Morgan moved out with a printer, a suitcase, and a plan to turn a neighborhood zine into a community.',
    'Working class',
    'Studio',
  ),
  household(
    'keys',
    'Two keys, one dream',
    'couples',
    [slot('a', 'Alex'), slot('b', 'Rowan')],
    [tie('a', 'b', 'partners')],
    'Alex and Rowan finally share a home, but each imagines a different future for their spare room.',
    'Comfortable',
    'Apartment',
  ),
  household(
    'garden',
    'The garden promise',
    'families',
    [
      slot('a', 'Sage', ['adult']),
      slot('b', 'Drew', ['adult']),
      slot('c', 'Robin', ['child']),
    ],
    [
      tie('a', 'b', 'partners'),
      tie('a', 'c', 'biological-parent'),
      tie('b', 'c', 'biological-parent'),
    ],
    'A family inherits a neglected garden and promises to make it a place where everyone belongs.',
    'Working class',
    'House',
  ),
  household(
    'newchapter',
    'A new chapter',
    'single-parents',
    [slot('a', 'Jamie', ['adult']), slot('b', 'Casey', ['teen'])],
    [tie('a', 'b', 'adoptive-parent')],
    'Jamie and Casey have just settled in. Their shared weekend ritual is the one constant in a changing world.',
    'Working class',
    'Apartment',
  ),
  household(
    'blended',
    'The long dinner table',
    'blended-families',
    [
      slot('a', 'Reese', ['adult']),
      slot('b', 'Taylor', ['adult']),
      slot('c', 'Ellis', ['child']),
    ],
    [
      tie('a', 'b', 'partners'),
      tie('a', 'c', 'biological-parent'),
      tie('b', 'c', 'step-parent'),
    ],
    'A newly blended family tries to build traditions that make space for everyone’s old favorites.',
    'Comfortable',
    'House',
  ),
  household(
    'roommates',
    'Three unfinished projects',
    'roommates',
    [slot('a', 'Finley'), slot('b', 'Avery'), slot('c', 'Jules')],
    [
      tie('a', 'b', 'roommates'),
      tie('b', 'c', 'roommates'),
      tie('a', 'c', 'friends'),
    ],
    'Three creative roommates share rent and equipment. Their biggest challenge is deciding whose project gets the living room.',
    'Working class',
    'Apartment',
  ),
  household(
    'generations',
    'Recipes across generations',
    'multigenerational',
    [
      slot('a', 'River', ['elder']),
      slot('b', 'Quinn', ['adult']),
      slot('c', 'Remy', ['child']),
    ],
    [tie('a', 'b', 'biological-parent'), tie('b', 'c', 'biological-parent')],
    'Three generations keep a recipe notebook alive while negotiating how much of the past to carry forward.',
    'Comfortable',
    'House',
  ),
  household(
    'elders',
    'The encore club',
    'elders',
    [slot('a', 'Marin', ['elder']), slot('b', 'Devon', ['elder'])],
    [tie('a', 'b', 'friends')],
    'Two longtime friends retire into a shared home and decide it is finally time to perform the songs they used to write.',
    'Comfortable',
    'House',
  ),
  household(
    'occult',
    'Letters after sunset',
    'occult',
    [{ ...slot('a', 'Noel'), occult: 'vampire', requiredPacks: ['vampires'] }],
    [],
    'A vampire archivist opens an evening correspondence club and begins reconnecting with the living.',
    'Comfortable',
    'House',
    { requiredPacks: ['vampires'], commonness: 0.1 },
  ),
  household(
    'afterhours',
    'The after-hours agreement',
    'adult-only',
    [slot('a', 'Blair'), slot('b', 'Cameron')],
    [tie('a', 'b', 'partners')],
    'Two adult partners are renegotiating their open relationship while protecting their separate ambitions.',
    'Comfortable',
    'Apartment',
    { adultOnly: true, themes: ['adult-romance'], commonness: 0.2 },
  ),
];
const styleSpecs: [
  string,
  string,
  string,
  string,
  string[],
  string[],
  number,
  boolean,
][] = [
  [
    'denim',
    'Soft denim weekends',
    'Everyday',
    'Comfortable denim and familiar layers with a lived-in feel.',
    ['casual', 'coastal'],
    [
      'Relaxed jeans and a cotton shirt',
      'Canvas sneakers and a light cardigan',
    ],
    1,
    false,
  ],
  [
    'garden',
    'Garden journal',
    'Everyday',
    'Practical layers with botanical colors and handmade details.',
    ['coastal', 'natural'],
    [
      'Olive trousers with a cream knit',
      'Sturdy boots and simple floral accessories',
    ],
    0.9,
    false,
  ],
  [
    'minimal',
    'Silver minimalism',
    'Everyday',
    'Clean shapes with cool metal accents and quiet contrast.',
    ['urban', 'silver'],
    ['Monochrome separates', 'One silver accessory and sleek shoes'],
    0.9,
    false,
  ],
  [
    'goth',
    'Velvet library goth',
    'Alternative',
    'Soft dark textures, bookish layers, and a little romance.',
    ['goth', 'romantic'],
    [
      'Velvet jacket over a high-neck blouse',
      'Dark boots and an antique-style pendant',
    ],
    0.3,
    false,
  ],
  [
    'punk',
    'DIY patchwork punk',
    'Alternative',
    'Personalized clothing built around repairs, patches, and self-expression.',
    ['urban', 'punk'],
    [
      'Patched denim or a worn jacket',
      'Laced boots and mismatched accessories',
    ],
    0.3,
    false,
  ],
  [
    'scene',
    'Neon scene scrapbook',
    'Alternative',
    'Bright accents and layered accessories with an expressive silhouette.',
    ['y2k', 'urban'],
    [
      'Black basics with neon accents',
      'Layered bracelets and colorful hair accessories',
    ],
    0.2,
    false,
  ],
  [
    'retro',
    'Retro record shop',
    'Vintage',
    'Warm tones and relaxed vintage shapes for a music collector.',
    ['urban', 'retro'],
    [
      'Wide-leg trousers and a patterned shirt',
      'A cropped jacket and vintage-inspired shoes',
    ],
    0.6,
    false,
  ],
  [
    'preppy',
    'Campus postcard',
    'Vintage',
    'Classic collegiate layers softened by playful color.',
    ['preppy', 'casual'],
    [
      'Sweater vest over a collared shirt',
      'Loafers or clean sneakers and a small bag',
    ],
    0.8,
    false,
  ],
  [
    'formal',
    'Midnight satin',
    'Formal',
    'Elegant evening separates with a restrained shine.',
    ['romantic', 'silver'],
    [
      'Satin blouse or tailored jacket',
      'Polished shoes and one statement accessory',
    ],
    0.5,
    false,
  ],
  [
    'workwear',
    'Workshop utility',
    'Everyday',
    'Durable pieces and useful pockets for a hands-on creative.',
    ['casual', 'urban'],
    ['Utility trousers and a work shirt', 'Sturdy boots with rolled sleeves'],
    0.9,
    false,
  ],
  [
    'space',
    'Chrome daydream',
    'Fantasy',
    'A futuristic roleplay look with reflective details and sculptural shapes.',
    ['silver', 'y2k'],
    [
      'Metallic accents with simple shapes',
      'Angular glasses and a crisp layered silhouette',
    ],
    0.1,
    true,
  ],
  [
    'fairytale',
    'Storybook wanderer',
    'Fantasy',
    'Soft layered pieces that suggest an imagined adventure.',
    ['natural', 'romantic'],
    ['Flowing layers in earthy colors', 'A small satchel and lace-up boots'],
    0.1,
    true,
  ],
];
export const starterAesthetics: Aesthetic[] = styleSpecs.map(
  ([
    id,
    name,
    category,
    description,
    tags,
    casSuggestions,
    commonness,
    wildcard,
  ]) => ({
    ...content(`style:${id}`, name, description, { tags, commonness }),
    category,
    worldAssociations: starterWorlds
      .filter((world) => world.tags.some((tag) => tags.includes(tag)))
      .map((world) => world.id),
    suggestedAges: [...supported],
    casSuggestions,
    wildcard,
  }),
);
const traits = [
  'Patient listener',
  'Restless maker',
  'Quiet observer',
  'Generous neighbor',
  'Playful storyteller',
  'Careful planner',
].map((name, index) => ({
  ...content(
    `trait:${index}`,
    name,
    'Fictional roleplay personality suggestion; not an official CAS trait.',
    { allowedAges: supported },
  ),
  conflictsWith: [] as string[],
}));
const aspirations = [
  'Build a welcoming community',
  'Finish a creative project',
  'Explore a new hobby',
].map((name, index) => ({
  ...content(
    `aspiration:${index}`,
    name,
    'Fictional roleplay goal; not an official in-game aspiration.',
    { allowedAges: supported },
  ),
  traitRequirements: [] as string[],
}));
const careers = [
  {
    ...content(
      'career:student',
      'Student',
      'Roleplay occupation for a school-age Sim.',
      { allowedAges: ['child', 'teen'] },
    ),
    kind: 'roleplay' as const,
  },
  ...['Community librarian', 'Freelance repairer', 'Neighborhood gardener'].map(
    (name, index) => ({
      ...content(
        `career:${index}`,
        name,
        'Fictional roleplay occupation; not an official career track.',
        { allowedAges: adult },
      ),
      kind: 'roleplay' as const,
    }),
  ),
  {
    ...content(
      'career:shop',
      'Independent shop owner',
      'Get to Work-inspired roleplay occupation, not an official career track.',
      { allowedAges: adult, requiredPacks: ['get-to-work'] },
    ),
    kind: 'roleplay' as const,
  },
];
export const starterPersonalities: PersonalityProfile[] = [
  {
    ...content(
      'personality:maker',
      'The thoughtful maker',
      'A practical creative who notices small details.',
      { allowedAges: supported },
    ),
    hobbies: ['Drawing', 'Repair projects'],
    likes: ['Rainy afternoons', 'Handmade gifts'],
    dislikes: ['Cluttered plans'],
    personalGoal: 'Finish a project worth sharing.',
    flaw: 'Waits too long to ask for help.',
  },
  {
    ...content(
      'personality:neighbor',
      'The welcoming neighbor',
      'Someone who turns little rituals into connections.',
      { allowedAges: supported },
    ),
    hobbies: ['Gardening', 'Cooking'],
    likes: ['Shared meals', 'Sunny walks'],
    dislikes: ['Broken promises'],
    personalGoal: 'Make someone feel at home.',
    flaw: 'Says yes to too many requests.',
  },
  {
    ...content(
      'personality:explorer',
      'The curious explorer',
      'A restless collector of stories and new experiences.',
      { allowedAges: supported },
    ),
    hobbies: ['Photography', 'Music'],
    likes: ['New places', 'Old records'],
    dislikes: ['Rigid routines'],
    personalGoal: 'Find a new favorite place.',
    flaw: 'Leaves projects half-finished.',
  },
];
export const starterSimData: SimData = {
  traits,
  aspirations,
  careers,
  personalities: starterPersonalities,
};
const relationshipSpecs: [
  string,
  Relationship['kind'],
  Relationship['tone'],
  string,
  string,
][] = [
  [
    'friends',
    'friendship',
    'positive',
    'The everyday check-in',
    'A small daily check-in has grown into dependable friendship.',
  ],
  [
    'friends-neutral',
    'friendship',
    'neutral',
    'Almost friends',
    'They enjoy the same hobby but have not made time to get closer.',
  ],
  [
    'rivals',
    'rivalry',
    'negative',
    'Friendly faces, sharp elbows',
    'They compete over a local project and struggle to share credit.',
  ],
  [
    'romance',
    'romantic',
    'positive',
    'Slow-burn connection',
    'Shared routines are becoming a gentle, age-appropriate romance.',
  ],
  [
    'romance-neutral',
    'romantic',
    'neutral',
    'Unspoken expectations',
    'They need an honest conversation about what their connection means.',
  ],
  [
    'work',
    'coworkers',
    'neutral',
    'Different methods',
    'They approach a shared task differently but respect the results.',
  ],
  [
    'work-negative',
    'coworkers',
    'negative',
    'Missing credit',
    'One feels their contributions to a shared project have been overlooked.',
  ],
  [
    'neighbors',
    'neighbors',
    'positive',
    'Borrowed sugar',
    'An ordinary favor became the start of a neighborhood tradition.',
  ],
  [
    'neighbors-neutral',
    'neighbors',
    'neutral',
    'Across the hallway',
    'They exchange polite greetings and wonder about each other’s lives.',
  ],
  [
    'chosen',
    'chosen-family',
    'positive',
    'A place at the table',
    'They have built a supportive family through choice and care.',
  ],
];
export const starterRelationships: Relationship[] = [
  ...relationshipSpecs.map(([id, kind, tone, name, description]) => ({
    ...content(`relationship:${id}`, name, description, {
      allowedAges: supported,
    }),
    kind,
    tone,
  })),
  {
    ...content(
      'relationship:parent',
      'Learning to listen',
      'A biological parent and child find a new way to communicate.',
    ),
    kind: 'family',
    tone: 'positive',
    familyTie: 'biological-parent',
  },
  {
    ...content(
      'relationship:adoptive',
      'Shared rituals',
      'An adoptive parent and child make a tradition of their own.',
    ),
    kind: 'family',
    tone: 'neutral',
    familyTie: 'adoptive-parent',
  },
  {
    ...content(
      'relationship:siblings',
      'Old arguments, new understanding',
      'Siblings revisit an old disagreement with more patience.',
    ),
    kind: 'family',
    tone: 'negative',
    familyTie: 'siblings',
  },
];
export const starterTwists: ContentEntry[] = [
  content(
    'twist:open',
    'A changing agreement',
    'Adult partners need to renegotiate the boundaries of an open relationship.',
    { allowedAges: adult, themes: ['adult-romance'], adultOnly: true },
  ),
  content(
    'twist:crime',
    'The missing funds',
    'An adult discovers suspicious bookkeeping in a community project and must decide how to respond.',
    { allowedAges: adult, themes: ['crime'] },
  ),
  content(
    'twist:substance',
    'A quieter chapter',
    'An adult seeks support to change an unhealthy relationship with substance use.',
    { allowedAges: adult, themes: ['substance-use'] },
  ),
];
export const starterCatalog: ContentCatalog = {
  packs: starterPacks,
  worlds: starterWorlds,
  households: starterHouseholds,
  aesthetics: starterAesthetics,
  traits,
  aspirations,
  careers,
  relationships: starterRelationships,
};
