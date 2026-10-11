import type {
  ContentCatalog,
  GeneratedResult,
  GeneratorPreferences,
} from '../types/models';
import type { EngineResult } from '../types/engine';
import { failure, success } from '../types/engine';
import { createSeededRandom } from '../utils/random';
import { matchesDiscovery } from '../utils/aestheticDiscovery';
import {
  validateCatalog,
  validatePreferences,
  eligibilityReasons,
} from './eligibility';
import { generateHousehold, validateHousehold } from './households';
import { blendAesthetics, selectAesthetic } from './aesthetics';
import { selectWorld, validateWorld } from './worlds';
import { rerollFields } from './locking';

export type CoreField = 'world' | 'household' | 'aesthetic' | 'blend';
export function validateCoreResult(
  result: GeneratedResult,
  data: ContentCatalog,
  preferences: GeneratorPreferences,
): EngineResult<true> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const catalog = validateCatalog(data);
  if (!catalog.success) return catalog;
  if (result.sim || result.relationship || result.neighborhood || result.lot)
    return failure(
      'INVALID_CONFIG',
      'The core orchestrator only validates world, household, aesthetic, and blend fields. Use the dedicated Sim, relationship, and lot helpers for other results.',
    );
  if (result.world) {
    if (
      !data.worlds.some(
        (world) => JSON.stringify(world) === JSON.stringify(result.world),
      )
    )
      return failure(
        'INVALID_DATA',
        'Selected world is missing from or differs from the catalog.',
      );
    const world = validateWorld(result.world, preferences);
    if (!world.success) return world;
  }
  if (result.household) {
    const prompt = data.households.find(
      (entry) => entry.id === result.household?.promptId,
    );
    if (!prompt)
      return failure(
        'INVALID_DATA',
        'Household prompt is missing from the catalog.',
      );
    const household = validateHousehold(result.household, preferences, prompt);
    if (!household.success) return household;
  }
  for (const aesthetic of [
    result.aesthetic,
    result.blend?.first,
    result.blend?.second,
  ]) {
    if (!aesthetic) continue;
    if (
      !data.aesthetics.some(
        (entry) => JSON.stringify(entry) === JSON.stringify(aesthetic),
      ) ||
      eligibilityReasons(aesthetic, preferences).length ||
      !matchesDiscovery(aesthetic, preferences)
    )
      return failure(
        'INVALID_CONFIG',
        'Selected aesthetic conflicts with the catalog or filters.',
        [aesthetic.id],
      );
  }
  if (result.blend && result.blend.first.id === result.blend.second.id)
    return failure(
      'INVALID_CONFIG',
      'A blend must contain two different aesthetics.',
    );
  return success(true);
}

/** Dedicated independent random streams: locking one field cannot shift another's stream. */
export function rollCoreResult(
  data: ContentCatalog,
  preferences: GeneratorPreferences,
  seed: string,
  options: {
    previous?: GeneratedResult;
    fields?: readonly CoreField[];
    locks?: readonly CoreField[];
    iteration?: number;
  } = {},
): EngineResult<GeneratedResult> {
  const iteration = options.iteration ?? 0;
  if (typeof seed !== 'string' || !Number.isInteger(iteration) || iteration < 0)
    return failure(
      'INVALID_CONFIG',
      'Seed must be text and reroll iteration must be a non-negative integer.',
    );
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const valid = validateCatalog(data);
  if (!valid.success) return valid;
  const random = (field: CoreField) =>
    createSeededRandom(JSON.stringify([seed, iteration, field]));
  const previous = options.previous ?? {
    id: `result:${seed}:${iteration}`,
    seed,
  };
  const result = rerollFields<GeneratedResult>({
    previous,
    fields: options.fields ?? ['world', 'household', 'aesthetic'],
    locks: options.locks ?? [],
    validate: (draft) => validateCoreResult(draft, data, preferences),
    validateRetained: (draft, rerolling) => {
      const retained = { ...draft };
      for (const field of rerolling) delete retained[field];
      return validateCoreResult(retained, data, preferences);
    },
    generators: {
      world: () => selectWorld(data.worlds, preferences, random('world')),
      household: () =>
        generateHousehold(data.households, preferences, random('household')),
      aesthetic: (draft) =>
        selectAesthetic(data.aesthetics, preferences, random('aesthetic'), {
          world: draft.world,
        }),
      blend: (draft) =>
        blendAesthetics(data.aesthetics, preferences, random('blend'), {
          world: draft.world,
        }),
    },
  });
  return result.success
    ? success({ ...result.value, id: `result:${seed}:${iteration}`, seed })
    : result;
}
