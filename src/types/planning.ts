import type { CastingEntry } from './casting';
import type { RelationshipWeb } from './web';
export interface PlannedLot {
  id: string;
  name: string;
  worldId: string;
  neighborhoodId: string;
  lotType: string;
  description: string;
  size?: { width: number; height: number };
}
export interface HouseholdAssignment {
  householdId: string;
  /** Recovery snapshot; live Casting Board metadata takes precedence. */
  household: CastingEntry;
  worldId: string;
  neighborhoodId: string;
  lotId: string;
  arrangement: string;
  notes: string;
  placed: boolean;
}
export interface SaveProfile {
  /** Optional for Phase 8 backups; absent means an empty relationship web. */
  relationshipWeb?: RelationshipWeb;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  assignments: HouseholdAssignment[];
  customLots: PlannedLot[];
  worldNotes: Record<string, string>;
  neighborhoodNotes: Record<string, string>;
}
export interface PlanningData {
  schemaVersion: 1;
  selectedProfileId: string;
  profiles: SaveProfile[];
}
