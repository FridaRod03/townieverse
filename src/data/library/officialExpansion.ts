import type { Aspiration, Trait } from '../../types/models';
import { adultAges, entry, rows, slug, verified } from './common';

const traitsSource = 'https://www.carls-sims-4-guide.com/traits/';
const aspirationsSource = 'https://www.carls-sims-4-guide.com/aspirations/';
// Personality traits only, not reward, hidden, pet, or infant traits. Conservative
// adult generation restriction is narrower than many traits' in-game availability.
const traitRows = rows(
  `
Active|-
Ambitious|-
Bro|-
Cheerful|-
Childish|-
Clumsy|-
Foodie|-
Gloomy|-
Goofball|-
Hot-Headed|-
Lazy|-
Loves Outdoors|-
Materialistic|-
Neat|-
Outgoing|-
Slob|-
Snob|-
Loner|-
Family-Oriented|-
Good|-
Evil|-
Mean|-
Noncommittal|-
Hates Children|-
Romantic|-
Self-Assured|-
Squeamish|outdoor-retreat
Dance Machine|get-together
Insider|get-together
`,
  2,
);
const conflicts = [
  ['Active', 'Lazy'],
  ['Ambitious', 'Lazy'],
  ['Cheerful', 'Gloomy'],
  ['Cheerful', 'Hot-Headed'],
  ['Gloomy', 'Hot-Headed'],
  ['Goofball', 'Snob'],
  ['Childish', 'Snob'],
  ['Childish', 'Evil'],
  ['Childish', 'Hates Children'],
  ['Neat', 'Lazy'],
  ['Neat', 'Slob'],
  ['Slob', 'Squeamish'],
  ['Loves Outdoors', 'Squeamish'],
  ['Good', 'Evil'],
  ['Good', 'Mean'],
  ['Family-Oriented', 'Noncommittal'],
  ['Family-Oriented', 'Hates Children'],
  ['Loner', 'Outgoing'],
];
export const expandedTraits: Trait[] = traitRows.map(([name, pack]) => ({
  ...entry(
    'trait',
    name,
    `Official selectable personality trait: ${name}. Consult the source for gameplay effects.`,
    {
      origin: 'official',
      requiredPacks: pack === '-' ? [] : [pack],
      allowedAges: adultAges,
      categories: ['personality-trait'],
      verification: {
        ...verified(traitsSource),
        notes:
          'Name, pack, and conflicts within this supported subset checked 2026-10-10. Adult availability is intentionally conservative; child/teen availability requires further research.',
      },
    },
  ),
  conflictsWith: conflicts
    .filter((pair) => pair.includes(name))
    .map(
      (pair) => `library:trait:${slug(pair.find((other) => other !== name)!)}`,
    ),
}));
// No reward traits or career goals masquerading as aspirations. Milestones and
// occult prerequisites are not modeled here; these remain suggestions for CAS.
export const expandedAspirations: Aspiration[] = rows(
  `
Bodybuilder|-
Big Happy Family|-
Successful Lineage|-
Master Chef|-
Master Mixologist|-
Fabulously Wealthy|-
Mansion Baron|-
Renaissance Sim|-
Nerd Brain|-
Computer Whiz|-
Soulmate|-
Angling Ace|-
Freelance Botanist|-
The Curator|-
Friend of the World|-
Joke Star|-
Party Animal|-
Chief of Mischief|-
Outdoor Enthusiast|outdoor-retreat
Leader of the Pack|get-together
City Native|city-living
Super Parent|parenthood
Beach Life|island-living
Eco Innovator|eco-lifestyle
Master Maker|eco-lifestyle
World-Famous Celebrity|get-famous
`,
  2,
).map(([name, pack]) => ({
  ...entry(
    'aspiration',
    name,
    `Official aspiration: ${name}. Goals and milestones are available in the reference guide.`,
    {
      origin: 'official',
      requiredPacks: pack === '-' ? [] : [pack],
      allowedAges: adultAges,
      categories: ['aspiration'],
      verification: {
        ...verified(aspirationsSource),
        notes:
          'Name and pack checked 2026-10-10. Adult generation is conservative; teen selection may exist in-game. These are aspirations, not guarantees that milestones can be completed at every age.',
      },
    },
  ),
  traitRequirements: [],
}));
