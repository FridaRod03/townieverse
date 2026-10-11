import { useEffect, useRef, useState } from 'react';
import { useCasting } from '../hooks/CastingContext';
import { useStudio } from '../hooks/StudioContext';
import { ENTRY_TYPES, PROGRESS } from '../types/casting';
import type {
  CastingBoardData,
  CastingEntry,
  Progress,
} from '../types/casting';
import {
  download,
  exportJson,
  exportText,
  MAX_IMPORT_BYTES,
  normalizeTags,
  parseBoard,
  selectEntries,
} from '../utils/casting';
import type { BoardFilters } from '../utils/casting';
import { Confirmation } from './Confirmation';
import { AssignToWorld } from './planning/AssignToWorld';
import { HouseholdWebLink } from './web/HouseholdWebLink';
import '../styles/casting.css';

function EntryCard({
  entry,
  onDelete,
}: {
  entry: CastingEntry;
  onDelete: () => void;
}) {
  const { update, duplicate, blocked } = useCasting();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry);
  const [tags, setTags] = useState(entry.tags.join(', '));
  const [validation, setValidation] = useState('');
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) titleInput.current?.focus();
  }, [editing]);
  const begin = () => {
    setDraft(entry);
    setTags(entry.tags.join(', '));
    setValidation('');
    setEditing(true);
  };
  const exportOne = (extension: 'json' | 'txt') =>
    download(
      extension === 'json' ? exportJson([entry]) : exportText([entry]),
      `entry-${entry.id}`,
      extension,
    );
  return (
    <article className="casting-card">
      <div className="result-heading">
        <span className="eyebrow">{entry.type}</span>
        <button
          className="text-button"
          disabled={blocked}
          aria-label={`${entry.favorite ? 'Unfavorite' : 'Favorite'} ${entry.title}`}
          aria-pressed={entry.favorite}
          onClick={() => update(entry.id, { favorite: !entry.favorite })}
        >
          <span aria-hidden="true">{entry.favorite ? '♥' : '♡'}</span>{' '}
          {entry.favorite ? 'Favorited' : 'Favorite'}
        </button>
      </div>
      <h2>{entry.title}</h2>
      <p className="status-badge">{entry.status}</p>
      <p className="helper-text">
        {entry.world ? `World: ${entry.world}` : 'No world association'} · Saved{' '}
        {new Date(entry.createdAt).toLocaleDateString()}
      </p>
      {!!entry.tags.length && (
        <ul className="tag-list" aria-label="Tags">
          {entry.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      )}
      {entry.notes && <p className="saved-notes">{entry.notes}</p>}
      {entry.content.members.length > 0 && (
        <ul className="member-statuses" aria-label="Individual Sim progress">
          {entry.content.members.map((member, index) => (
            <li key={member.id}>
              <strong>
                Sim {index + 1} · {member.name}
              </strong>
              <span>{entry.memberProgress[member.id]}</span>
            </li>
          ))}
        </ul>
      )}
      <details>
        <summary>Original generated content</summary>
        <pre className="saved-content">{entry.content.text}</pre>
      </details>
      {entry.type === 'household' && <AssignToWorld entry={entry} />}
      {entry.type === 'household' && (
        <HouseholdWebLink householdId={entry.id} />
      )}
      <div className="inline-actions card-actions">
        <button className="secondary-button" disabled={blocked} onClick={begin}>
          Edit entry
        </button>
        <button
          className="text-button"
          disabled={blocked}
          onClick={() => duplicate(entry.id)}
        >
          Duplicate
        </button>
        <button className="text-button" onClick={() => exportOne('json')}>
          Export JSON
        </button>
        <button className="text-button" onClick={() => exportOne('txt')}>
          Export TXT
        </button>
        <button
          className="text-button danger-button"
          disabled={blocked}
          onClick={onDelete}
        >
          Delete entry
        </button>
      </div>
      {editing && (
        <form
          className="entry-editor"
          onSubmit={(event) => {
            event.preventDefault();
            const parsedTags = normalizeTags(tags);
            if (
              !draft.title.trim() ||
              parsedTags.length > 30 ||
              parsedTags.some((t) => t.length > 40)
            ) {
              setValidation(
                'Enter a title and at most 30 tags, each up to 40 characters.',
              );
              return;
            }
            if (
              update(entry.id, {
                title: draft.title.trim(),
                notes: draft.notes,
                tags: parsedTags,
                status: draft.status,
                memberProgress: draft.memberProgress,
                world: draft.world.trim(),
              })
            )
              setEditing(false);
          }}
        >
          <h3>Edit saved metadata</h3>
          <p className="helper-text">
            Original generated content stays unchanged. Progress is always set
            manually.
          </p>
          <label>
            Title
            <input
              ref={titleInput}
              required
              maxLength={120}
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />
          </label>
          <label>
            Notes
            <textarea
              maxLength={10000}
              rows={4}
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
            />
          </label>
          <label>
            Tags (comma-separated)
            <input
              maxLength={1500}
              value={tags}
              placeholder="AltTownies, Windenburg"
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
          <label>
            World association
            <input
              maxLength={120}
              list="casting-world-options"
              value={draft.world}
              onChange={(event) =>
                setDraft({ ...draft, world: event.target.value })
              }
            />
          </label>
          <label>
            Progress status
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as Progress })
              }
            >
              {PROGRESS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {!!draft.content.members.length && (
            <fieldset>
              <legend>Individual Sim progress</legend>
              {draft.content.members.map((member, index) => (
                <label key={member.id}>
                  Sim {index + 1} · {member.name} status
                  <select
                    value={draft.memberProgress[member.id]}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        memberProgress: {
                          ...draft.memberProgress,
                          [member.id]: event.target.value as Progress,
                        },
                      })
                    }
                  >
                    {PROGRESS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              ))}
            </fieldset>
          )}
          {validation && <p role="alert">{validation}</p>}
          <div className="inline-actions">
            <button className="secondary-button" type="submit">
              Save changes
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancel editing
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
export function CastingBoard() {
  const { board, blocked, recoveryRaw, importBoard, remove, recoverEmpty } =
    useCasting();
  const { catalog } = useStudio();
  const [filters, setFilters] = useState<BoardFilters>({
    search: '',
    type: '',
    world: '',
    status: '',
    favorites: false,
    tag: '',
    sort: 'newest',
  });
  const [incoming, setIncoming] = useState<CastingBoardData | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importMessage, setImportMessage] = useState('');
  const importRequest = useRef(0);
  const [pending, setPending] = useState<{
    kind: 'delete' | 'replace' | 'recover';
    id?: string;
  } | null>(null);
  const visible = selectEntries(board.entries, filters);
  const worlds = [
    ...new Set([
      ...catalog.worlds.map((w) => w.name),
      ...board.entries.map((e) => e.world).filter(Boolean),
    ]),
  ].sort();
  const duplicateCount =
    incoming?.entries.filter((entry) =>
      board.entries.some((existing) => existing.id === entry.id),
    ).length ?? 0;
  const backup = (extension: 'json' | 'txt') =>
    download(
      extension === 'json'
        ? exportJson(board.entries)
        : exportText(board.entries),
      'casting-board',
      extension,
    );
  const performImport = (confirmed = false) => {
    if (!incoming) return;
    if (importMode === 'replace' && !confirmed) {
      setPending({ kind: 'replace' });
      return;
    }
    if (importBoard(incoming, importMode, confirmed)) {
      setIncoming(null);
      setImportMessage('Import completed.');
    }
  };
  return (
    <section
      className="generator-page casting-page"
      aria-labelledby="page-title"
    >
      <p className="eyebrow">YOUR STORIES, COLLECTED</p>
      <h1 id="page-title" tabIndex={-1}>
        Casting Board
      </h1>
      <p>
        A scrapbook for your next save. Keep the idea, track the creation, make
        it yours.
      </p>
      <div className="backup-banner">
        <p>
          <strong>
            Your creations are saved in this browser. Export a backup to keep
            them safe.
          </strong>
        </p>
        <p>
          Saving is specific to this browser and website origin. Content is not
          automatically synchronized between devices. JSON backups can restore
          your collection; TXT is for reading.
        </p>
        <div className="inline-actions">
          <button
            className="secondary-button"
            disabled={blocked}
            onClick={() => backup('json')}
          >
            Export Backup
          </button>
          <button
            className="text-button"
            disabled={blocked}
            onClick={() => backup('txt')}
          >
            Export board as TXT
          </button>
        </div>
      </div>
      {blocked && (
        <div className="recovery-panel" role="alert">
          <h2>Saved data needs recovery</h2>
          <p>
            The original storage has been preserved. Export its raw value before
            starting a new board or replacing it with a valid backup. No
            automatic repair or deletion has occurred.
          </p>
          {recoveryRaw !== null && (
            <button
              className="secondary-button"
              onClick={() => download(recoveryRaw, 'raw-recovery', 'txt')}
            >
              Export raw recovery data
            </button>
          )}
          <button
            className="text-button danger-button"
            onClick={() => setPending({ kind: 'recover' })}
          >
            Start a new empty board
          </button>
        </div>
      )}
      <details className="advanced-settings import-panel">
        <summary>Import JSON backup</summary>
        <div className="settings-body">
          <label>
            Backup JSON file
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                const request = ++importRequest.current;
                setIncoming(null);
                setImportMessage('');
                event.target.value = '';
                if (!file) return;
                try {
                  if (file.size > MAX_IMPORT_BYTES)
                    throw new Error(
                      'This file exceeds the 10 MB import limit.',
                    );
                  const parsed = parseBoard(await file.text());
                  if (request !== importRequest.current) return;
                  setIncoming(parsed);
                  setImportMessage(
                    'Validated successfully. Review the preview before importing.',
                  );
                } catch (error) {
                  if (request !== importRequest.current) return;
                  setImportMessage(
                    error instanceof Error
                      ? error.message
                      : 'Could not read this file. The existing board is unchanged.',
                  );
                }
              }}
            />
          </label>
          <p role="status">{importMessage}</p>
          {incoming && (
            <div className="import-preview">
              <h2>Import preview</h2>
              <p>
                {incoming.entries.length} entries · {duplicateCount} potential
                duplicate IDs
              </p>
              <ul>
                {ENTRY_TYPES.map((type) => {
                  const count = incoming.entries.filter(
                    (e) => e.type === type,
                  ).length;
                  return count ? (
                    <li key={type}>
                      {type}: {count}
                    </li>
                  ) : null;
                })}
              </ul>
              <label>
                Import option
                <select
                  value={importMode}
                  onChange={(event) =>
                    setImportMode(event.target.value as 'merge' | 'replace')
                  }
                >
                  <option value="merge">Merge · keep existing entries</option>
                  <option value="replace">
                    Replace · overwrite the board after confirmation
                  </option>
                </select>
              </label>
              <p>
                {importMode === 'merge'
                  ? 'Existing entries stay unchanged. Exact ID duplicates are skipped; different entries with conflicting IDs receive new IDs.'
                  : 'All existing entries will be replaced. Export a backup first. Replacement requires a separate confirmation.'}
              </p>
              <button
                className="secondary-button"
                onClick={() => performImport()}
              >
                Import {importMode === 'merge' ? 'and merge' : 'and replace'}
              </button>
              <button className="text-button" onClick={() => setIncoming(null)}>
                Cancel import
              </button>
            </div>
          )}
        </div>
      </details>
      <div className="control-card board-filters">
        <div className="form-grid">
          <label>
            Search Casting Board
            <input
              type="search"
              maxLength={200}
              value={filters.search}
              onChange={(event) =>
                setFilters({ ...filters, search: event.target.value })
              }
            />
          </label>
          <label>
            Entry type
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters({ ...filters, type: event.target.value })
              }
            >
              <option value="">All entry types</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Filter by world
            <select
              value={filters.world}
              onChange={(event) =>
                setFilters({ ...filters, world: event.target.value })
              }
            >
              <option value="">All worlds</option>
              {worlds.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>
          <label>
            Filter by status
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters({ ...filters, status: event.target.value })
              }
            >
              <option value="">All statuses</option>
              {PROGRESS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Filter by tag
            <select
              value={filters.tag}
              onChange={(event) =>
                setFilters({ ...filters, tag: event.target.value })
              }
            >
              <option value="">All tags</option>
              {[...new Set(board.entries.flatMap((e) => e.tags))]
                .sort()
                .map((t) => (
                  <option key={t}>{t}</option>
                ))}
            </select>
          </label>
          <label>
            Sort entries
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  sort: event.target.value as BoardFilters['sort'],
                })
              }
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alphabetical">Alphabetically</option>
              <option value="modified">Last modified</option>
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.favorites}
            onChange={(event) =>
              setFilters({ ...filters, favorites: event.target.checked })
            }
          />
          Favorites only
        </label>
      </div>
      <datalist id="casting-world-options">
        {worlds.map((w) => (
          <option key={w} value={w} />
        ))}
      </datalist>
      <p role="status">
        {visible.length} of {board.entries.length} saved entries
      </p>
      {!board.entries.length && !blocked ? (
        <div className="board-empty">
          <h2>Your Casting Board is empty!</h2>
          <p>Generate a Sim or household to get started.</p>
          <a className="button primary" href="#/household">
            Create a Household
          </a>
          <a className="text-button" href="#/sim">
            Create a Sim
          </a>
        </div>
      ) : !visible.length && !blocked ? (
        <p>No entries match. Change your filters to see more creations.</p>
      ) : null}
      <div className="casting-grid">
        {visible.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onDelete={() => setPending({ kind: 'delete', id: entry.id })}
          />
        ))}
      </div>
      {pending && (
        <Confirmation
          title={
            pending.kind === 'delete'
              ? 'Delete saved entry?'
              : pending.kind === 'replace'
                ? 'Replace your Casting Board?'
                : 'Start a new empty board?'
          }
          description={
            pending.kind === 'delete'
              ? 'This removes the saved snapshot and its notes from this browser. Export the entry first if you want to keep a copy.'
              : pending.kind === 'replace'
                ? `The validated backup contains ${incoming?.entries.length ?? 0} entries. This will replace the current board, including notes and progress. Export a backup or raw recovery data before continuing.`
                : 'This replaces unreadable saved data with an empty board. Export raw recovery data before continuing; browser storage cannot undo this action.'
          }
          confirmLabel={
            pending.kind === 'delete'
              ? 'Confirm delete'
              : pending.kind === 'replace'
                ? 'Confirm replacement'
                : 'Confirm new empty board'
          }
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (pending.kind === 'delete') remove(pending.id!);
            else if (pending.kind === 'replace') performImport(true);
            else recoverEmpty(true);
            setPending(null);
          }}
        />
      )}
    </section>
  );
}
