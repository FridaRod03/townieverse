import type { GeneratorSection, PageId } from '../types/navigation';

// Navigation copy only; content libraries are separate from UI descriptions.
export const generatorSections: GeneratorSection[] = [
  {
    id: 'household',
    number: '01',
    icon: '⌂',
    title: 'Households',
    description:
      'From one-room dreamers to families with a little too much history.',
    preview: [
      'Household composition',
      'Living arrangements',
      'Backstories & secrets',
    ],
  },
  {
    id: 'sim',
    number: '02',
    icon: '✧',
    title: 'Individual Sims',
    description:
      'Give your next main character a personality beyond the perfect outfit.',
    preview: ['Traits & aspirations', 'Careers & hobbies', 'Personal goals'],
  },
  {
    id: 'aesthetic',
    number: '03',
    icon: '✿',
    title: 'Aesthetics',
    description:
      'Find their signature style. Mix a little everyday with a little unexpected.',
    preview: ['Fashion & styling', 'Style blends', 'Category search'],
  },
  {
    id: 'world',
    number: '04',
    icon: '◎',
    title: 'Worlds & lots',
    description:
      'Every good story needs an address. Discover where yours belongs.',
    preview: ['Pack-aware worlds', 'Neighborhoods & lots', 'Custom save lots'],
  },
  {
    id: 'relationship',
    number: '05',
    icon: '♡',
    title: 'Relationships',
    description:
      'Best friends, old flames, chosen family. Make the connections matter.',
    preview: [
      'Relationship types',
      'Shared history',
      'Positive & difficult dynamics',
    ],
  },
  {
    id: 'mature',
    number: '06',
    icon: '☾',
    title: 'Mature stories',
    description:
      'Optional grown-up storylines, with clear boundaries and separate controls.',
    preview: [
      '18+ narrative prompts',
      'Independent content toggles',
      'Adult-age compatibility',
    ],
    adultOnly: true,
  },
];

export function pageFromHash(hash: string): PageId {
  const value = hash.replace(/^#\/?/, '');
  if (value === 'casting') return 'casting';
  if (value === 'population') return 'population';
  if (value === 'web') return 'web';
  return generatorSections.some((section) => section.id === value)
    ? (value as PageId)
    : 'home';
}
