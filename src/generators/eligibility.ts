import { LIFE_STAGES } from '../types/models';
import type {
  ContentEntry,
  ContentCatalog,
  GeneratorPreferences,
  LifeStage,
} from '../types/models';
import { failure, success } from '../types/engine';
import type { EngineResult } from '../types/engine';

export const isAdult = (age: LifeStage) =>
  age === 'young-adult' || age === 'adult' || age === 'elder';
export const hasPacks = (
  required: readonly string[],
  owned: readonly string[],
) => required.every((id) => id === 'base-game' || owned.includes(id));

export function validatePreferences(
  preferences: GeneratorPreferences,
): EngineResult<true> {
  if (
    !['random', 'world-inspired', 'balanced', 'realistic', 'chaos'].includes(
      preferences.mode,
    )
  )
    return failure('INVALID_CONFIG', 'Choose a supported randomization mode.');
  if (
    !Number.isInteger(preferences.maximumHouseholdSize) ||
    preferences.maximumHouseholdSize < 1 ||
    preferences.maximumHouseholdSize > 8
  )
    return failure(
      'INVALID_CONFIG',
      'Maximum household size must be an integer from 1 to 8.',
    );
  if (
    !preferences.allowedAges.length ||
    preferences.allowedAges.some((age) => !LIFE_STAGES.includes(age))
  )
    return failure(
      'INVALID_CONFIG',
      'Select at least one supported life stage.',
    );
  if (
    [preferences.ownedPacks, preferences.aestheticCategories].some((list) =>
      list.some((item) => typeof item !== 'string' || !item.trim()),
    )
  )
    return failure(
      'INVALID_CONFIG',
      'Pack and category IDs must be non-empty strings.',
    );
  if (
    [
      preferences.allowAdultRomance,
      preferences.allowCrime,
      preferences.allowSubstanceUse,
      preferences.allowCustomContent,
      preferences.allowRoleplayContent,
    ].some((value) => typeof value !== 'boolean') ||
    typeof preferences.aestheticSearch !== 'string'
  )
    return failure(
      'INVALID_CONFIG',
      'Content controls must be booleans and search must be text.',
    );
  return success(true);
}

export function validateEntries(
  entries: readonly ContentEntry[],
): EngineResult<true> {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id.trim() || ids.has(entry.id))
      return failure(
        'INVALID_DATA',
        'Content IDs must be non-empty and unique.',
        [entry.id],
      );
    ids.add(entry.id);
    if (!Number.isFinite(entry.weight) || entry.weight < 0)
      return failure(
        'INVALID_WEIGHT',
        'Content weights must be finite and non-negative.',
        [entry.id],
      );
    if (
      !Number.isFinite(entry.commonness) ||
      entry.commonness < 0 ||
      entry.commonness > 1
    )
      return failure('INVALID_DATA', 'Commonness must be between 0 and 1.', [
        entry.id,
      ]);
    if (entry.allowedAges?.some((age) => !LIFE_STAGES.includes(age)))
      return failure(
        'INVALID_DATA',
        'Content contains an unknown life stage.',
        [entry.id],
      );
    if (
      entry.origin === 'official' &&
      entry.verification.status === 'verified' &&
      !entry.verification.sources.length
    )
      return failure(
        'INVALID_DATA',
        'Verified official content requires a source.',
        [entry.id],
      );
  }
  return success(true);
}

export function validateCatalog(catalog: ContentCatalog): EngineResult<true> {
  const content = [
    ...catalog.worlds,
    ...catalog.worlds.flatMap((world) => [
      ...world.neighborhoods,
      ...world.lots,
    ]),
    ...catalog.households,
    ...catalog.aesthetics,
    ...catalog.traits,
    ...catalog.aspirations,
    ...catalog.careers,
    ...catalog.relationships,
  ];
  const valid = validateEntries(content);
  if (!valid.success) return valid;
  const ids = new Set(content.map((entry) => entry.id));
  const packIds = new Set<string>();
  for (const pack of catalog.packs) {
    if (!pack.id.trim() || ids.has(pack.id) || packIds.has(pack.id))
      return failure(
        'INVALID_DATA',
        'Pack IDs must be unique across the catalog.',
        [pack.id],
      );
    packIds.add(pack.id);
  }
  for (const entry of content) {
    if (
      entry.requiredPacks.some((id) => id !== 'base-game' && !packIds.has(id))
    )
      return failure('INVALID_DATA', 'Content references an unknown pack.', [
        entry.id,
      ]);
  }
  for (const world of catalog.worlds) {
    if (
      world.neighborhoods.some((entry) => entry.worldId !== world.id) ||
      world.lots.some(
        (lot) =>
          lot.worldId !== world.id ||
          !world.neighborhoods.some((entry) => entry.id === lot.neighborhoodId),
      )
    )
      return failure(
        'INVALID_DATA',
        'World, neighborhood, and lot associations must agree.',
        [world.id],
      );
  }
  for (const prompt of catalog.households) {
    if (
      prompt.memberSlots.some((slot) =>
        slot.requiredPacks.some((id) => id !== 'base-game' && !packIds.has(id)),
      )
    )
      return failure(
        'INVALID_DATA',
        'A household member slot references an unknown pack.',
        [prompt.id],
      );
  }
  return success(true);
}

/** Participant ages are hard restrictions; aesthetic suggestedAges are not. */
export function eligibilityReasons(
  entry: ContentEntry,
  preferences: GeneratorPreferences,
  participantAges: readonly LifeStage[] = [],
): string[] {
  const reasons: string[] = [];
  if (entry.origin === 'official' && entry.verification.status !== 'verified')
    reasons.push('Official content is not verified for use.');
  if (!hasPacks(entry.requiredPacks, preferences.ownedPacks))
    reasons.push('A required pack is disabled.');
  if (entry.origin === 'custom' && !preferences.allowCustomContent)
    reasons.push('Custom content is disabled.');
  if (entry.origin === 'roleplay' && !preferences.allowRoleplayContent)
    reasons.push('Roleplay content is disabled.');
  if (entry.themes.includes('adult-romance') && !preferences.allowAdultRomance)
    reasons.push('Adult romance is disabled.');
  if (entry.themes.includes('crime') && !preferences.allowCrime)
    reasons.push('Crime storylines are disabled.');
  if (entry.themes.includes('substance-use') && !preferences.allowSubstanceUse)
    reasons.push('Substance storylines are disabled.');
  if (
    participantAges.some(
      (age) =>
        !preferences.allowedAges.includes(age) ||
        (entry.allowedAges && !entry.allowedAges.includes(age)),
    )
  )
    reasons.push('A participant age is incompatible.');
  if (
    (entry.adultOnly || entry.themes.includes('adult-romance')) &&
    (!participantAges.length || participantAges.some((age) => !isAdult(age)))
  )
    reasons.push(
      'This entry requires explicitly identified adult participants.',
    );
  if (
    !participantAges.length &&
    entry.allowedAges &&
    !entry.allowedAges.some((age) => preferences.allowedAges.includes(age))
  )
    reasons.push('No allowed life stage is compatible.');
  return reasons;
}

export function eligibleEntries<T extends ContentEntry>(
  entries: readonly T[],
  preferences: GeneratorPreferences,
  ages: readonly LifeStage[] = [],
): EngineResult<T[]> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const data = validateEntries(entries);
  if (!data.success) return data;
  return success(
    entries.filter(
      (entry) => eligibilityReasons(entry, preferences, ages).length === 0,
    ),
  );
}

export function modeWeight(
  entry: ContentEntry,
  preferences: GeneratorPreferences,
): number {
  if (preferences.mode === 'random') return 1;
  if (preferences.mode === 'realistic')
    return entry.weight * (1 + 9 * entry.commonness);
  if (preferences.mode === 'chaos')
    return entry.weight * (1 + 9 * (1 - entry.commonness));
  return entry.weight;
}
