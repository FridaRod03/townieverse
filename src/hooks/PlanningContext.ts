import { createContext, useContext } from 'react';
import type { PlanningData, SaveProfile } from '../types/planning';
export interface PlanningState {
  data: PlanningData;
  notice: string;
  blocked: boolean;
  stale: boolean;
  recoveryRaw: string | null;
  commit: (next: PlanningData, message: string, recovery?: boolean) => boolean;
  updateProfile: (profile: SaveProfile) => boolean;
  importPlans: (
    incoming: PlanningData,
    mode: 'merge' | 'replace',
    confirmed?: boolean,
  ) => boolean;
}
export const PlanningContext = createContext<PlanningState | null>(null);
export function usePlanning() {
  const state = useContext(PlanningContext);
  if (!state) throw new Error('PlanningProvider is required.');
  return state;
}
