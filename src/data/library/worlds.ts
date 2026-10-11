import type { Lot, World } from '../../types/models';
import { entry, list, rows, verified, slug } from './common';

const expansionSource =
  'https://en.wikipedia.org/wiki/The_Sims_4_expansion_packs';
const gameSource = 'https://en.wikipedia.org/wiki/The_Sims_4_game_packs';
const worldSource = 'https://sims.fandom.com/wiki/World';
const eaNews = 'https://www.ea.com/games/the-sims/the-sims-4/news/';
// Names/dependencies are verified facts. Tags are non-exclusive creative styling associations.
// Empty neighborhood/lot arrays represent documented research gaps, never invented data.
const specs = rows(
  `
Willow Creek|base-game|residential|casual;preppy;coastal|Foundry Cove;Courtyard Lane;Pendula View;Sage Estates;Crawdad Quarter;Magnolia Blossom Park
Oasis Springs|base-game|residential|desert;casual;retro|Bedrock Strait;Parched Prospect;Skyward Palms;Acquisition Butte;Mirage Canyon;Desert Bloom Park
Newcrest|base-game|residential|casual;minimalist;suburban|Bridgeview;Llama Lagoon;Ridgeline Drive
Magnolia Promenade|get-to-work|residential|workwear;urban;formal|Magnolia Promenade
Windenburg|get-together|residential|indie;vintage;clubwear;cottagecore|-
San Myshuno|city-living|residential|streetwear;y2k;techwear;urban|-
Forgotten Hollow|vampires|residential|goth;romantic;historical;academia|-
Brindleton Bay|cats-and-dogs|residential|coastal;casual;workwear|-
Del Sol Valley|get-famous|residential|luxury;formal;retro|-
StrangerVille|strangerville|residential|desert;workwear;western|-
Sulani|island-living|residential|surfwear;tropical;resortwear;beach|-
Glimmerbrook|realm-of-magic|residential|fantasy;natural;witchcore|-
Britechester|discover-university|residential|academia;preppy;indie|-
Evergreen Harbor|eco-lifestyle|residential|skater;upcycled;workwear;industrial|-
Mt. Komorebi|snowy-escape|residential|sportswear;minimalist;outdoors|-
Henford-on-Bagley|cottage-living|residential|cottagecore;farmwear;country;mori|-
Tartosa|my-wedding-stories|residential|romantic;resortwear;formal|-
Moonwood Mill|werewolves|residential|grunge;biker;punk;forest;industrial|-
Copperdale|high-school-years|residential|casual;preppy;skater;scene|-
San Sequoia|growing-together|residential|casual;coastal;minimalist|-
Chestnut Ridge|horse-ranch|residential|western;ranchwear;country|-
Tomarang|for-rent|residential|casual;urban;tropical|-
Ciudad Enamorada|lovestruck|residential|romantic;clubwear;urban|-
Ravenwood|life-and-death|residential|whimsigoth;goth;witchcore;vintage|Crow's Crossing;Whispering Glen;Mourningvale
Nordhaven|businesses-and-hobbies|residential|minimalist;workwear;indie;urban|Gammelvik;Iverstad
Innisgreen|enchanted-by-nature|residential|natural;fairycore;cottagecore;mori|Coast of Adhmor;Sprucederry Grove;Everdew
Gibbi Point|adventure-awaits|residential|outdoors;sportswear;coastal|Wanderwood Wilds;Crystal Valley;Jellyfish Junction
Ondarion|royalty-and-legacy|residential|formal;luxury;historical;romantic|Dambele;Verdemar;Bellacorde
Granite Falls|outdoor-retreat|destination|outdoors;forest;workwear|Campground;Granite Falls Forest
Selvadorada|jungle-adventure|destination|outdoors;natural;tropical|Puerto Llamante Marketplace;Belomisia Jungle
Batuu|star-wars-journey-to-batuu|destination|fantasy;futuristic;workwear|Black Spire Outpost;First Order District;Resistance Encampment
`,
  5,
);
const newsByWorld: Record<string, string> = {
  Ravenwood: 'life-and-death-expansion-pack',
  Nordhaven: 'the-sims-4-businesses-and-hobbies-creator-builds',
  Innisgreen: 'enchanted-by-nature-expansion-pack',
  'Gibbi Point': 'adventure-awaits-expansion-pack',
  Ondarion: 'royalty-and-legacy-expansion-pack',
};
export const worlds: World[] = specs.map(
  ([name, pack, type, tags, neighborhoods]) => {
    const source = newsByWorld[name]
      ? eaNews + newsByWorld[name]
      : type === 'destination' ||
          [
            'vampires',
            'strangerville',
            'realm-of-magic',
            'my-wedding-stories',
            'werewolves',
          ].includes(pack)
        ? gameSource
        : pack === 'base-game'
          ? worldSource
          : expansionSource;
    const base = entry(
      'world',
      name,
      `Official ${type} world. Fashion associations are Townieverse suggestions.`,
      {
        origin: 'official',
        requiredPacks: pack === 'base-game' ? [] : [pack],
        verification: verified(source),
        tags: list(tags),
      },
    );
    return {
      ...base,
      worldType: type as World['worldType'],
      neighborhoods: list(neighborhoods).map((neighborhood) => ({
        ...entry(
          'neighborhood',
          neighborhood,
          'Verified neighborhood name; exact lot coverage is incomplete.',
          {
            origin: 'official',
            requiredPacks: base.requiredPacks,
            verification: verified(
              newsByWorld[name] ? eaNews + newsByWorld[name] : worldSource,
            ),
          },
        ),
        id: `library:neighborhood:${slug(name)}:${slug(neighborhood)}`,
        worldId: base.id,
      })),
      lots: [],
    };
  },
);

const willow = worlds.find((world) => world.name === 'Willow Creek')!;
const foundry = willow.neighborhoods.find(
  (neighborhood) => neighborhood.name === 'Foundry Cove',
)!;
// Dimensions/location/type checked against the neighborhood and Gallery listing;
// household occupancy, prices, and interior layouts are intentionally not asserted.
willow.lots = rows(
  `
Streamlet Single|20|15
Crick Cabana|20|15
Daisy Hovel|30|20
Garden Essence|40|30
`,
  3,
).map(([name, width, height]): Lot => ({
  ...entry(
    'lot',
    name,
    'Official residential lot in Foundry Cove, Willow Creek.',
    {
      origin: 'official',
      verification: verified(
        'https://sims.fandom.com/wiki/Foundry_Cove',
        'https://sims.fandom.com/wiki/The_Sims_4_Gallery/List_of_lots',
      ),
      categories: ['residential'],
    },
  ),
  worldId: willow.id,
  neighborhoodId: foundry.id,
  size: { width: Number(width), height: Number(height) },
  lotType: 'residential',
}));
