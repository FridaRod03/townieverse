import type { Aspiration, Career, Trait } from '../../types/models';
import { adultAges, entry, rows, verified } from './common';

const guide =
  'https://cdn-assets-ts4.pulse.ea.com/Guide/TheSims4_Players_Guide.pdf';
const help = 'https://help.ea.com/en/articles/the-sims/the-sims-4/';
const teenPlus = ['teen', ...adultAges] as const;
// A conservative subset with no mutual trait conflicts. Teen+ restriction avoids
// asserting unresearched child availability; it is narrower than game availability.
export const traits: Trait[] = [
  'Art Lover',
  'Bookworm',
  'Creative',
  'Geek',
  'Genius',
  'Music Lover',
  'Perfectionist',
].map((name) => ({
  ...entry('trait', name, `Official base-game personality trait: ${name}.`, {
    origin: 'official',
    allowedAges: [...teenPlus],
    verification: verified(
      guide,
      'https://sims.fandom.com/wiki/Trait_conflict',
    ),
    categories: ['personality-trait'],
  }),
  conflictsWith: [],
}));
export const aspirations: Aspiration[] = [
  ...['Musical Genius', 'Painter Extraordinaire', 'Bestselling Author'].map(
    (name) => ({
      ...entry('aspiration', name, `Official base-game aspiration: ${name}.`, {
        origin: 'official',
        allowedAges: [...teenPlus],
        verification: verified(guide),
        categories: ['aspiration'],
      }),
      traitRequirements: [],
    }),
  ),
  ...[
    'Artistic Prodigy',
    'Whiz Kid',
    'Rambunctious Scamp',
    'Social Butterfly',
  ].map((name) => ({
    ...entry(
      'aspiration',
      name,
      `Official base-game childhood aspiration: ${name}.`,
      {
        origin: 'official',
        allowedAges: ['child'],
        verification: verified(
          'https://help.ea.com/no/articles/the-sims/the-sims-4/child-skills/',
        ),
        categories: ['aspiration'],
      },
    ),
    traitRequirements: [],
  })),
];
// Name | required pack | guide URL suffix | kind. Base game is implicit.
const specs = rows(
  `
Astronaut|-|the-sims-4-astronaut-career|career
Athlete|-|the-sims-4-athlete-career|career
Business|-|the-sims-4-business-career|career
Criminal|-|the-sims-4-criminal-career|career
Culinary|-|the-sims-4-culinary-career|career
Entertainer|-|the-sims-4-entertainer-career|career
Painter|-|painter-career|career
Secret Agent|-|secret-agent-career|career
Style Influencer|-|style-influencer-career|career
Tech Guru|-|tech-guru-career|career
Writer|-|writer-career|career
Babysitter|-|babysitter-career|part-time
Barista|-|barista-career|part-time
Fast Food Employee|-|fast-food-employee-career|part-time
Manual Laborer|-|manual-laborer-career|part-time
Retail Employee|-|retail-employee-career|part-time
Detective|get-to-work|detective-career|career
Doctor|get-to-work|doctor-career|career
Scientist|get-to-work|scientist-career|career
Civil Designer|eco-lifestyle|the-sims-4-civil-designer-career|career
Critic|city-living|the-sims-4-critic-career|career
Engineer|discover-university|the-sims-4-engineer-career|career
Gardener|seasons|the-sims-4-gardener-career|career
Interior Decorator|dream-home-decorator|interior-decorator-career|career
Law|discover-university|law-career|career
Military|strangerville|military-career|career
Politician|city-living|politician-career|career
Reaper|life-and-death|reaper-career|career
Romance Consultant|lovestruck|romance-consultant-career|career
Salaryperson|snowy-escape|salaryperson-career|career
Social Media|city-living|social-media-career|career
Undertaker|life-and-death|undertaker-career|career
Handyperson|for-rent|handyperson-career|part-time
Diver|island-living|diver-career|part-time
Fisherman|island-living|fisherman-career|part-time
Lifeguard|island-living|lifeguard-career|part-time
Simfluencer|high-school-years|simfluencer-career|part-time
Video Game Streamer|high-school-years|video-game-streamer-career|part-time
Actor|get-famous|actor-career|career
Conservationist|island-living|the-sims-4-conservationist-career|career
Education|discover-university|the-sims-4-education-career|career
Freelancer|-|the-sims-4-freelancer-career|career
Naturopath|enchanted-by-nature|naturopath-career|career
Park Worker|adventure-awaits|the-sims-4-park-worker-career|career
`,
  4,
);
export const careers: Career[] = specs.map(([name, pack, path, kind]) => ({
  ...entry(
    'career',
    name,
    `Official ${kind === 'part-time' ? 'part-time job' : 'career'}: ${name}.`,
    {
      origin: 'official',
      requiredPacks: pack === '-' ? [] : [pack],
      allowedAges:
        kind === 'part-time' && !['Diver', 'Handyperson'].includes(name)
          ? [...teenPlus]
          : adultAges,
      verification: verified(help + path + '/'),
      categories: [kind],
      ...(name === 'Criminal'
        ? { themes: ['crime'] as const as ['crime'], adultOnly: true }
        : {}),
    },
  ),
  kind: kind as Career['kind'],
}));
