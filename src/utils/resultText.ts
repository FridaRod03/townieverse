import type { HouseholdConcept } from '../types/interface';
import type { Aesthetic, IndividualSim } from '../types/models';
export const ageLabel = (age: string) =>
  age
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
export function simText(sim: IndividualSim): string {
  return [
    `${sim.name} · ${ageLabel(sim.age)} (authored character concept)`,
    `Traits: ${sim.personality.traits.map((trait) => `${trait.name} (${trait.origin})`).join(', ')}`,
    `Aspiration: ${sim.aspiration.name} (${sim.aspiration.origin})`,
    `Occupation: ${sim.career.name} (${sim.career.origin})`,
    `Personality: ${sim.personality.profile.description}`,
    `Hobbies: ${sim.personality.hobbies.join(', ')}`,
    `Likes: ${sim.personality.likes.join(', ')}`,
    `Dislikes: ${sim.personality.dislikes.join(', ')}`,
    `Goal: ${sim.personality.personalGoal}`,
    `Flaw: ${sim.personality.flaw}`,
  ].join('\n');
}
export const aestheticText = (style: Aesthetic) =>
  [
    style.name,
    `${style.category} · authored styling guide`,
    style.description,
    ...style.casSuggestions.map((tip) => `• ${tip}`),
    ...(style.hairSuggestions ?? []).map((tip) => `Hair: ${tip}`),
    ...(style.makeupSuggestions ?? []).map((tip) => `Optional makeup: ${tip}`),
    ...(style.accessories ?? []).map((tip) => `Accessory: ${tip}`),
    ...(style.culturalContext ? [style.culturalContext] : []),
  ].join('\n');
export function conceptText(concept: HouseholdConcept): string {
  const names = new Map(
    concept.household.members.map((member) => [member.id, member.name]),
  );
  return [
    concept.household.promptId.startsWith('starter:')
      ? 'Townieverse · starter / roleplay concept'
      : 'Townieverse · authored household concept (roleplay)',
    `Seed: ${concept.seed} · Roll ${concept.iteration + 1}`,
    `World: ${concept.world.name} (${concept.world.origin === 'official' ? 'official game world' : 'fictional save concept'})`,
    `Neighborhood: ${concept.neighborhood?.name ?? 'No neighborhood data available'}`,
    `Lot: ${concept.lot?.name ?? 'No verified or custom lot selected'}`,
    `${ageLabel(concept.household.category)} · ${concept.household.members.length} Sims`,
    `Finances: ${concept.household.financialSituation}`,
    `Home: ${concept.household.livingArrangement}`,
    concept.household.backstory,
    ...concept.sims.map(simText),
    ...concept.household.dynamics.map(
      (dynamic) =>
        `${names.get(dynamic.fromId) ?? 'Member'} → ${names.get(dynamic.toId) ?? 'Member'}: ${ageLabel(dynamic.kind)}`,
    ),
    aestheticText(concept.aesthetic),
    ...(concept.twist
      ? [
          `Private storyline for ${concept.twist.participantIds.map((id) => names.get(id) ?? 'Adult').join(', ')}: ${concept.twist.description}`,
        ]
      : []),
  ].join('\n\n');
}
