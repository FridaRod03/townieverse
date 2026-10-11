import type { Aesthetic, GeneratorPreferences, World } from '../types/models';
import { rarityOf, styleTypeOf } from '../data/aestheticTaxonomy';

export interface DiscoveryFilters {
  styleType?: Aesthetic['styleType'] | '';
  rarity?: Aesthetic['rarity'] | '';
  worldFilter?: World;
}
const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function associatedWithWorld(style: Aesthetic, world?: World): boolean {
  return (
    !!world &&
    (style.worldAssociations.includes(world.id) ||
      style.tags.some((tag) => world.tags.includes(tag)))
  );
}
/** Shared by directory, single selection, and locked blends. */
export function matchesDiscovery(
  style: Aesthetic,
  preferences: GeneratorPreferences,
  filters: DiscoveryFilters = {},
): boolean {
  const query = normalize(preferences.aestheticSearch.trim());
  return (
    (!preferences.aestheticCategories.length ||
      preferences.aestheticCategories.includes(style.category)) &&
    (!query ||
      normalize(
        [
          style.name,
          ...(style.aliases ?? []),
          style.description,
          ...style.tags,
        ].join(' '),
      ).includes(query)) &&
    (!filters.styleType || styleTypeOf(style) === filters.styleType) &&
    (!filters.rarity || rarityOf(style) === filters.rarity) &&
    (!filters.worldFilter || associatedWithWorld(style, filters.worldFilter))
  );
}
