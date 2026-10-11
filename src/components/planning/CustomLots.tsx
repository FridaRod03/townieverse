import { useState } from 'react';
import type { SaveProfile } from '../../types/planning';
import { usePlanning } from '../../hooks/PlanningContext';
import { useStudio } from '../../hooks/StudioContext';
import { Confirmation } from '../Confirmation';
export function CustomLots({
  profile,
  worldId,
}: {
  profile: SaveProfile;
  worldId: string;
}) {
  const { catalog } = useStudio(),
    { updateProfile, blocked, stale } = usePlanning();
  const world = catalog.worlds.find((w) => w.id === worldId)!;
  const [name, setName] = useState(''),
    [neighborhoodId, setNeighborhood] = useState(''),
    [lotType, setType] = useState('Residential'),
    [description, setDescription] = useState(''),
    [width, setWidth] = useState(''),
    [height, setHeight] = useState(''),
    [error, setError] = useState(''),
    [deleting, setDeleting] = useState('');
  return (
    <details>
      <summary>
        Custom lots ·{' '}
        {profile.customLots.filter((l) => l.worldId === worldId).length}
      </summary>
      <p>
        These are user-authored lots, separate from verified official records.
        Dimensions are optional.
      </p>
      <ul>
        {profile.customLots
          .filter((l) => l.worldId === worldId)
          .map((l) => (
            <li key={l.id}>
              <strong>{l.name} · custom</strong> · {l.lotType}
              {l.size ? ` · ${l.size.width} × ${l.size.height}` : ''}
              <p>{l.description}</p>
              <button
                className="text-button danger-button"
                disabled={blocked || stale}
                onClick={() => setDeleting(l.id)}
              >
                Remove custom lot {l.name}
              </button>
            </li>
          ))}
      </ul>
      <form
        className="entry-editor"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          if (
            !!width !== !!height ||
            (width &&
              (!Number.isInteger(Number(width)) ||
                !Number.isInteger(Number(height)) ||
                Number(width) < 1 ||
                Number(height) < 1 ||
                Number(width) > 1000 ||
                Number(height) > 1000))
          ) {
            setError(
              'Provide both dimensions as whole numbers from 1 to 1000, or leave both empty.',
            );
            return;
          }
          const lot = {
            id: `custom-plan:${crypto.randomUUID()}`,
            name: name.trim(),
            worldId,
            neighborhoodId,
            lotType: lotType.trim(),
            description,
            ...(width
              ? { size: { width: Number(width), height: Number(height) } }
              : {}),
          };
          if (
            updateProfile({
              ...profile,
              customLots: [...profile.customLots, lot],
            })
          ) {
            setName('');
            setDescription('');
            setWidth('');
            setHeight('');
          }
        }}
      >
        <label>
          Custom lot name
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Custom lot neighborhood
          <select
            value={neighborhoodId}
            onChange={(e) => setNeighborhood(e.target.value)}
          >
            <option value="">Unknown / world level</option>
            {world.neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Custom lot type
          <input
            required
            maxLength={120}
            value={lotType}
            onChange={(e) => setType(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Optional lot width
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </label>
          <label>
            Optional lot height
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
        </div>
        <label>
          Custom lot description
          <textarea
            maxLength={100000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="secondary-button" disabled={blocked || stale}>
          Add custom planning lot
        </button>
      </form>
      {deleting && (
        <Confirmation
          title="Remove custom planning lot?"
          description="Assignments to this lot will keep their world and neighborhood and have their lot field cleared. Official lot records are unchanged."
          confirmLabel="Confirm lot removal"
          onCancel={() => setDeleting('')}
          onConfirm={() => {
            if (
              updateProfile({
                ...profile,
                customLots: profile.customLots.filter((l) => l.id !== deleting),
                assignments: profile.assignments.map((a) =>
                  a.lotId === deleting ? { ...a, lotId: '' } : a,
                ),
              })
            )
              setDeleting('');
          }}
        />
      )}
    </details>
  );
}
