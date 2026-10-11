import { useState } from 'react';
import type { CastingEntry } from '../../types/casting';
import { usePlanning } from '../../hooks/PlanningContext';
import { AssignmentEditor } from './AssignmentEditor';
export function AssignToWorld({ entry }: { entry: CastingEntry }) {
  const { data, blocked, stale } = usePlanning();
  const [open, setOpen] = useState(false),
    [chosen, setChosen] = useState('');
  const profile = data.profiles.find(
    (p) => p.id === (chosen || data.selectedProfileId),
  );
  return (
    <div className="assignment-launcher">
      <button
        className="secondary-button"
        disabled={blocked || stale}
        onClick={() => setOpen(!open)}
      >
        Assign to World
      </button>
      {open && (
        <div>
          {!data.profiles.length ? (
            <p>
              Create a <a href="#/population">World Population profile</a>{' '}
              first.
            </p>
          ) : (
            <>
              <label>
                Destination save-file profile
                <select
                  value={profile?.id ?? ''}
                  onChange={(e) => setChosen(e.target.value)}
                >
                  {data.profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {profile && (
                <AssignmentEditor
                  key={`${profile.id}:${entry.id}`}
                  profile={profile}
                  entry={entry}
                  onClose={() => setOpen(false)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
