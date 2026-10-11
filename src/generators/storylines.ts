import type {
  ContentEntry,
  GeneratorPreferences,
  LifeStage,
  Storyline,
} from '../types/models';
import type { EngineResult, RandomSource } from '../types/engine';
import { failure, success } from '../types/engine';
import { weightedSelect } from '../utils/random';
import { eligibleEntries, modeWeight } from './eligibility';
import { validateStorylines } from './households';

/** Explicit participants prevent a private adult storyline from including other household members. */
export function generateStoryline(
  prompts: readonly ContentEntry[],
  participants: readonly { id: string; age: LifeStage }[],
  preferences: GeneratorPreferences,
  random: RandomSource,
): EngineResult<Storyline> {
  if (
    !participants.length ||
    participants.some((participant) => !participant.id.trim()) ||
    new Set(participants.map((participant) => participant.id)).size !==
      participants.length
  )
    return failure(
      'INVALID_CONFIG',
      'Choose one or more distinct, identified storyline participants.',
    );
  const eligible = eligibleEntries(
    prompts,
    preferences,
    participants.map((participant) => participant.age),
  );
  if (!eligible.success) return eligible;
  const selected = weightedSelect(
    eligible.value,
    (entry) => modeWeight(entry, preferences),
    random,
  );
  if (!selected.success) return selected;
  const story: Storyline = {
    ...selected.value,
    participantIds: participants.map((participant) => participant.id),
  };
  const valid = validateStorylines([story], participants, preferences);
  return valid.success ? success(story) : valid;
}
