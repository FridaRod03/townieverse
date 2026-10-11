import type {
  GeneratorPreferences,
  Lot,
  Neighborhood,
  World,
} from '../types/models';
import type { EngineResult, RandomSource } from '../types/engine';
import { failure, success } from '../types/engine';
import { weightedSelect } from '../utils/random';
import {
  eligibleEntries,
  eligibilityReasons,
  modeWeight,
  validateEntries,
  validatePreferences,
} from './eligibility';

export function selectWorld(
  worlds: readonly World[],
  preferences: GeneratorPreferences,
  random: RandomSource,
): EngineResult<World> {
  const eligible = eligibleEntries(worlds, preferences);
  if (eligible.success)
    for (const world of eligible.value) {
      const validation = validateWorld(world, preferences);
      if (!validation.success) return validation;
    }
  return eligible.success
    ? weightedSelect(
        eligible.value,
        (world) => modeWeight(world, preferences),
        random,
      )
    : eligible;
}
export function validateWorld(
  world: World,
  preferences: GeneratorPreferences,
): EngineResult<true> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const data = validateEntries([world, ...world.neighborhoods, ...world.lots]);
  if (!data.success) return data;
  const reasons = eligibilityReasons(world, preferences);
  if (reasons.length)
    return failure(
      'INVALID_CONFIG',
      'The selected world conflicts with your filters.',
      reasons,
    );
  if (
    world.neighborhoods.some((entry) => entry.worldId !== world.id) ||
    world.lots.some(
      (entry) =>
        entry.worldId !== world.id ||
        !world.neighborhoods.some(
          (neighborhood) => neighborhood.id === entry.neighborhoodId,
        ),
    )
  )
    return failure('INVALID_DATA', 'World associations do not agree.');
  return success(true);
}
export function selectNeighborhood(
  world: World,
  preferences: GeneratorPreferences,
  random: RandomSource,
): EngineResult<Neighborhood> {
  const valid = validateWorld(world, preferences);
  if (!valid.success) return valid;
  const eligible = eligibleEntries(world.neighborhoods, preferences);
  return eligible.success
    ? weightedSelect(
        eligible.value,
        (entry) => modeWeight(entry, preferences),
        random,
      )
    : eligible;
}
export function exactLotEligible(lot: Lot): boolean {
  return (
    !!lot.size &&
    Number.isInteger(lot.size.width) &&
    Number.isInteger(lot.size.height) &&
    lot.size.width > 0 &&
    lot.size.height > 0 &&
    (lot.origin !== 'official' || lot.verification.status === 'verified')
  );
}
export function selectLot(
  world: World,
  preferences: GeneratorPreferences,
  random: RandomSource,
  options: {
    neighborhoodId?: string;
    previouslyRolledIds?: readonly string[];
  } = {},
): EngineResult<Lot> {
  const valid = validateWorld(world, preferences);
  if (!valid.success) return valid;
  if (options.neighborhoodId) {
    const neighborhood = world.neighborhoods.find(
      (entry) => entry.id === options.neighborhoodId,
    );
    if (!neighborhood || eligibilityReasons(neighborhood, preferences).length)
      return failure(
        'INVALID_CONFIG',
        'The selected neighborhood is missing or disabled.',
      );
  }
  const eligible = eligibleEntries(world.lots, preferences);
  if (!eligible.success) return eligible;
  const pool = eligible.value.filter(
    (lot) =>
      exactLotEligible(lot) &&
      (!options.neighborhoodId ||
        lot.neighborhoodId === options.neighborhoodId) &&
      !options.previouslyRolledIds?.includes(lot.id) &&
      world.neighborhoods.some(
        (entry) =>
          entry.id === lot.neighborhoodId &&
          !eligibilityReasons(entry, preferences).length,
      ),
  );
  const result = weightedSelect(
    pool,
    (lot) => modeWeight(lot, preferences),
    random,
  );
  return !result.success && result.error.code === 'EMPTY_POOL'
    ? failure(
        'EMPTY_POOL',
        'No verified or custom exact lots remain. Add a custom lot, enable packs, or clear previously rolled lots.',
      )
    : result;
}
