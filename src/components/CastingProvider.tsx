import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CastingContext } from '../hooks/CastingContext';
import {
  BOARD_KEY,
  LEGACY_BOARD_KEY,
  clone,
  mergeBoards,
  newEntry,
  parseBoard,
  readBoard,
  sameContent,
  validateEntry,
} from '../utils/casting';
import type { CastingBoardData } from '../types/casting';

export function CastingProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => {
    try {
      return readBoard(localStorage);
    } catch {
      return {
        board: { schemaVersion: 1, entries: [] } as CastingBoardData,
        raw: null,
        blocked: true,
        notice:
          'Browser storage is unavailable. No saved data has been overwritten.',
      };
    }
  });
  const [board, setBoard] = useState(loaded.board);
  const current = useRef(board);
  const expectedRaw = useRef(loaded.raw);
  const [blocked, setBlocked] = useState(loaded.blocked);
  const [notice, setNotice] = useState(loaded.notice);
  const [recoveryRaw, setRecoveryRaw] = useState(
    loaded.blocked ? loaded.raw : null,
  );
  const commit = (
    next: CastingBoardData,
    success: string,
    recovery = false,
  ): boolean => {
    if (blocked && !recovery) {
      setNotice(
        'Recover the unreadable saved data before changing the board. Export the original raw data first.',
      );
      return false;
    }
    try {
      const actual =
        localStorage.getItem(BOARD_KEY) ??
        localStorage.getItem(LEGACY_BOARD_KEY);
      if (actual !== expectedRaw.current) {
        setNotice(
          'The saved board changed in another tab. Reload this page before editing to avoid overwriting those changes.',
        );
        return false;
      }
      parseBoard(JSON.stringify(next));
      const raw = JSON.stringify(next);
      localStorage.setItem(BOARD_KEY, raw);
      expectedRaw.current = raw;
      current.current = next;
      setBoard(next);
      setBlocked(false);
      setRecoveryRaw(null);
      setNotice(success);
      return true;
    } catch (error) {
      setNotice(
        `The change was not saved. ${typeof error === 'object' && error !== null && 'name' in error && error.name === 'QuotaExceededError' ? 'Browser storage is full. Export a backup, then free space or remove entries.' : 'Storage is unavailable or the data is invalid.'} Your previous board is unchanged.`,
      );
      return false;
    }
  };
  return (
    <CastingContext.Provider
      value={{
        board,
        notice,
        blocked,
        recoveryRaw,
        save: (type, title, content, world = '', favorite = false) => {
          const existing = current.current.entries.find((e) =>
            sameContent(e, type, content),
          );
          if (existing) {
            if (favorite !== existing.favorite && favorite)
              return commit(
                {
                  ...current.current,
                  entries: current.current.entries.map((e) =>
                    e.id === existing.id
                      ? {
                          ...e,
                          favorite: true,
                          modifiedAt: new Date().toISOString(),
                        }
                      : e,
                  ),
                },
                'Saved and favorited.',
              );
            setNotice('This exact result is already on your Casting Board.');
            return !blocked;
          }
          try {
            return commit(
              {
                ...current.current,
                entries: [
                  ...current.current.entries,
                  newEntry(type, title, content, world, favorite),
                ],
              },
              'Saved to Casting Board.',
            );
          } catch {
            setNotice(
              'This generated result could not be saved. The existing board is unchanged.',
            );
            return false;
          }
        },
        update: (id, patch) => {
          const entry = current.current.entries.find((e) => e.id === id);
          if (!entry) return false;
          const edited = {
            ...entry,
            ...clone(patch),
            modifiedAt: new Date().toISOString(),
          };
          if (!validateEntry(edited)) {
            setNotice(
              'Check your metadata: title is required, tags must be unique and limited to 30 tags of 40 characters.',
            );
            return false;
          }
          return commit(
            {
              ...current.current,
              entries: current.current.entries.map((e) =>
                e.id === id ? edited : e,
              ),
            },
            'Saved entry updated.',
          );
        },
        duplicate: (id) => {
          const entry = current.current.entries.find((e) => e.id === id);
          if (!entry) return false;
          const now = new Date().toISOString();
          return commit(
            {
              ...current.current,
              entries: [
                ...current.current.entries,
                {
                  ...clone(entry),
                  id: crypto.randomUUID(),
                  title: `${entry.title} · alternate`.slice(0, 120),
                  createdAt: now,
                  modifiedAt: now,
                },
              ],
            },
            'Alternate version created.',
          );
        },
        remove: (id) =>
          commit(
            {
              ...current.current,
              entries: current.current.entries.filter((e) => e.id !== id),
            },
            'Entry removed.',
          ),
        importBoard: (incoming, mode, confirmed) => {
          if (mode === 'replace' && !confirmed) {
            setNotice('Confirm replacement before importing.');
            return false;
          }
          try {
            const validated = parseBoard(JSON.stringify(incoming));
            if (blocked && mode !== 'replace') {
              setNotice(
                'Recover unreadable data with a confirmed replacement after exporting the raw value.',
              );
              return false;
            }
            return commit(
              mode === 'merge'
                ? mergeBoards(current.current, validated)
                : validated,
              mode === 'merge'
                ? 'Backup merged. Exact ID duplicates were skipped; conflicting IDs were preserved as new entries.'
                : 'Casting Board replaced with the validated backup.',
              mode === 'replace' && confirmed,
            );
          } catch (error) {
            setNotice(
              error instanceof Error
                ? error.message
                : 'Import failed. Existing data is unchanged.',
            );
            return false;
          }
        },
        recoverEmpty: (confirmed) =>
          confirmed
            ? commit(
                { schemaVersion: 1, entries: [] },
                'A new empty board is ready.',
                true,
              )
            : false,
      }}
    >
      {children}
      <div className="board-feedback" role="status" aria-live="polite">
        {notice}
      </div>
    </CastingContext.Provider>
  );
}
