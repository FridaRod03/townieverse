import type { GamePack } from '../../types/models';
import { slug, verified } from './common';

const store = 'https://www.ea.com/games/the-sims/the-sims-4/store/categories/';
const group = (
  type: GamePack['type'],
  names: string,
  source: string,
): GamePack[] =>
  names.split('|').map((name) => ({
    id: slug(name.replace(/&/g, 'and')),
    name,
    type,
    verification: verified(source),
  }));
export const packs: GamePack[] = [
  {
    id: 'base-game',
    name: 'Base Game',
    type: 'base-game',
    verification: verified('https://www.ea.com/games/the-sims/the-sims-4'),
  },
  ...group(
    'expansion',
    'Get to Work|Get Together|City Living|Cats & Dogs|Seasons|Get Famous|Island Living|Discover University|Eco Lifestyle|Snowy Escape|Cottage Living|High School Years|Growing Together|Horse Ranch|For Rent|Lovestruck|Life & Death|Businesses & Hobbies|Enchanted by Nature|Adventure Awaits|Royalty & Legacy',
    store + 'expansion-packs',
  ),
  ...group(
    'game',
    'Outdoor Retreat|Spa Day|Dine Out|Vampires|Parenthood|Jungle Adventure|StrangerVille|Realm of Magic|Star Wars: Journey to Batuu|Dream Home Decorator|My Wedding Stories|Werewolves',
    store + 'game-packs',
  ),
  ...group(
    'stuff',
    'Luxury Party|Perfect Patio|Cool Kitchen|Spooky Stuff|Movie Hangout|Romantic Garden|Kids Room|Backyard|Vintage Glamour|Bowling Night|Fitness|Toddler|Laundry Day|My First Pet|Moschino|Tiny Living|Nifty Knitting|Paranormal|Home Chef Hustle|Crystal Creations',
    store + 'stuff-packs',
  ),
  ...group(
    'kit',
    'Mean Girls Capsule|Clueless Capsule|Music Den|Lady Bridgerton’s Masquerade Ball Fashion|Lady Bridgerton’s Masquerade Ballroom|Yard Charm|Wonderland Playroom|Tea Time Solarium|Silver Screen Style|Prairie Dreams|SpongeBob Kid’s Room|SpongeBob’s House|Garden to Table|Modern Retreat|Autumn Apparel|Grange Mudroom|Essential Glam|Restoration Workshop|Golden Years|Kitchen Clutter|Sweet Allure|Sleek Bathroom|Business Chic|Refined Living Room|Casanova Cave|Secret Sanctuary|Comfy Gamer|Sweet Slumber Party|Cozy Kitsch',
    store + 'kits',
  ),
  ...group(
    'kit',
    'Storybook Nursery|Artist Studio|Riviera Retreat|Cozy Bistro|Urban Homage|Party Essentials|Goth Galore|Castle Estate|Modern Luxe|Poolside Splash|Book Nook|Grunge Revival|Basement Treasures|Greenhouse Haven|Bathroom Clutter|Simtimates Collection|Everyday Clutter|Pastel Pop|Desert Luxe|First Fits|Moonlight Chic|Little Campers|Decor to the Max|Carnaval Streetwear|Modern Menswear|Blooming Rooms|Incheon Arrivals|Fashion Street|Industrial Loft|Courtyard Oasis',
    store + 'kits/2',
  ),
  ...group('kit', 'Bust the Dust|Throwback Fit', store + 'kits/3'),
  ...group(
    'kit',
    'Country Kitchen',
    'https://www.ea.com/da/games/the-sims/the-sims-4/buy/addon/the-sims-4-country-kitchen-kit',
  ),
];
// Maker Packs and Digital Deluxe upgrades are deliberately outside this model.
