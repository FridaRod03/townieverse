import type {
  Aesthetic,
  AestheticBlend,
  GeneratorPreferences,
  LifeStage,
  World,
} from '../types/models';
import type { EngineResult, RandomSource } from '../types/engine';
import { failure, success } from '../types/engine';
import { uniformSelect, weightedSelect } from '../utils/random';
import { eligibleEntries, modeWeight } from './eligibility';
import {
  associatedWithWorld,
  matchesDiscovery,
} from '../utils/aestheticDiscovery';
import type { DiscoveryFilters } from '../utils/aestheticDiscovery';

export interface AestheticSettings extends DiscoveryFilters {
  world?: World;
  age?: LifeStage;
  excludeIds?: string[];
}
export function matchesWorld(aesthetic: Aesthetic, world?: World): boolean {
  return associatedWithWorld(aesthetic, world);
}
export function selectAesthetic(
  entries: readonly Aesthetic[],
  preferences: GeneratorPreferences,
  random: RandomSource,
  settings: AestheticSettings = {},
): EngineResult<Aesthetic> {
  const eligible = eligibleEntries(
    entries,
    preferences,
    settings.age ? [settings.age] : [],
  );
  if (!eligible.success) return eligible;
  const pool = eligible.value.filter(
    (entry) =>
      !settings.excludeIds?.includes(entry.id) &&
      matchesDiscovery(entry, preferences, settings),
  );
  if (preferences.mode === 'random') return uniformSelect(pool, random);
  const weight = (entry: Aesthetic) =>
    modeWeight(entry, preferences) *
    (settings.age && entry.suggestedAges.includes(settings.age) ? 1.5 : 1);
  if (preferences.mode === 'balanced') {
    // Disjoint buckets: wildcard takes precedence over world association.
    const buckets = [
      {
        probability: 75,
        entries: pool.filter(
          (entry) =>
            !entry.wildcard &&
            matchesWorld(entry, settings.world) &&
            weight(entry) > 0,
        ),
      },
      {
        probability: 20,
        entries: pool.filter(
          (entry) =>
            !entry.wildcard &&
            !matchesWorld(entry, settings.world) &&
            weight(entry) > 0,
        ),
      },
      {
        probability: 5,
        entries: pool.filter((entry) => entry.wildcard && weight(entry) > 0),
      },
    ].filter((bucket) => bucket.entries.length);
    if (!buckets.length)
      return failure(
        pool.length ? 'INVALID_WEIGHT' : 'EMPTY_POOL',
        'No aesthetic can be selected with these filters and weights.',
      );
    // Selecting among remaining buckets normalizes their original probabilities.
    const bucket = weightedSelect(
      buckets,
      (entry) => entry.probability,
      random,
    );
    return bucket.success
      ? weightedSelect(bucket.value.entries, weight, random)
      : bucket;
  }
  return weightedSelect(
    pool,
    (entry) =>
      weight(entry) *
      (preferences.mode === 'world-inspired' &&
      matchesWorld(entry, settings.world)
        ? 6
        : 1),
    random,
  );
}

export function blendAesthetics(
  entries: readonly Aesthetic[],
  preferences: GeneratorPreferences,
  random: RandomSource,
  settings: AestheticSettings = {},
  locked: { first?: Aesthetic; second?: Aesthetic } = {},
): EngineResult<AestheticBlend> {
  for (const item of [locked.first, locked.second]) {
    if (!item) continue;
    // Use the actual filtered pool, rather than testing a stochastic roll.
    const validation = eligibleEntries(
      entries,
      preferences,
      settings.age ? [settings.age] : [],
    );
    if (!validation.success) return validation;
    if (
      !validation.value.some(
        (entry) =>
          entry.id === item.id &&
          JSON.stringify(entry) === JSON.stringify(item),
      ) ||
      settings.excludeIds?.includes(item.id) ||
      !matchesDiscovery(item, preferences, settings)
    )
      return failure(
        'LOCK_CONFLICT',
        'A locked aesthetic conflicts with the current data or filters.',
        [item.id],
      );
  }
  if (locked.first && locked.second && locked.first.id === locked.second.id)
    return failure('LOCK_CONFLICT', 'A blend needs two different aesthetics.');
  const first = locked.first
    ? success(locked.first)
    : selectAesthetic(entries, preferences, random, {
        ...settings,
        excludeIds: [
          ...(settings.excludeIds ?? []),
          ...(locked.second ? [locked.second.id] : []),
        ],
      });
  if (!first.success) return first;
  const second = locked.second
    ? success(locked.second)
    : selectAesthetic(entries, preferences, random, {
        ...settings,
        excludeIds: [...(settings.excludeIds ?? []), first.value.id],
      });
  if (!second.success) return second;
  return success({
    first: first.value,
    second: second.value,
    casSuggestions: [
      ...new Set([
        ...first.value.casSuggestions,
        ...second.value.casSuggestions,
      ]),
    ],
    tags: [...new Set([...first.value.tags, ...second.value.tags])],
  });
}
