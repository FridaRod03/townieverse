import { writeFileSync } from 'node:fs';
import { catalog, simData, twists } from '../src/data/library';
import { inspectContent } from '../src/data/validation';
import { styleTypeOf, rarityOf } from '../src/data/aestheticTaxonomy';
const countBy = (items: readonly string[]) =>
  Object.fromEntries(
    [...new Set(items)].map((key) => [
      key,
      items.filter((item) => item === key).length,
    ]),
  );
const officialWorlds = catalog.worlds.filter(
  (world) => world.origin === 'official',
);
const report = {
  ...inspectContent(catalog, simData.personalities, twists),
  checkedOn: '2026-10-10',
  coverage: {
    aestheticTypes: countBy(catalog.aesthetics.map(styleTypeOf)),
    aestheticCategories: countBy(
      catalog.aesthetics.map((style) => style.category),
    ),
    aestheticRarities: countBy(catalog.aesthetics.map(rarityOf)),
    aestheticVerification: countBy(
      catalog.aesthetics.map((style) => style.verification.status),
    ),
    worldAestheticMatches: Object.fromEntries(
      officialWorlds.map((world) => [
        world.name,
        catalog.aesthetics.filter(
          (style) =>
            style.worldAssociations.includes(world.id) ||
            style.tags.some((tag) => world.tags.includes(tag)),
        ).length,
      ]),
    ),
    packsByType: countBy(catalog.packs.map((pack) => pack.type)),
    worldsByType: countBy(officialWorlds.map((world) => world.worldType)),
    officialNeighborhoods: officialWorlds.reduce(
      (total, world) => total + world.neighborhoods.length,
      0,
    ),
    worldsMissingNeighborhoods: officialWorlds
      .filter((world) => !world.neighborhoods.length)
      .map((world) => world.name),
    worldsMissingLots: officialWorlds
      .filter((world) => !world.lots.length)
      .map((world) => world.name),
    sourceCheckedFashionTerms: catalog.aesthetics.filter(
      (style) =>
        style.verification.status === 'verified' &&
        styleTypeOf(style) !== 'practical',
    ).length,
    sourceCheckedPracticalGuides: catalog.aesthetics.filter(
      (style) =>
        style.verification.status === 'verified' &&
        styleTypeOf(style) === 'practical',
    ).length,
    descriptiveStylingGuides: catalog.aesthetics.filter(
      (style) => styleTypeOf(style) === 'practical',
    ).length,
    originalStylingExamples: catalog.aesthetics.filter(
      (style) => styleTypeOf(style) === 'original',
    ).length,
    householdCategories: countBy(
      catalog.households.map((prompt) => prompt.category),
    ),
    householdSizes: countBy(
      catalog.households.map((prompt) => String(prompt.memberSlots.length)),
    ),
    householdLifeStages: countBy(
      catalog.households.flatMap((prompt) =>
        prompt.memberSlots.flatMap((slot) => slot.allowedAges),
      ),
    ),
    relationshipKinds: countBy(
      catalog.relationships.map((prompt) => prompt.kind),
    ),
    relationshipTones: countBy(
      catalog.relationships.map((prompt) => prompt.tone),
    ),
    matureThemes: countBy(twists.flatMap((prompt) => prompt.themes)),
    officialTraits: catalog.traits.filter((item) => item.origin === 'official')
      .length,
    officialAspirations: catalog.aspirations.filter(
      (item) => item.origin === 'official',
    ).length,
    officialCareers: catalog.careers.filter(
      (item) => item.origin === 'official',
    ).length,
  },
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report'))
  writeFileSync(
    new URL('../docs/content-validation.json', import.meta.url),
    JSON.stringify(report, null, 2) + '\n',
  );
if (report.issues.some((issue) => issue.severity === 'error'))
  process.exitCode = 1;
