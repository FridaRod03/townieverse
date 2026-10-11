import type {
  GeneratedRelationship,
  GeneratorPreferences,
  Household,
  HouseholdMember,
  Relationship,
} from '../types/models';
import type { EngineResult, RandomSource } from '../types/engine';
import { failure, success } from '../types/engine';
import { weightedSelect } from '../utils/random';
import { eligibleEntries, isAdult, modeWeight } from './eligibility';
import {
  isParentTie,
  parentChildCompatible,
  validateHousehold,
} from './households';

export function relationshipCompatible(
  prompt: Relationship,
  from: HouseholdMember,
  to: HouseholdMember,
  household?: Household,
  preferences?: GeneratorPreferences,
): boolean {
  if (!from.id || !to.id || from.id === to.id) return false;
  const romantic = ['romantic', 'ex-partners'].includes(prompt.kind);
  if (
    prompt.familyTie &&
    !isParentTie(prompt.familyTie) &&
    !['siblings', 'chosen-family'].includes(prompt.familyTie)
  )
    return false;
  if (
    romantic &&
    !(
      (isAdult(from.age) && isAdult(to.age)) ||
      (from.age === 'teen' &&
        to.age === 'teen' &&
        !prompt.themes.includes('adult-romance') &&
        !prompt.adultOnly)
    )
  )
    return false;
  if (
    (prompt.kind === 'family' || prompt.kind === 'estranged-relatives') &&
    !prompt.familyTie
  )
    return false;
  if (
    prompt.familyTie &&
    !['family', 'estranged-relatives'].includes(prompt.kind)
  )
    return false;
  if (
    prompt.familyTie &&
    isParentTie(prompt.familyTie) &&
    !parentChildCompatible(from.age, to.age, prompt.familyTie)
  )
    return false;
  if (household && preferences) {
    if (
      !household.members.some(
        (member) => member.id === from.id && member.age === from.age,
      ) ||
      !household.members.some(
        (member) => member.id === to.id && member.age === to.age,
      )
    )
      return false;
    const kind = romantic ? 'partners' : prompt.familyTie;
    if (kind) {
      const already = household.dynamics.some(
        (edge) =>
          edge.kind === kind &&
          ((edge.fromId === from.id && edge.toId === to.id) ||
            (!isParentTie(kind) &&
              edge.fromId === to.id &&
              edge.toId === from.id)),
      );
      const dynamics = already
        ? household.dynamics
        : [
            ...household.dynamics,
            {
              id: `relationship-check:${prompt.id}`,
              fromId: from.id,
              toId: to.id,
              kind,
            },
          ];
      if (!validateHousehold({ ...household, dynamics }, preferences).success)
        return false;
    }
  }
  return true;
}

export function generateRelationship(
  prompts: readonly Relationship[],
  from: HouseholdMember,
  to: HouseholdMember,
  preferences: GeneratorPreferences,
  random: RandomSource,
  household?: Household,
): EngineResult<GeneratedRelationship> {
  if (from.id === to.id)
    return failure(
      'INVALID_CONFIG',
      'Choose two different Sims for a relationship.',
    );
  const eligible = eligibleEntries(prompts, preferences, [from.age, to.age]);
  if (!eligible.success) return eligible;
  if (household) {
    const valid = validateHousehold(household, preferences);
    if (!valid.success) return valid;
  }
  const selected = weightedSelect(
    eligible.value.filter((prompt) =>
      relationshipCompatible(prompt, from, to, household, preferences),
    ),
    (entry) => modeWeight(entry, preferences),
    random,
  );
  return selected.success
    ? success({
        id: `relationship:${selected.value.id}:${from.id}:${to.id}`,
        prompt: selected.value,
        fromId: from.id,
        toId: to.id,
      })
    : selected;
}
