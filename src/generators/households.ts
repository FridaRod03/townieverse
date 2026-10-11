import { LIFE_STAGES } from '../types/models';
import type {
  Household,
  HouseholdPrompt,
  HouseholdDynamic,
  GeneratorPreferences,
  LifeStage,
  Storyline,
} from '../types/models';
import { failure, success } from '../types/engine';
import type { EngineResult, RandomSource } from '../types/engine';
import { shuffled, weightedSelect } from '../utils/random';
import {
  eligibilityReasons,
  hasPacks,
  isAdult,
  modeWeight,
  validateEntries,
  validatePreferences,
} from './eligibility';

export const isParentTie = (kind: HouseholdDynamic['kind']) =>
  ['biological-parent', 'adoptive-parent', 'step-parent'].includes(kind);

/** Conservative life-stage approximation, not an inference of exact biological ages. */
export function parentChildCompatible(
  parent: LifeStage,
  child: LifeStage,
  kind: HouseholdDynamic['kind'],
): boolean {
  if (!isAdult(parent)) return false;
  if (kind === 'biological-parent') {
    const allowed: Record<string, LifeStage[]> = {
      'young-adult': ['newborn', 'infant', 'toddler', 'child'],
      adult: ['newborn', 'infant', 'toddler', 'child', 'teen', 'young-adult'],
      elder: [
        'newborn',
        'infant',
        'toddler',
        'child',
        'teen',
        'young-adult',
        'adult',
      ],
    };
    return allowed[parent].includes(child);
  }
  return LIFE_STAGES.indexOf(parent) > LIFE_STAGES.indexOf(child);
}

export function validateStorylines(
  stories: readonly Storyline[],
  participants: readonly { id: string; age: LifeStage }[],
  preferences: GeneratorPreferences,
): EngineResult<true> {
  const valid = validateEntries(stories);
  if (!valid.success) return valid;
  for (const story of stories) {
    if (
      !story.participantIds.length ||
      new Set(story.participantIds).size !== story.participantIds.length
    )
      return failure(
        'CONTENT_RESTRICTED',
        'Storylines need unique, explicitly identified participants.',
        [story.id],
      );
    const members = story.participantIds.map((id) =>
      participants.find((member) => member.id === id),
    );
    if (members.some((member) => !member))
      return failure(
        'CONTENT_RESTRICTED',
        'A storyline references an unknown participant.',
        [story.id],
      );
    const reasons = eligibilityReasons(
      story,
      preferences,
      members.map((member) => member!.age),
    );
    if (reasons.length)
      return failure(
        'CONTENT_RESTRICTED',
        'A storyline conflicts with age, pack, or content preferences.',
        [story.id, ...reasons],
      );
  }
  return success(true);
}

export function validateHousehold(
  household: Household,
  preferences: GeneratorPreferences,
  prompt?: HouseholdPrompt,
): EngineResult<true> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const errors: string[] = [];
  const members = household.members;
  if (!members.some((member) => member.age === 'teen' || isAdult(member.age)))
    errors.push('A household needs at least one Teen or older member.');
  if (members.length < 1 || members.length > preferences.maximumHouseholdSize)
    errors.push(
      `Household must contain 1–${preferences.maximumHouseholdSize} Sims.`,
    );
  if (
    new Set(members.map((member) => member.id)).size !== members.length ||
    members.some((member) => !member.id.trim())
  )
    errors.push('Member IDs must be non-empty and unique.');
  if (
    members.some(
      (member) =>
        !preferences.allowedAges.includes(member.age) ||
        !LIFE_STAGES.includes(member.age),
    )
  )
    errors.push('A member has an incompatible life stage.');
  if (
    members.some(
      (member) => !hasPacks(member.requiredPacks, preferences.ownedPacks),
    )
  )
    errors.push('A member requires a disabled pack.');
  if (
    members.some(
      (member) =>
        !['human', 'ghost', 'custom'].includes(member.occult) &&
        !member.requiredPacks.length,
    )
  )
    errors.push(
      'Pack-specific occult members need explicit pack requirements.',
    );
  if (
    members.some((member) => member.occult === 'custom') &&
    !preferences.allowCustomContent
  )
    errors.push('Custom occult content is disabled.');
  if (
    (household.adultOnly || household.category === 'adult-only') &&
    members.some((member) => !isAdult(member.age))
  )
    errors.push('Adult-only households cannot contain minors.');
  const parentEdges: HouseholdDynamic[] = [];
  const pairs = new Map<string, Set<string>>();
  const dynamicIds = new Set<string>();
  for (const dynamic of household.dynamics) {
    if (
      !dynamic.id.trim() ||
      dynamicIds.has(dynamic.id) ||
      members.some((member) => member.id === dynamic.id)
    )
      errors.push('Dynamic IDs must be non-empty and unique.');
    dynamicIds.add(dynamic.id);
    const from = members.find((member) => member.id === dynamic.fromId);
    const to = members.find((member) => member.id === dynamic.toId);
    if (!from || !to || from.id === to.id) {
      errors.push('Every relationship needs two different existing members.');
      continue;
    }
    const key = [from.id, to.id].sort().join('|');
    const kinds = pairs.get(key) ?? new Set<string>();
    if (kinds.has(dynamic.kind))
      errors.push('Duplicate relationship assignment.');
    kinds.add(dynamic.kind);
    pairs.set(key, kinds);
    if (isParentTie(dynamic.kind)) {
      parentEdges.push(dynamic);
      if (!parentChildCompatible(from.age, to.age, dynamic.kind))
        errors.push(
          `Invalid ${dynamic.kind} ages for ${from.id} and ${to.id}.`,
        );
    }
    if (
      dynamic.kind === 'partners' &&
      !(isAdult(from.age) && isAdult(to.age)) &&
      !(from.age === 'teen' && to.age === 'teen')
    )
      errors.push(
        'Partners must both be adults or both teens (non-sexual teen romance only).',
      );
    const familial = [...kinds].some(
      (kind) =>
        isParentTie(kind as HouseholdDynamic['kind']) || kind === 'siblings',
    );
    if (
      (familial && kinds.has('partners')) ||
      [...kinds].filter((kind) => isParentTie(kind as HouseholdDynamic['kind']))
        .length > 1 ||
      (familial &&
        kinds.has('siblings') &&
        [...kinds].some((kind) =>
          isParentTie(kind as HouseholdDynamic['kind']),
        ))
    )
      errors.push(
        'Contradictory family or romantic assignments for the same members.',
      );
  }
  // Validate directed ancestry transitively: no cycles or romance between ancestors.
  const reaches = (
    from: string,
    to: string,
    seen = new Set<string>(),
  ): boolean => {
    if (seen.has(from)) return false;
    seen.add(from);
    return parentEdges.some(
      (edge) =>
        edge.fromId === from &&
        (edge.toId === to || reaches(edge.toId, to, seen)),
    );
  };
  if (members.some((member) => reaches(member.id, member.id)))
    errors.push('Parent relationships cannot form a cycle.');
  if (
    members.some(
      (member) =>
        parentEdges.filter(
          (edge) =>
            edge.toId === member.id && edge.kind === 'biological-parent',
        ).length > 2,
    )
  )
    errors.push('A member cannot have more than two biological parents.');
  if (
    household.dynamics.some(
      (edge) =>
        edge.kind === 'partners' &&
        (reaches(edge.fromId, edge.toId) || reaches(edge.toId, edge.fromId)),
    )
  )
    errors.push('Romantic partners cannot be ancestors or descendants.');
  if (
    household.dynamics.some(
      (edge) =>
        edge.kind === 'partners' &&
        members.some(
          (ancestor) =>
            reaches(ancestor.id, edge.fromId) &&
            reaches(ancestor.id, edge.toId),
        ),
    )
  )
    errors.push('Romantic partners cannot share a known ancestor.');
  const parentCount = new Set(parentEdges.map((edge) => edge.fromId)).size;
  switch (household.category) {
    case 'singles':
      if (members.length !== 1)
        errors.push('Singles require exactly one member.');
      break;
    case 'couples':
      if (
        members.length !== 2 ||
        !household.dynamics.some((edge) => edge.kind === 'partners')
      )
        errors.push('Couples need two compatible partners.');
      break;
    case 'families':
      if (!parentEdges.length)
        errors.push('Families need at least one parent-child tie.');
      break;
    case 'single-parents':
      if (parentCount !== 1 || !parentEdges.length)
        errors.push(
          'Single-parent households need exactly one resident parent.',
        );
      break;
    case 'blended-families':
      if (
        !parentEdges.some((edge) => edge.kind === 'step-parent') ||
        !parentEdges.some((edge) => edge.kind !== 'step-parent')
      )
        errors.push(
          'Blended families need a stepfamily tie and a biological or adoptive tie.',
        );
      break;
    case 'roommates':
      if (
        members.length < 2 ||
        members.some((member) => !isAdult(member.age)) ||
        !household.dynamics.some((edge) => edge.kind === 'roommates')
      )
        errors.push('Roommates need at least two adults and a roommate tie.');
      break;
    case 'multigenerational':
      if (
        !parentEdges.some((first) =>
          parentEdges.some((second) => first.toId === second.fromId),
        )
      )
        errors.push(
          'Multigenerational households need a chain of three generations.',
        );
      break;
    case 'elders':
      if (members.some((member) => member.age !== 'elder'))
        errors.push('Elder households contain only elders.');
      break;
    case 'occult':
      if (!members.some((member) => member.occult !== 'human'))
        errors.push('Occult households need an occult member.');
      break;
    case 'adult-only':
      if (!household.adultOnly)
        errors.push('Adult-only category requires adult-only classification.');
      break;
    default:
      errors.push('Unknown household category.');
  }
  if (prompt) {
    const data = validateEntries([prompt]);
    if (!data.success) return data;
    errors.push(
      ...eligibilityReasons(
        prompt,
        preferences,
        members.map((member) => member.age),
      ),
    );
    if (
      household.promptId !== prompt.id ||
      household.category !== prompt.category ||
      household.adultOnly !== prompt.adultOnly
    )
      errors.push('Household metadata must agree with its prompt.');
    if (
      members.length < prompt.minimumMembers ||
      members.length > prompt.maximumMembers
    )
      errors.push('Household size does not satisfy the prompt.');
    if (
      members.length !== prompt.memberSlots.length ||
      new Set(members.map((member) => member.slotId)).size !== members.length ||
      members.some(
        (member) =>
          !prompt.memberSlots.some(
            (slot) =>
              slot.id === member.slotId &&
              slot.allowedAges.includes(member.age) &&
              slot.occult === member.occult &&
              JSON.stringify(slot.requiredPacks) ===
                JSON.stringify(member.requiredPacks),
          ),
      )
    )
      errors.push('Household does not satisfy the member slots.');
    for (const requirement of prompt.ageRequirements) {
      const count = members.filter((member) =>
        requirement.ages.includes(member.age),
      ).length;
      if (count < requirement.minimum || count > requirement.maximum)
        errors.push('Conflicting age requirements.');
    }
    if (
      household.dynamics.length !== prompt.dynamics.length ||
      prompt.dynamics.some(
        (template) =>
          !household.dynamics.some(
            (dynamic) =>
              dynamic.kind === template.kind &&
              members.find((member) => member.id === dynamic.fromId)?.slotId ===
                template.fromSlotId &&
              members.find((member) => member.id === dynamic.toId)?.slotId ===
                template.toSlotId,
          ),
      )
    )
      errors.push('Household does not satisfy the prompt relationships.');
  }
  if (errors.length)
    return failure(
      'INVALID_HOUSEHOLD',
      'This household cannot satisfy the current composition and filters.',
      [...new Set(errors)],
    );
  return validateStorylines(household.storylines, members, preferences);
}

export function composeHousehold(
  prompt: HouseholdPrompt,
  preferences: GeneratorPreferences,
  random: RandomSource,
): EngineResult<Household> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const data = validateEntries([prompt]);
  if (!data.success) return data;
  const count = prompt.memberSlots.length;
  if (
    !Number.isInteger(prompt.minimumMembers) ||
    !Number.isInteger(prompt.maximumMembers) ||
    prompt.minimumMembers < 1 ||
    prompt.maximumMembers > 8 ||
    prompt.minimumMembers > prompt.maximumMembers ||
    count < prompt.minimumMembers ||
    count > prompt.maximumMembers ||
    count > preferences.maximumHouseholdSize ||
    new Set(prompt.memberSlots.map((slot) => slot.id)).size !== count ||
    prompt.memberSlots.some((slot) => !slot.id.trim()) ||
    prompt.ageRequirements.some(
      (rule) =>
        !rule.ages.length ||
        rule.ages.some((age) => !LIFE_STAGES.includes(age)) ||
        !Number.isInteger(rule.minimum) ||
        !Number.isInteger(rule.maximum) ||
        rule.minimum < 0 ||
        rule.maximum > count ||
        rule.minimum > rule.maximum,
    )
  )
    return failure(
      'INVALID_HOUSEHOLD',
      'Prompt size, slot IDs, or age requirements are invalid or exceed the household limit.',
      [prompt.id],
    );
  if (
    new Set(prompt.dynamics.map((dynamic) => dynamic.id)).size !==
      prompt.dynamics.length ||
    prompt.dynamics.some(
      (dynamic) =>
        !dynamic.id.trim() ||
        dynamic.fromSlotId === dynamic.toSlotId ||
        !prompt.memberSlots.some((slot) => slot.id === dynamic.fromSlotId) ||
        !prompt.memberSlots.some((slot) => slot.id === dynamic.toSlotId),
    )
  )
    return failure(
      'INVALID_HOUSEHOLD',
      'Prompt relationships need unique IDs and two different existing slots.',
      [prompt.id],
    );
  const contentReasons = eligibilityReasons(
    prompt,
    preferences,
    prompt.adultOnly || prompt.themes.includes('adult-romance')
      ? ['adult']
      : [],
  ).filter((reason) => reason !== 'A participant age is incompatible.');
  if (contentReasons.length)
    return failure(
      'CONTENT_RESTRICTED',
      'This household prompt is disabled by content or pack filters.',
      contentReasons,
    );
  const options: LifeStage[][] = [];
  for (const slot of prompt.memberSlots) {
    const ages = slot.allowedAges.filter(
      (age) =>
        LIFE_STAGES.includes(age) &&
        preferences.allowedAges.includes(age) &&
        (!prompt.allowedAges || prompt.allowedAges.includes(age)) &&
        (!(prompt.adultOnly || prompt.themes.includes('adult-romance')) ||
          isAdult(age)),
    );
    if (!ages.length || !hasPacks(slot.requiredPacks, preferences.ownedPacks))
      return failure(
        'INCOMPATIBLE_AGE',
        'A member slot has no compatible age or needs a disabled pack.',
        [prompt.id, slot.id],
      );
    const order = shuffled([...new Set(ages)], random);
    if (!order.success) return order;
    options.push(order.value);
  }
  const household: Household = {
    id: `household:${prompt.id}`,
    promptId: prompt.id,
    category: prompt.category,
    members: prompt.memberSlots.map((slot) => ({
      id: `member:${prompt.id}:${slot.id}`,
      slotId: slot.id,
      name: slot.name,
      age: options[0][0],
      occult: slot.occult,
      requiredPacks: [...slot.requiredPacks],
    })),
    dynamics: prompt.dynamics.map((dynamic) => ({
      id: `dynamic:${prompt.id}:${dynamic.id}`,
      fromId: `member:${prompt.id}:${dynamic.fromSlotId}`,
      toId: `member:${prompt.id}:${dynamic.toSlotId}`,
      kind: dynamic.kind,
    })),
    financialSituation: prompt.financialSituation,
    livingArrangement: prompt.livingArrangement,
    backstory: prompt.backstory,
    adultOnly: prompt.adultOnly,
    storylines: [],
  };
  // At most eight slots. Prune incompatible parent/partner edges before recursing.
  const solve = (index: number): boolean => {
    if (index === count)
      return validateHousehold(household, preferences, prompt).success;
    for (const age of options[index]) {
      household.members[index].age = age;
      const assigned = household.members.slice(0, index + 1);
      const compatible = household.dynamics.every((edge) => {
        const from = assigned.find((member) => member.id === edge.fromId);
        const to = assigned.find((member) => member.id === edge.toId);
        if (!from || !to) return true;
        if (isParentTie(edge.kind))
          return parentChildCompatible(from.age, to.age, edge.kind);
        return (
          edge.kind !== 'partners' ||
          (isAdult(from.age) && isAdult(to.age)) ||
          (from.age === 'teen' && to.age === 'teen')
        );
      });
      const countsPossible = prompt.ageRequirements.every((rule) => {
        const present = assigned.filter((member) =>
          rule.ages.includes(member.age),
        ).length;
        const possible = options
          .slice(index + 1)
          .filter((ages) =>
            ages.some((candidate) => rule.ages.includes(candidate)),
          ).length;
        const unavoidable = options
          .slice(index + 1)
          .filter((ages) =>
            ages.every((candidate) => rule.ages.includes(candidate)),
          ).length;
        return (
          present + possible >= rule.minimum &&
          present + unavoidable <= rule.maximum
        );
      });
      if (compatible && countsPossible && solve(index + 1)) return true;
    }
    return false;
  };
  return solve(0)
    ? success(household)
    : failure(
        'INVALID_HOUSEHOLD',
        'No compatible composition exists for this prompt. Broaden age or pack filters, increase the size limit, or fix contradictory requirements.',
        [prompt.id],
      );
}

export function generateHousehold(
  prompts: readonly HouseholdPrompt[],
  preferences: GeneratorPreferences,
  random: RandomSource,
): EngineResult<Household> {
  const config = validatePreferences(preferences);
  if (!config.success) return config;
  const valid = validateEntries(prompts);
  if (!valid.success) return valid;
  const candidates: { prompt: HouseholdPrompt; household: Household }[] = [];
  const reasons: string[] = [];
  for (const prompt of prompts) {
    const result = composeHousehold(prompt, preferences, random);
    if (result.success) candidates.push({ prompt, household: result.value });
    else reasons.push(`${prompt.id}: ${result.error.message}`);
  }
  const result = weightedSelect(
    candidates,
    (candidate) => modeWeight(candidate.prompt, preferences),
    random,
  );
  if (!result.success && result.error.code === 'EMPTY_POOL')
    return failure(
      'EMPTY_POOL',
      'No household prompt fits the current filters.',
      reasons,
    );
  return result.success ? success(result.value.household) : result;
}
