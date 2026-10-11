import type {
  Aspiration,
  Career,
  GeneratorPreferences,
  IndividualSim,
  LifeStage,
  Personality,
  PersonalityProfile,
  Trait,
} from '../types/models';
import { failure, success } from '../types/engine';
import type { EngineResult, RandomSource } from '../types/engine';
import { weightedSelect } from '../utils/random';
import {
  eligibleEntries,
  eligibilityReasons,
  modeWeight,
  validateEntries,
  validatePreferences,
} from './eligibility';
import { validateStorylines } from './households';
import { rerollFields } from './locking';

export interface SimData {
  traits: Trait[];
  aspirations: Aspiration[];
  careers: Career[];
  personalities: PersonalityProfile[];
}
export interface SimSettings {
  id: string;
  name: string;
  age: LifeStage;
  traitCount: number;
}
export const traitsCompatible = (traits: readonly Trait[]) =>
  new Set(traits.map((trait) => trait.id)).size === traits.length &&
  !traits.some((trait) =>
    traits.some((other) => trait.conflictsWith.includes(other.id)),
  );

/** Stop early for feasibility checks; enumerate only the selected aspiration. */
function compatibleTraitSets(
  traits: readonly Trait[],
  count: number,
  requirementIds: readonly string[],
  firstOnly = false,
): Trait[][] {
  const required = requirementIds.map((id) =>
    traits.find((trait) => trait.id === id),
  );
  if (
    required.some((trait) => !trait) ||
    required.length > count ||
    !traitsCompatible(required as Trait[])
  )
    return [];
  const combinations: Trait[][] = [];
  const choose = (selected: Trait[], start: number) => {
    if (selected.length === count) {
      if (
        requirementIds.every((id) => selected.some((trait) => trait.id === id))
      )
        combinations.push(selected);
      return;
    }
    for (let index = start; index < traits.length; index++) {
      const next = [...selected, traits[index]];
      if (traitsCompatible(next)) choose(next, index + 1);
      if (firstOnly && combinations.length) return;
    }
  };
  choose([], 0);
  return combinations;
}

function validateSimState(
  sim: IndividualSim,
  data: SimData,
  preferences: GeneratorPreferences,
  ignored: readonly (keyof IndividualSim)[] = [],
): EngineResult<true> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const valid = validateEntries([
    ...data.traits,
    ...data.aspirations,
    ...data.careers,
    ...data.personalities,
  ]);
  if (!valid.success) return valid;
  if (
    !sim.id.trim() ||
    !sim.name.trim() ||
    !preferences.allowedAges.includes(sim.age)
  )
    return failure(
      'INCOMPATIBLE_AGE',
      'Sim identity and life stage must be valid under the current preferences.',
    );
  if (!ignored.includes('personality')) {
    const maximum =
      sim.age === 'newborn'
        ? 0
        : ['infant', 'toddler', 'child'].includes(sim.age)
          ? 1
          : sim.age === 'teen'
            ? 2
            : 3;
    if (
      !sim.personality.traits.length ||
      sim.personality.traits.length > maximum
    )
      return failure(
        'INCOMPATIBLE_AGE',
        'Personality trait count is incompatible with the life stage.',
      );
  }
  const values = [
    ...(ignored.includes('aspiration') ? [] : [sim.aspiration]),
    ...(ignored.includes('career') ? [] : [sim.career]),
    ...(ignored.includes('personality')
      ? []
      : [sim.personality.profile, ...sim.personality.traits]),
  ];
  const catalog = [
    ...data.traits,
    ...data.aspirations,
    ...data.careers,
    ...data.personalities,
  ];
  for (const value of values) {
    if (
      !catalog.some(
        (entry) =>
          entry.id === value.id &&
          JSON.stringify(entry) === JSON.stringify(value),
      )
    )
      return failure(
        'INVALID_DATA',
        'A Sim field is absent from or differs from its catalog entry.',
        [value.id],
      );
    const reasons = eligibilityReasons(value, preferences, [sim.age]);
    if (reasons.length)
      return failure(
        'CONTENT_RESTRICTED',
        'A Sim field conflicts with age, pack, or content preferences.',
        [value.id, ...reasons],
      );
  }
  if (
    (!ignored.includes('personality') &&
      !traitsCompatible(sim.personality.traits)) ||
    (!ignored.includes('personality') &&
      !ignored.includes('aspiration') &&
      sim.aspiration.traitRequirements.some(
        (id) => !sim.personality.traits.some((trait) => trait.id === id),
      ))
  )
    return failure(
      'INVALID_CONFIG',
      'Traits conflict or an aspiration trait requirement is missing.',
    );
  if (
    !ignored.includes('personality') &&
    sim.personality.likes.some((like) =>
      sim.personality.dislikes.includes(like),
    )
  )
    return failure(
      'INVALID_DATA',
      'Likes and dislikes cannot contain the same item.',
    );
  const profile = sim.personality.profile;
  if (
    !ignored.includes('personality') &&
    JSON.stringify([
      sim.personality.hobbies,
      sim.personality.likes,
      sim.personality.dislikes,
      sim.personality.personalGoal,
      sim.personality.flaw,
    ]) !==
      JSON.stringify([
        profile.hobbies,
        profile.likes,
        profile.dislikes,
        profile.personalGoal,
        profile.flaw,
      ])
  )
    return failure(
      'INVALID_DATA',
      'Personality fields must agree with their profile.',
    );
  return validateStorylines(sim.storylines, [sim], preferences);
}

export function validateSim(
  sim: IndividualSim,
  data: SimData,
  preferences: GeneratorPreferences,
): EngineResult<true> {
  return validateSimState(sim, data, preferences);
}

export function generatePersonality(
  data: SimData,
  preferences: GeneratorPreferences,
  random: RandomSource,
  age: LifeStage,
  count: number,
  aspiration: Aspiration,
): EngineResult<Personality> {
  const dataValid = validateEntries([
    ...data.traits,
    ...data.aspirations,
    ...data.careers,
    ...data.personalities,
  ]);
  if (!dataValid.success) return dataValid;
  const aspirationEligible = eligibleEntries([aspiration], preferences, [age]);
  if (!aspirationEligible.success) return aspirationEligible;
  if (!aspirationEligible.value.length)
    return failure(
      'EMPTY_POOL',
      'The selected aspiration conflicts with age, pack, or content filters.',
    );
  const maximum =
    age === 'newborn'
      ? 0
      : ['infant', 'toddler', 'child'].includes(age)
        ? 1
        : age === 'teen'
          ? 2
          : 3;
  if (count > maximum)
    return failure(
      'INCOMPATIBLE_AGE',
      'Trait count exceeds the supported slots for this life stage.',
    );
  if (!Number.isInteger(count) || count < 1 || count > 3)
    return failure(
      'INVALID_CONFIG',
      'Trait count must be an integer from 1 to 3.',
    );
  const profiles = eligibleEntries(data.personalities, preferences, [age]);
  if (!profiles.success) return profiles;
  const traits = eligibleEntries(data.traits, preferences, [age]);
  if (!traits.success) return traits;
  const combinations = compatibleTraitSets(
    traits.value,
    count,
    aspiration.traitRequirements,
  );
  const selected = weightedSelect(
    combinations,
    (combination) =>
      combination.reduce(
        (sum, trait) => sum + modeWeight(trait, preferences),
        0,
      ) / count,
    random,
  );
  if (!selected.success) return selected;
  const profile = weightedSelect(
    profiles.value.filter(
      (entry) => !entry.likes.some((like) => entry.dislikes.includes(like)),
    ),
    (entry) => modeWeight(entry, preferences),
    random,
  );
  if (!profile.success) return profile;
  return success({
    profile: profile.value,
    traits: selected.value,
    hobbies: [...profile.value.hobbies],
    likes: [...profile.value.likes],
    dislikes: [...profile.value.dislikes],
    personalGoal: profile.value.personalGoal,
    flaw: profile.value.flaw,
  });
}

export function generateSim(
  data: SimData,
  preferences: GeneratorPreferences,
  random: RandomSource,
  settings: SimSettings,
): EngineResult<IndividualSim> {
  if (
    !settings.id.trim() ||
    !settings.name.trim() ||
    !Number.isInteger(settings.traitCount) ||
    settings.traitCount < 1 ||
    settings.traitCount > 3
  )
    return failure(
      'INVALID_CONFIG',
      'Provide a Sim ID, name, and trait count from 1 to 3.',
    );
  const valid = validateEntries([
    ...data.traits,
    ...data.aspirations,
    ...data.careers,
    ...data.personalities,
  ]);
  if (!valid.success) return valid;
  const aspirations = eligibleEntries(data.aspirations, preferences, [
    settings.age,
  ]);
  if (!aspirations.success) return aspirations;
  const traits = eligibleEntries(data.traits, preferences, [settings.age]);
  if (!traits.success) return traits;
  const feasibility = new Map<string, boolean>();
  const candidates = aspirations.value.filter((aspiration) => {
    const key = JSON.stringify([...aspiration.traitRequirements].sort());
    if (!feasibility.has(key))
      feasibility.set(
        key,
        !!compatibleTraitSets(
          traits.value,
          settings.traitCount,
          aspiration.traitRequirements,
          true,
        ).length,
      );
    return feasibility.get(key);
  });
  const selection = weightedSelect(
    candidates,
    (entry) => modeWeight(entry, preferences),
    random,
  );
  if (!selection.success) return selection;
  const personality = generatePersonality(
    data,
    preferences,
    random,
    settings.age,
    settings.traitCount,
    selection.value,
  );
  if (!personality.success) return personality;
  const careers = eligibleEntries(data.careers, preferences, [settings.age]);
  if (!careers.success) return careers;
  const career = weightedSelect(
    careers.value,
    (entry) => modeWeight(entry, preferences),
    random,
  );
  if (!career.success) return career;
  const sim: IndividualSim = {
    id: settings.id,
    name: settings.name,
    age: settings.age,
    aspiration: selection.value,
    personality: personality.value,
    career: career.value,
    storylines: [],
  };
  const validation = validateSim(sim, data, preferences);
  return validation.success ? success(sim) : validation;
}

export function rerollSimFields(
  previous: IndividualSim,
  data: SimData,
  preferences: GeneratorPreferences,
  random: RandomSource,
  options: {
    fields: readonly ('personality' | 'career' | 'aspiration')[];
    locks: readonly ('personality' | 'career' | 'aspiration')[];
    traitCount: number;
  },
): EngineResult<IndividualSim> {
  return rerollFields({
    previous,
    fields: options.fields,
    locks: options.locks,
    validate: (sim) => validateSim(sim, data, preferences),
    validateRetained: (sim, rerolling) =>
      validateSimState(sim, data, preferences, rerolling),
    generators: {
      career: () => {
        const pool = eligibleEntries(data.careers, preferences, [previous.age]);
        return pool.success
          ? weightedSelect(
              pool.value,
              (entry) => modeWeight(entry, preferences),
              random,
            )
          : pool;
      },
      personality: (draft) =>
        generatePersonality(
          data,
          preferences,
          random,
          draft.age,
          options.traitCount,
          draft.aspiration,
        ),
      aspiration: (draft) => {
        const pool = eligibleEntries(data.aspirations, preferences, [
          draft.age,
        ]);
        return pool.success
          ? weightedSelect(
              pool.value.filter((entry) =>
                entry.traitRequirements.every((id) =>
                  draft.personality.traits.some((trait) => trait.id === id),
                ),
              ),
              (entry) => modeWeight(entry, preferences),
              random,
            )
          : pool;
      },
    },
  });
}
