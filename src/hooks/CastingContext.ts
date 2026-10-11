import { createContext, useContext } from 'react';
import type {
  CastingBoardData,
  CastingEntry,
  EntryType,
  SavedContent,
} from '../types/casting';
export interface CastingState {
  board: CastingBoardData;
  notice: string;
  blocked: boolean;
  recoveryRaw: string | null;
  save: (
    type: EntryType,
    title: string,
    content: SavedContent,
    world?: string,
    favorite?: boolean,
  ) => boolean;
  update: (
    id: string,
    patch: Partial<
      Omit<CastingEntry, 'id' | 'type' | 'content' | 'createdAt' | 'modifiedAt'>
    >,
  ) => boolean;
  duplicate: (id: string) => boolean;
  remove: (id: string) => boolean;
  importBoard: (
    board: CastingBoardData,
    mode: 'merge' | 'replace',
    confirmed: boolean,
  ) => boolean;
  recoverEmpty: (confirmed: boolean) => boolean;
}
export const CastingContext = createContext<CastingState | null>(null);
export function useCasting() {
  const context = useContext(CastingContext);
  if (!context) throw new Error('CastingProvider is required.');
  return context;
}
