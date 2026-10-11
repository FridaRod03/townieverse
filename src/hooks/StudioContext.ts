import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { HouseholdConcept, SharedSettings } from '../types/interface';
import type { ContentCatalog, Lot, IndividualSim } from '../types/models';
export interface StudioState {
  session: Record<string, unknown>;
  setSession: Dispatch<SetStateAction<Record<string, unknown>>>;
  settings: SharedSettings;
  setSettings: Dispatch<SetStateAction<SharedSettings>>;
  catalog: ContentCatalog;
  customLots: Lot[];
  addLot: (lot: Lot) => void;
  concept: HouseholdConcept | null;
  setConcept: Dispatch<SetStateAction<HouseholdConcept | null>>;
  individual: IndividualSim | null;
  setIndividual: Dispatch<SetStateAction<IndividualSim | null>>;
  notice: string;
}
export const StudioContext = createContext<StudioState | null>(null);
export function useStudio(): StudioState {
  const state = useContext(StudioContext);
  if (!state) throw new Error('StudioProvider is required.');
  return state;
}
