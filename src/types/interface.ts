import type {
  Aesthetic,
  GeneratorPreferences,
  Household,
  HouseholdCategory,
  IndividualSim,
  Lot,
  Neighborhood,
  Storyline,
  World,
} from './models';
import type { RandomSource } from './engine';
export interface RollContext {
  seed: string;
  iteration: number;
  random: (field: string) => RandomSource;
}
export interface SharedSettings {
  version: 1;
  preferences: GeneratorPreferences;
  minimumHouseholdSize: number;
  seed: string;
}
export interface HouseholdFilters {
  categories: HouseholdCategory[];
  finance: string;
  living: string;
}
export interface HouseholdConcept {
  world: World;
  neighborhood?: Neighborhood;
  lot?: Lot;
  household: Household;
  sims: IndividualSim[];
  aesthetic: Aesthetic;
  twist?: Storyline;
  seed: string;
  iteration: number;
}
