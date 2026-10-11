import { useState } from 'react';
import { usePlanning } from '../../hooks/PlanningContext';
import { duplicateProfile, newProfile } from '../../utils/planning';
import type { SaveProfile } from '../../types/planning';
import { Confirmation } from '../Confirmation';
export function ProfileControls() {
  const { data, commit, blocked, stale } = usePlanning();
  const [name, setName] = useState(''),
    [deleting, setDeleting] = useState<SaveProfile | null>(null);
  const selected = data.profiles.find((p) => p.id === data.selectedProfileId);
  const disabled = blocked || stale;
  return (
    <section className="planning-controls" aria-label="Save-file profiles">
      <label>
        Selected save-file profile
        <select
          disabled={disabled || !data.profiles.length}
          value={data.selectedProfileId}
          onChange={(e) =>
            commit(
              { ...data, selectedProfileId: e.target.value },
              'Profile selected.',
            )
          }
        >
          <option value="" disabled>
            No profiles yet
          </option>
          {data.profiles.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <form
        className="inline-actions"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const p = newProfile(name);
          if (
            commit(
              {
                ...data,
                selectedProfileId: p.id,
                profiles: [...data.profiles, p],
              },
              'Profile created.',
            )
          )
            setName('');
        }}
      >
        <label>
          New profile name
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="primary-button" disabled={disabled}>
          Create profile
        </button>
      </form>
      {selected && (
        <>
          <ProfileEditor
            key={`${selected.id}:${selected.name}:${selected.description}`}
            profile={selected}
          />
          <div className="inline-actions">
            <button
              className="secondary-button"
              disabled={disabled}
              onClick={() => {
                const copy = duplicateProfile(selected);
                commit(
                  {
                    ...data,
                    selectedProfileId: copy.id,
                    profiles: [...data.profiles, copy],
                  },
                  'Profile duplicated.',
                );
              }}
            >
              Duplicate profile
            </button>
            <button
              className="text-button danger-button"
              disabled={disabled}
              onClick={() => setDeleting(selected)}
            >
              Delete profile
            </button>
          </div>
        </>
      )}
      {deleting && (
        <Confirmation
          title="Delete save-file profile?"
          description={`Remove ${deleting.name} and its assignments, notes, custom lots and relationship web? Casting Board entries are preserved. Export a planning backup first if needed.`}
          confirmLabel="Delete profile permanently"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const profiles = data.profiles.filter((p) => p.id !== deleting.id);
            if (
              commit(
                {
                  ...data,
                  profiles,
                  selectedProfileId:
                    data.selectedProfileId === deleting.id
                      ? (profiles[0]?.id ?? '')
                      : data.selectedProfileId,
                },
                'Profile deleted.',
              )
            )
              setDeleting(null);
          }}
        />
      )}
    </section>
  );
}
function ProfileEditor({ profile }: { profile: SaveProfile }) {
  const { updateProfile, blocked, stale } = usePlanning();
  const [name, setName] = useState(profile.name),
    [description, setDescription] = useState(profile.description);
  return (
    <details>
      <summary>Edit profile name and notes</summary>
      <form
        className="entry-editor"
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile({ ...profile, name: name.trim(), description });
        }}
      >
        <label>
          Profile name
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Profile description / notes
          <textarea
            maxLength={100000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <p className="helper-text">
          Created {new Date(profile.createdAt).toLocaleString()} · Modified{' '}
          {new Date(profile.modifiedAt).toLocaleString()}
        </p>
        <button className="secondary-button" disabled={blocked || stale}>
          Save profile details
        </button>
      </form>
    </details>
  );
}
