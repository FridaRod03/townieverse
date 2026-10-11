import { useState } from 'react';
import { usePlanning } from '../../hooks/PlanningContext';
import { useCasting } from '../../hooks/CastingContext';
import { useStudio } from '../../hooks/StudioContext';
import { download, exportJson, MAX_IMPORT_BYTES } from '../../utils/casting';
import {
  emptyPlanning,
  exportPlanning,
  parsePlanning,
  resolveHousehold,
} from '../../utils/planning';
import type { PlanningData } from '../../types/planning';
import { Confirmation } from '../Confirmation';
export function PlanningBackup() {
  const { data, importPlans, blocked, stale, recoveryRaw, commit } =
      usePlanning(),
    { board } = useCasting(),
    { catalog } = useStudio();
  const [incoming, setIncoming] = useState<PlanningData | null>(null),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState<'replace' | 'recover' | null>(null);
  const exportOne = (profileId?: string) =>
    download(
      exportPlanning(data, board.entries, profileId),
      profileId ? 'save-profile' : 'all-save-profiles',
      'json',
    );
  return (
    <section className="planning-backup">
      <details>
        <summary>Planning backups and recovery</summary>
        <p>
          Planning JSON includes profiles, assignments, notes, custom lots,
          relationship webs and recovery snapshots of assigned households.
          Casting Board JSON remains a separate compatible format; import older
          board backups on Casting Board.
        </p>
        <div className="inline-actions">
          <button
            className="secondary-button"
            disabled={blocked || !data.profiles.length}
            onClick={() => exportOne()}
          >
            Export all profiles
          </button>
          <button
            className="secondary-button"
            disabled={blocked || !data.selectedProfileId}
            onClick={() => exportOne(data.selectedProfileId)}
          >
            Export selected profile
          </button>
          <a href="#/casting">Casting Board backups</a>
          <button
            className="secondary-button"
            disabled={blocked || !data.selectedProfileId}
            onClick={() => {
              const profile = data.profiles.find(
                (p) => p.id === data.selectedProfileId,
              )!;
              download(
                exportJson(
                  profile.assignments.map((a) =>
                    resolveHousehold(a, board.entries),
                  ),
                ),
                'assigned-households',
                'json',
              );
            }}
          >
            Export assigned households as Casting Board JSON
          </button>
        </div>
        <label>
          Import planning JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              setIncoming(null);
              setError('');
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                if (file.size > MAX_IMPORT_BYTES)
                  throw new Error('Planning backup exceeds 10 MB.');
                setIncoming(parsePlanning(await file.text(), catalog));
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
          <div className="import-preview">
            <h3>Planning import preview</h3>
            <p>
              {incoming.profiles.length} profiles ·{' '}
              {incoming.profiles.reduce((n, p) => n + p.assignments.length, 0)}{' '}
              assignments ·{' '}
              {incoming.profiles.reduce((n, p) => n + p.customLots.length, 0)}{' '}
              custom lots
            </p>
            <ul>
              {incoming.profiles.map((p) => (
                <li key={p.id}>
                  {p.name} ·{' '}
                  {data.profiles.some((x) => x.id === p.id)
                    ? JSON.stringify(
                        data.profiles.find((x) => x.id === p.id),
                      ) === JSON.stringify(p)
                      ? 'Identical profile: will be skipped'
                      : 'Conflicting profile ID: will be preserved as a new profile'
                    : 'New profile'}
                </li>
              ))}
            </ul>
            <div className="inline-actions">
              <button
                className="secondary-button"
                disabled={blocked || stale}
                onClick={() => {
                  if (importPlans(incoming, 'merge')) setIncoming(null);
                }}
              >
                Merge profiles
              </button>
              <button
                className="secondary-button danger-button"
                disabled={stale}
                onClick={() => setConfirm('replace')}
              >
                Replace planning profiles…
              </button>
              <button className="text-button" onClick={() => setIncoming(null)}>
                Cancel import
              </button>
            </div>
          </div>
        )}
        {blocked && (
          <div className="error-notice">
            <p>
              Unreadable planning data is preserved. Export the raw value before
              recovery; a future-version file may require a newer app.
            </p>
            {recoveryRaw !== null && (
              <button
                className="secondary-button"
                onClick={() =>
                  download(recoveryRaw, 'planning-raw-recovery', 'json')
                }
              >
                Export raw planning recovery
              </button>
            )}
            <button
              className="secondary-button danger-button"
              disabled={stale}
              onClick={() => setConfirm('recover')}
            >
              Start empty planning store…
            </button>
          </div>
        )}
      </details>
      {confirm && (
        <Confirmation
          title={
            confirm === 'replace'
              ? 'Replace planning profiles?'
              : 'Reset unreadable planning data?'
          }
          description="This replaces planning profiles, assignments, notes, custom lots and relationship webs. Casting Board entries and generator preferences remain intact. Keep an exported backup first."
          confirmLabel={
            confirm === 'replace'
              ? 'Confirm planning replacement'
              : 'Confirm planning reset'
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const ok =
              confirm === 'replace' && incoming
                ? importPlans(incoming, 'replace', true)
                : commit(
                    emptyPlanning(),
                    'Empty planning store recovered.',
                    true,
                  );
            if (ok) {
              setConfirm(null);
              setIncoming(null);
            }
          }}
        />
      )}
    </section>
  );
}
