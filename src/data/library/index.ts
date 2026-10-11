import { starterCatalog, starterSimData, starterTwists } from '../starter';
import { packs } from './packs';
import { worlds } from './worlds';
import { households } from './households';
import { aesthetics } from './aesthetics';
import { expandedAesthetics } from './aestheticExpansion';
import { relationships } from './relationships';
import { personalities } from './personalities';
import { traits, aspirations, careers } from './official';
import { expandedTraits, expandedAspirations } from './officialExpansion';
import { enrichGeography } from './geographyExpansion';
import type { ContentCatalog } from '../../types/models';
import type { SimData } from '../../generators/sims';
import { twists as expandedTwists } from './twists';
import { adultAges, rows, supportedAges } from './common';
const legacyDetails = Object.fromEntries(
  rows(
    `
denim|Loose everyday waves|Optional light blush|Canvas tote
garden|Practical low braid|Optional warm tint|Small floral clip
minimal|Smooth geometric crop|Optional cool liner|Silver-look small earrings
goth|Soft long waves|Muted berry lip|Antique-style pendant
punk|Choppy textured crop|Graphic dark liner|Patched fabric bag
scene|Side-swept color streaks|Bright accent liner|Layered colorful bracelets
retro|Brushed-back soft layers|Warm subtle eye|Vintage-style shoulder bag
preppy|Neat side part|Optional neutral tint|Simple book satchel
formal|Smooth pinned updo|Defined evening eye|One statement accessory
workwear|Secure tied-back hair|Optional minimal tint|Sturdy practical belt
space|Sculpted angular hair|Silver accent liner|Angular glasses
fairytale|Loose woven braid|Optional soft blush|Small satchel
`,
    4,
  ).map(([key, ...details]) => [key, details]),
);
export const twists = [
  ...expandedTwists,
  ...starterTwists.map((item) => ({
    ...item,
    participantIds: [],
    adultOnly: true,
    allowedAges: adultAges,
  })),
];

// Keep the original authored examples and stable IDs; never silently delete them.
export const catalog: ContentCatalog = {
  packs,
  worlds: [...enrichGeography(worlds), ...starterCatalog.worlds],
  households: [
    ...households,
    ...starterCatalog.households.map((item) =>
      item.adultOnly ? { ...item, allowedAges: adultAges } : item,
    ),
  ],
  aesthetics: [
    ...aesthetics,
    ...expandedAesthetics,
    ...starterCatalog.aesthetics.map((style) => {
      const [hair, makeup, accessory] =
        legacyDetails[style.id.split(':').at(-1)!];
      return {
        ...style,
        styleType: 'original' as const,
        rarity:
          style.commonness >= 0.7
            ? ('common' as const)
            : style.commonness >= 0.3
              ? ('uncommon' as const)
              : ('rare' as const),
        categories: [style.category],
        allowedAges: supportedAges,
        aliases: [],
        hairSuggestions: [hair],
        makeupSuggestions: [makeup],
        accessories: [accessory],
        culturalContext:
          'An original Townieverse styling example, not a separately established fashion subculture.',
        worldAssociations: [
          ...style.worldAssociations,
          ...worlds
            .filter((world) =>
              world.tags.some((tag) => style.tags.includes(tag)),
            )
            .map((world) => world.id),
        ],
      };
    }),
  ],
  traits: [...traits, ...expandedTraits, ...starterCatalog.traits],
  aspirations: [
    ...aspirations,
    ...expandedAspirations,
    ...starterCatalog.aspirations,
  ],
  careers: [...careers, ...starterCatalog.careers],
  relationships: [...relationships, ...starterCatalog.relationships],
};
export const simData: SimData = {
  traits: catalog.traits,
  aspirations: catalog.aspirations,
  careers: catalog.careers,
  personalities: [...personalities, ...starterSimData.personalities],
};
