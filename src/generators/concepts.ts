import type {
  ContentCatalog,
  GeneratorPreferences,
  IndividualSim,
  LifeStage,
} from '../types/models';
import type {
  HouseholdConcept,
  HouseholdFilters,
  SharedSettings,
  RollContext,
} from '../types/interface';
import type { EngineResult } from '../types/engine';
import { failure, success } from '../types/engine';
import { rollCoreResult } from './results';
import { generateSim, validateSim } from './sims';
import type { SimData } from './sims';
import { selectLot, selectNeighborhood } from './worlds';
import {
  eligibilityReasons,
  isAdult,
  validatePreferences,
} from './eligibility';
import { validateHousehold } from './households';
import { generateStoryline } from './storylines';
import type { ContentEntry } from '../types/models';

export const traitCountForAge = (age: LifeStage) =>
  age === 'teen' ? 2 : ['child', 'toddler', 'infant'].includes(age) ? 1 : 3;
export function householdCatalog(
  data: ContentCatalog,
  settings: SharedSettings,
  filters: HouseholdFilters,
): EngineResult<ContentCatalog> {
  const validation = validatePreferences(settings.preferences);
  if (!validation.success) return validation;
  if (
    !Number.isInteger(settings.minimumHouseholdSize) ||
    settings.minimumHouseholdSize < 1 ||
    settings.minimumHouseholdSize > settings.preferences.maximumHouseholdSize
  )
    return failure(
      'INVALID_CONFIG',
      'Minimum household size must be between 1 and the maximum size.',
    );
  const households = data.households.filter(
    (prompt) =>
      prompt.memberSlots.length >= settings.minimumHouseholdSize &&
      prompt.memberSlots.length <= settings.preferences.maximumHouseholdSize &&
      (!filters.categories.length ||
        filters.categories.includes(prompt.category)) &&
      (!filters.finance || prompt.financialSituation === filters.finance) &&
      (!filters.living || prompt.livingArrangement === filters.living),
  );
  return success({
    ...data,
    households,
    worlds: data.worlds.filter((world) => world.worldType === 'residential'),
  });
}
export function validateConcept(
  concept: HouseholdConcept,
  data: ContentCatalog,
  simData: SimData,
  preferences: GeneratorPreferences,
): EngineResult<true> {
  const prompt = data.households.find(
    (entry) => entry.id === concept.household.promptId,
  );
  if (!prompt)
    return failure(
      'LOCK_CONFLICT',
      'The household concept is excluded by the current household filters. Unlock it or restore those filters.',
    );
  const household = validateHousehold(concept.household, preferences, prompt);
  if (!household.success) return household;
  if (
    concept.sims.length !== concept.household.members.length ||
    new Set(concept.sims.map((sim) => sim.id)).size !== concept.sims.length
  )
    return failure(
      'INVALID_DATA',
      'Sim profiles must match the household roster exactly.',
    );
  for (const sim of concept.sims) {
    if (
      !concept.household.members.some(
        (member) => member.id === sim.id && member.age === sim.age,
      )
    )
      return failure(
        'INCOMPATIBLE_AGE',
        'A Sim profile differs from its household member requirements.',
      );
    const valid = validateSim(sim, simData, preferences);
    if (!valid.success) return valid;
    if (eligibilityReasons(concept.aesthetic, preferences, [sim.age]).length)
      return failure(
        'INCOMPATIBLE_AGE',
        'The shared aesthetic is incompatible with a household member.',
      );
  }
  return success(true);
}
export function generateConcept(
  data: ContentCatalog,
  simData: SimData,
  twists: readonly ContentEntry[],
  settings: SharedSettings,
  filters: HouseholdFilters,
  roll: RollContext,
  previous?: HouseholdConcept,
  locks: readonly ('world' | 'household' | 'aesthetic')[] = [],
): EngineResult<HouseholdConcept> {
  const filtered = householdCatalog(data, settings, filters);
  if (!filtered.success) return filtered;
  const core = rollCoreResult(filtered.value, settings.preferences, roll.seed, {
    previous: previous
      ? {
          id: 'concept',
          seed: previous.seed,
          world: previous.world,
          household: previous.household,
          aesthetic: previous.aesthetic,
        }
      : undefined,
    locks,
    iteration: roll.iteration,
  });
  if (!core.success) return core;
  const { world, household, aesthetic } = core.value;
  if (!world || !household || !aesthetic)
    return failure(
      'INVALID_DATA',
      'The engine could not assemble a complete household concept.',
    );
  const sims: IndividualSim[] = [];
  for (const member of household.members) {
    const sim = generateSim(
      simData,
      settings.preferences,
      roll.random(`sim:${member.id}`),
      {
        id: member.id,
        name: member.name,
        age: member.age,
        traitCount: traitCountForAge(member.age),
      },
    );
    if (!sim.success) return sim;
    sims.push(sim.value);
  }
  const neighborhood = selectNeighborhood(
    world,
    settings.preferences,
    roll.random('neighborhood'),
  );
  const lot = selectLot(world, settings.preferences, roll.random('lot'), {
    neighborhoodId: neighborhood.success ? neighborhood.value.id : undefined,
  });
  const adults = household.members.filter((member) => isAdult(member.age));
  // Optional twists target a single identified adult; they cannot implicate other members.
  const twist = adults.length
    ? generateStoryline(
        twists,
        [adults[0]],
        settings.preferences,
        roll.random('twist'),
      )
    : undefined;
  const concept: HouseholdConcept = {
    world,
    household,
    sims,
    aesthetic,
    neighborhood: neighborhood.success ? neighborhood.value : undefined,
    lot: lot.success ? lot.value : undefined,
    twist: twist?.success ? twist.value : undefined,
    seed: roll.seed,
    iteration: roll.iteration,
  };
  const valid = validateConcept(
    concept,
    filtered.value,
    simData,
    settings.preferences,
  );
  return valid.success ? success(concept) : valid;
}
