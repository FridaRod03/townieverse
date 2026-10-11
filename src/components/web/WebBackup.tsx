import { useState } from 'react';
import { usePlanning } from '../../hooks/PlanningContext';
import { useCasting } from '../../hooks/CastingContext';
import {
  exportWeb,
  mergeWeb,
  parseWebBackup,
  reconcileWeb,
} from '../../utils/web';
import type { WebBackup as Backup } from '../../utils/web';
import { download, MAX_IMPORT_BYTES } from '../../utils/casting';
import { newProfile } from '../../utils/planning';
import { Confirmation } from '../Confirmation';
export function WebBackup() {
  const { data, commit, blocked, stale } = usePlanning(),
    { board } = useCasting();
  const [incoming, setIncoming] = useState<Backup | null>(null),
    [error, setError] = useState(''),
    [replace, setReplace] = useState(false);
  const apply = (mode: 'merge' | 'replace') => {
    if (!incoming) return;
    try {
      const profiles = [...data.profiles];
      for (const imported of incoming.profiles) {
        const index = profiles.findIndex((p) => p.id === imported.id);
        const original =
          index < 0
            ? { ...newProfile(imported.name), id: imported.id }
            : profiles[index];
        const web =
          mode === 'merge'
            ? mergeWeb(reconcileWeb(original, board.entries), imported.web)
            : imported.web;
        const next = {
          ...original,
          relationshipWeb: web,
          modifiedAt: new Date().toISOString(),
        };
        if (index < 0) profiles.push(next);
        else profiles[index] = next;
      }
      if (
        commit(
          {
            ...data,
            profiles,
            selectedProfileId: data.selectedProfileId || profiles[0]?.id || '',
          },
          'Relationship data imported.',
        )
      ) {
        setIncoming(null);
        setReplace(false);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Import failed. Existing data unchanged.',
      );
    }
  };
  return (
    <details className="web-panel">
      <summary>Relationship backups</summary>
      <p>
        Population profile exports also include relationship data. These
        web-only backups identify profiles by ID. Unknown profiles become empty
        planning profiles with preserved character history; households are not
        automatically assigned. Replacement affects only the webs named in this
        file.
      </p>
      <div className="web-toolbar">
        <button
          className="secondary-button"
          disabled={blocked || !data.selectedProfileId}
          onClick={() =>
            download(
              exportWeb(data.profiles, board.entries, data.selectedProfileId),
              'relationship-profile',
              'json',
            )
          }
        >
          Export selected relationship web
        </button>
        <button
          className="secondary-button"
          disabled={blocked || !data.profiles.length}
          onClick={() =>
            download(
              exportWeb(data.profiles, board.entries),
              'all-relationship-webs',
              'json',
            )
          }
        >
          Export all relationship data
        </button>
        <a href="#/population">Population backups and recovery</a>
      </div>
      <label>
        Import relationship JSON
        <input
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            setIncoming(null);
            setError('');
            if (!file) return;
            try {
              if (file.size > MAX_IMPORT_BYTES)
                throw new Error('Backup exceeds 10 MB.');
              setIncoming(parseWebBackup(await file.text()));
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Cannot read backup.',
              );
            }
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      {incoming && (
        <section aria-label="Relationship import preview">
          <h3>Relationship import preview</h3>
          <ul>
            {incoming.profiles.map((p) => (
              <li key={p.id}>
                {p.name}: {p.web.nodes.length} characters · {p.web.edges.length}{' '}
                connections ·{' '}
                {data.profiles.some((x) => x.id === p.id)
                  ? 'Existing profile'
                  : 'New profile'}
                <ul>
                  {p.web.edges.map((e) => (
                    <li key={e.id}>
                      {p.web.nodes.find((n) => n.id === e.from)?.label} —{' '}
                      {e.label} —{' '}
                      {p.web.nodes.find((n) => n.id === e.to)?.label} (
                      {e.status})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="web-toolbar">
            <button
              className="secondary-button"
              disabled={blocked || stale}
              onClick={() => apply('merge')}
            >
              Merge relationship data
            </button>
            <button
              className="secondary-button"
              disabled={blocked || stale}
              onClick={() => setReplace(true)}
            >
              Replace imported webs…
            </button>
            <button className="text-button" onClick={() => setIncoming(null)}>
              Cancel relationship import
            </button>
          </div>
        </section>
      )}
      {replace && (
        <Confirmation
          title="Replace relationship webs?"
          description="This replaces relationship nodes, positions, connections and web preferences only for profile IDs in the preview. Household assignments and Casting Board snapshots are retained. Export a backup first."
          confirmLabel="Confirm web replacement"
          onCancel={() => setReplace(false)}
          onConfirm={() => apply('replace')}
        />
      )}
    </details>
  );
}
