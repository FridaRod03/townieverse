import { useEffect, useRef, useState } from 'react';
import type { SaveProfile, HouseholdAssignment } from '../../types/planning';
import { PROGRESS } from '../../types/casting';
import type { Progress } from '../../types/casting';
import type { World } from '../../types/models';
import { usePlanning } from '../../hooks/PlanningContext';
import { useCasting } from '../../hooks/CastingContext';
import { useStudio } from '../../hooks/StudioContext';
import { populationStats, resolveHousehold } from '../../utils/planning';
import { AssignmentEditor } from './AssignmentEditor';
import { CustomLots } from './CustomLots';
import { Confirmation } from '../Confirmation';

export function PlanNote({
  profile,
  scope,
  id,
  label,
}: {
  profile: SaveProfile;
  scope: 'worldNotes' | 'neighborhoodNotes';
  id: string;
  label: string;
}) {
  const { updateProfile, blocked, stale } = usePlanning();
  const [note, setNote] = useState(profile[scope][id] ?? '');
  return (
    <form
      className="entry-editor"
      onSubmit={(e) => {
        e.preventDefault();
        updateProfile({
          ...profile,
          [scope]: { ...profile[scope], [id]: note },
        });
      }}
    >
      <label>
        {label}
        <textarea
          maxLength={100000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button className="text-button" disabled={blocked || stale}>
        Save {label.toLowerCase()}
      </button>
    </form>
  );
}
function AssignedHousehold({
  profile,
  assignment,
}: {
  profile: SaveProfile;
  assignment: HouseholdAssignment;
}) {
  const { updateProfile, blocked, stale } = usePlanning(),
    casting = useCasting();
  const [editing, setEditing] = useState(false),
    [remove, setRemove] = useState(false);
  const entry = resolveHousehold(assignment, casting.board.entries);
  const live = casting.board.entries.some((e) => e === entry);
  const { catalog } = useStudio();
  const world = catalog.worlds.find((w) => w.id === assignment.worldId)!;
  const lot =
    world.lots.find((l) => l.id === assignment.lotId) ??
    profile.customLots.find((l) => l.id === assignment.lotId);
  return (
    <article className="planning-household">
      <h4>{entry.title}</h4>
      <p>
        {assignment.placed
          ? 'Household explicitly placed'
          : 'Household awaiting placement'}
        {assignment.arrangement ? ` · ${assignment.arrangement}` : ''}
      </p>
      {assignment.notes && <p>{assignment.notes}</p>}
      <p>
        {world.name} ·{' '}
        {world.neighborhoods.find((n) => n.id === assignment.neighborhoodId)
          ?.name ?? 'World-level assignment'}{' '}
        ·{' '}
        {lot
          ? `${lot.name} (${profile.customLots.some((l) => l.id === lot.id) ? 'custom' : 'verified official'})`
          : 'No specific lot'}
      </p>
      <p className="helper-text">Household ID: {assignment.householdId}</p>
      <details>
        <summary>
          Individual Sim progress · {entry.content.members.length}
        </summary>
        <p>
          Uses Casting Board member progress. “Idea” is displayed as “Not
          Started.” Created in CAS does not imply placed. “Playing” is a
          retained legacy placed status. Progress is shared across profiles;
          household placement is specific to each plan.
        </p>
        {entry.content.members.map((m, index) => (
          <label key={m.id}>
            Sim {index + 1} · {m.name}
            <select
              disabled={blocked || stale || casting.blocked || !live}
              value={entry.memberProgress[m.id] ?? 'Idea'}
              onChange={(e) =>
                casting.update(entry.id, {
                  memberProgress: {
                    ...entry.memberProgress,
                    [m.id]: e.target.value as Progress,
                  },
                })
              }
            >
              {PROGRESS.map((s) => (
                <option key={s} value={s}>
                  {s === 'Idea' ? 'Not Started' : s}
                </option>
              ))}
            </select>
          </label>
        ))}
        {!live && (
          <p className="helper-text">
            Using the backup snapshot because the original entry is absent or
            its ID now refers to different content. Restore it through a Casting
            Board backup to edit member progress. The plan is retained.
          </p>
        )}
        {!live &&
          !casting.board.entries.some(
            (e) => e.id === assignment.householdId,
          ) && (
            <button
              className="secondary-button"
              disabled={blocked || stale || casting.blocked}
              onClick={() =>
                casting.importBoard(
                  { schemaVersion: 1, entries: [entry] },
                  'merge',
                  false,
                )
              }
            >
              Restore household to Casting Board
            </button>
          )}
      </details>
      <details>
        <summary>Preserved household snapshot</summary>
        <pre className="saved-content">{entry.content.text}</pre>
      </details>
      <div className="inline-actions">
        <button
          className="secondary-button"
          disabled={blocked || stale}
          onClick={() => setEditing(!editing)}
        >
          Change assignment
        </button>
        <button
          className="text-button danger-button"
          disabled={blocked || stale}
          onClick={() => setRemove(true)}
        >
          Unassign household
        </button>
      </div>
      {editing && (
        <AssignmentEditor
          profile={profile}
          entry={entry}
          onClose={() => setEditing(false)}
        />
      )}
      {remove && (
        <Confirmation
          title="Unassign household?"
          description="Remove this assignment from the selected profile? Casting Board content and member progress remain intact."
          confirmLabel="Confirm unassignment"
          onCancel={() => setRemove(false)}
          onConfirm={() => {
            if (
              updateProfile({
                ...profile,
                assignments: profile.assignments.filter(
                  (a) => a.householdId !== assignment.householdId,
                ),
              })
            )
              setRemove(false);
          }}
        />
      )}
    </article>
  );
}
export function WorldDetail({
  profile,
  world,
  onClose,
}: {
  profile: SaveProfile;
  world: World;
  onClose: () => void;
}) {
  const { board } = useCasting();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [world.id]);
  const assignments = profile.assignments.filter((a) => a.worldId === world.id);
  const cards = (items: HouseholdAssignment[]) =>
    items.length ? (
      items.map((a) => (
        <AssignedHousehold
          key={a.householdId}
          profile={profile}
          assignment={a}
        />
      ))
    ) : (
      <p>No households assigned here.</p>
    );
  return (
    <section className="world-detail" aria-label={`${world.name} planning`}>
      <div className="result-heading">
        <h2 ref={heading} tabIndex={-1}>
          {world.name} planning
        </h2>
        <button className="secondary-button" onClick={onClose}>
          Close world detail
        </button>
      </div>
      <PlanNote
        profile={profile}
        scope="worldNotes"
        id={world.id}
        label="World notes"
      />
      <CustomLots profile={profile} worldId={world.id} />
      <details open>
        <summary>
          World-level assignments ·{' '}
          {assignments.filter((a) => !a.neighborhoodId).length}
        </summary>
        {cards(assignments.filter((a) => !a.neighborhoodId))}
      </details>
      {!world.neighborhoods.length && (
        <p>
          No verified neighborhood records. Use world-level assignments; no
          neighborhood names are invented.
        </p>
      )}
      {world.neighborhoods.map((n) => {
        const items = assignments.filter((a) => a.neighborhoodId === n.id),
          stats = populationStats(items, board.entries);
        return (
          <details key={n.id} className="neighborhood-plan">
            <summary>
              {n.name} · {stats.households} households · {stats.sims} Sims ·{' '}
              {stats.placedHouseholds} placed households
            </summary>
            <PlanNote
              key={`${profile.id}:${n.id}`}
              profile={profile}
              scope="neighborhoodNotes"
              id={n.id}
              label={`Notes for ${n.name}`}
            />
            <p>
              {n.origin === 'official'
                ? 'Verified official neighborhood'
                : 'Fictional save neighborhood'}
            </p>
            <h3>Verified lots</h3>
            {world.lots.filter(
              (l) => l.neighborhoodId === n.id && l.origin === 'official',
            ).length ? (
              <ul>
                {world.lots
                  .filter(
                    (l) => l.neighborhoodId === n.id && l.origin === 'official',
                  )
                  .map((l) => (
                    <li key={l.id}>
                      {l.name} · {l.lotType} · {l.size?.width} ×{' '}
                      {l.size?.height}
                    </li>
                  ))}
              </ul>
            ) : (
              <p>
                No verified lot records in this neighborhood; assignment does
                not require a lot.
              </p>
            )}
            <h3>Custom lots</h3>
            <ul>
              {profile.customLots
                .filter(
                  (l) => l.worldId === world.id && l.neighborhoodId === n.id,
                )
                .map((l) => (
                  <li key={l.id}>
                    {l.name} · custom · {l.lotType}
                    {l.size ? ` · ${l.size.width} × ${l.size.height}` : ''}
                    <p>{l.description}</p>
                  </li>
                ))}
            </ul>
            {cards(items)}
          </details>
        );
      })}
    </section>
  );
}
