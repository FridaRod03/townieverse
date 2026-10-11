export const ENTRY_TYPES = [
  'household',
  'sim',
  'aesthetic',
  'relationship',
  'storyline',
  'world',
] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];
export const PROGRESS = [
  'Idea',
  'Planning',
  'Creating in CAS',
  'Created in CAS',
  'Placed in World',
  'Playing',
] as const;
export type Progress = (typeof PROGRESS)[number];
export interface SavedContent {
  /** Independent JSON snapshot; never regenerated from library IDs. */
  snapshot: Record<string, unknown>;
  text: string;
  members: { id: string; name: string }[];
}
export interface CastingEntry {
  id: string;
  type: EntryType;
  title: string;
  content: SavedContent;
  createdAt: string;
  modifiedAt: string;
  notes: string;
  tags: string[];
  world: string;
  status: Progress;
  memberProgress: Record<string, Progress>;
  favorite: boolean;
}
export interface CastingBoardData {
  schemaVersion: 1;
  entries: CastingEntry[];
}
export interface CastingExport extends CastingBoardData {
  format: 'townieverse-casting-board';
  exportedAt: string;
}
