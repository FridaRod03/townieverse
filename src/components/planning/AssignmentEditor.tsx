import { useState } from 'react';
import type { CastingEntry } from '../../types/casting';
import type { SaveProfile, HouseholdAssignment } from '../../types/planning';
import { useStudio } from '../../hooks/StudioContext';
import { usePlanning } from '../../hooks/PlanningContext';
import { assignHousehold } from '../../utils/planning';
export function AssignmentEditor({
  profile,
  entry,
  onClose,
}: {
  profile: SaveProfile;
  entry: CastingEntry;
  onClose: () => void;
}) {
  const { catalog } = useStudio(),
    { updateProfile, blocked, stale } = usePlanning();
  const existing = profile.assignments.find((a) => a.householdId === entry.id);
  const [draft, setDraft] = useState<
    Omit<HouseholdAssignment, 'householdId' | 'household'>
  >(
    () =>
      existing ?? {
        worldId: catalog.worlds.find((w) => w.origin === 'official')!.id,
        neighborhoodId: '',
        lotId: '',
        arrangement: '',
        notes: '',
        placed: false,
      },
  );
  const world = catalog.worlds.find((w) => w.id === draft.worldId)!;
  const lots = [
    ...world.lots.filter((l) => l.origin === 'official'),
    ...profile.customLots.filter((l) => l.worldId === world.id),
  ].filter((l) => l.neighborhoodId === draft.neighborhoodId);
  return (
    <form
      className="entry-editor"
      aria-label={`Assign ${entry.title}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (updateProfile(assignHousehold(profile, entry, draft))) onClose();
      }}
    >
      <h3>Assign {entry.title}</h3>
      <p>
        Planning metadata only. The original generated household stays
        unchanged. Assignments are retained when packs are disabled.
      </p>
      <label>
        Assignment world
        <select
          autoFocus
          value={draft.worldId}
          onChange={(e) =>
            setDraft({
              ...draft,
              worldId: e.target.value,
              neighborhoodId: '',
              lotId: '',
            })
          }
        >
          {catalog.worlds.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
              {w.origin !== 'official' ? ' · fictional' : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        Assignment neighborhood
        <select
          value={draft.neighborhoodId}
          onChange={(e) =>
            setDraft({ ...draft, neighborhoodId: e.target.value, lotId: '' })
          }
        >
          <option value="">World-level assignment</option>
          {world.neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
              {n.origin !== 'official' ? ' · fictional' : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        Assignment lot
        <select
          value={draft.lotId}
          onChange={(e) => setDraft({ ...draft, lotId: e.target.value })}
        >
          <option value="">No specific lot</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ·{' '}
              {profile.customLots.some((c) => c.id === l.id)
                ? 'custom'
                : 'verified official'}
              {l.size ? ` · ${l.size.width} × ${l.size.height}` : ''}
            </option>
          ))}
        </select>
      </label>
      {!lots.length && (
        <p className="helper-text">
          No verified/custom lots for this selection. World or neighborhood
          assignment works without a lot. Add a custom lot on World Population.
        </p>
      )}
      <label>
        Residential arrangement
        <input
          maxLength={500}
          value={draft.arrangement}
          onChange={(e) => setDraft({ ...draft, arrangement: e.target.value })}
          placeholder="e.g. Shared rental or multigenerational home"
        />
      </label>
      <label>
        Assignment notes
        <textarea
          value={draft.notes}
          maxLength={100000}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </label>
      <label>
        Household placement
        <select
          value={draft.placed ? 'placed' : 'planned'}
          onChange={(e) =>
            setDraft({ ...draft, placed: e.target.value === 'placed' })
          }
        >
          <option value="planned">Planned · awaiting placement</option>
          <option value="placed">Explicitly placed in this save</option>
        </select>
      </label>
      <div className="inline-actions">
        <button className="primary-button" disabled={blocked || stale}>
          Save assignment
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancel assignment
        </button>
      </div>
    </form>
  );
}
