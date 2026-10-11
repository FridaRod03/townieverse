import type { World } from '../../types/models';
import { entry, list, rows, slug, verified } from './common';

const neighborhoodSource = 'https://sims.fandom.com/wiki/Neighborhood';
// Map neighborhoods (including named special venues in Windenburg/San Myshuno).
// Hidden destinations and career sets remain out of this map-world model.
const neighborhoodRows = rows(
  `
Windenburg|The Crumbling Isle;Windslar;Lykke Centre;Olde Platz;The Bluffs;Ancient Ruins;Von Haunt Estate
San Myshuno|Uptown;Spice Market;Arts Quarter;Fashion District;Myshuno Meadows
Forgotten Hollow|Forgotten Hollow
Brindleton Bay|Sable Square;Whiskerman's Wharf;Cavalier Cove;Deadgrass Isle
Del Sol Valley|Mirage Park;The Pinnacles;Starlight Boulevard
StrangerVille|StrangerVille Plaza;Shady Acres
Sulani|Mua Pel'am;Ohan'ali Town;Lani St. Taz
Glimmerbrook|Glimmerbrook
Britechester|University of Britechester;Foxbury Institute;Gibbs Hill
Evergreen Harbor|Port Promise;Grims Quarry;Conifer Station
Mt. Komorebi|Wakaba;Senbamachi;Yukimatsu
Henford-on-Bagley|Finchwick;Old New Henford;The Bramblewood
Tartosa|Porto Luminoso;Terra Amorosa
Moonwood Mill|Moonwood Mill
Copperdale|Prescott Square;Plumbite Cove;Rockridge Heights
San Sequoia|Anchorpoint Wharf;Gilbert Gardens;Hopewell Hills
Chestnut Ridge|New Appaloosa;Riders' Glen;Galloping Gulch
Tomarang|Morensong;Koh Sahpa
Ciudad Enamorada|Vista Hermosa;Plaza Mariposa;Nuevo Corazón
`,
  2,
);
// Exact dimensions are asserted only for the rows individually inspected. No
// household occupancy, prices, room counts, or apartment unit sizes are inferred.
const lotRows = rows(
  `
Oasis Springs|Bedrock Strait|Agave Abode|20|15|residential|https://sims.fandom.com/wiki/Bedrock_Strait
Oasis Springs|Bedrock Strait|Nookstone|20|15|residential|https://imsuanne.com/sims-4-worlds/
Forgotten Hollow|Forgotten Hollow|Straud Mansion|40|30|residential|https://sims.fandom.com/wiki/Forgotten_Hollow
Forgotten Hollow|Forgotten Hollow|Wolfsbane Manor|30|30|residential|https://sims.fandom.com/wiki/Forgotten_Hollow
Forgotten Hollow|Forgotten Hollow|Garliclauter Place|30|20|residential|https://sims.fandom.com/wiki/Forgotten_Hollow
Moonwood Mill|Moonwood Mill|The Collective Cabin|40|30|residential|https://sims.fandom.com/wiki/Moonwood_Mill
Moonwood Mill|Moonwood Mill|New Moon Shack|20|15|residential|https://sims.fandom.com/wiki/Moonwood_Mill
Moonwood Mill|Moonwood Mill|Prowler's Patch|30|30|residential|https://sims.fandom.com/wiki/Moonwood_Mill
Moonwood Mill|Moonwood Mill|The Grimtooth Bar & Bunker|50|40|bar|https://sims.fandom.com/wiki/Moonwood_Mill
Moonwood Mill|Moonwood Mill|The Moonwood Mill Library|40|30|library|https://sims.fandom.com/wiki/Moonwood_Mill
`,
  7,
);

/** Additive enrichment retains all preexisting IDs and records. */
export function enrichGeography(input: readonly World[]): World[] {
  return input.map((world) => {
    const names = neighborhoodRows.find(([name]) => name === world.name)?.[1];
    const neighborhoods = [...world.neighborhoods];
    for (const name of names ? list(names) : []) {
      if (neighborhoods.some((item) => item.name === name)) continue;
      neighborhoods.push({
        ...entry(
          'neighborhood',
          name,
          `Official map neighborhood in ${world.name}; lot coverage is documented separately.`,
          {
            origin: 'official',
            requiredPacks: world.requiredPacks,
            verification: {
              ...verified(
                neighborhoodSource,
                `https://sims.fandom.com/wiki/${world.name.replaceAll(' ', '_')}`,
              ),
              notes:
                'Names checked against indexed Sims Wiki neighborhood/world listings on 2026-10-10. Source is a community reference, not EA. Hidden areas are not included.',
            },
          },
        ),
        id: `library:neighborhood:${slug(world.name)}:${slug(name)}`,
        worldId: world.id,
      });
    }
    const lots = [...world.lots];
    for (const [
      worldName,
      neighborhoodName,
      name,
      width,
      height,
      lotType,
      source,
    ] of lotRows.filter(([name]) => name === world.name)) {
      const neighborhood = neighborhoods.find(
        (item) => item.name === neighborhoodName,
      );
      if (!neighborhood)
        throw new Error(`Missing neighborhood for ${name} in ${worldName}`);
      lots.push({
        ...entry(
          'lot',
          name,
          `Official ${lotType} lot in ${neighborhoodName}, ${worldName}.`,
          {
            origin: 'official',
            requiredPacks: world.requiredPacks,
            categories: [lotType],
            verification: verified(source),
          },
        ),
        worldId: world.id,
        neighborhoodId: neighborhood.id,
        size: { width: Number(width), height: Number(height) },
        lotType,
      });
    }
    return { ...world, neighborhoods, lots };
  });
}
