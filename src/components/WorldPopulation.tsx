import { useState } from 'react';
import { usePlanning } from '../hooks/PlanningContext';
import { useCasting } from '../hooks/CastingContext';
import { useStudio } from '../hooks/StudioContext';
import { populationStats, populationStatus } from '../utils/planning';
import { ProfileControls } from './planning/ProfileControls';
import { PlanningBackup } from './planning/PlanningBackup';
import { AssignmentEditor } from './planning/AssignmentEditor';
import { WorldDetail } from './planning/WorldDetail';
import '../styles/planning.css';
export function WorldPopulation() {
  const { data, notice, blocked, stale } = usePlanning(),
    { board } = useCasting(),
    { catalog, settings } = useStudio();
  const [query, setQuery] = useState(''),
    [ownedOnly, setOwnedOnly] = useState(false),
    [status, setStatus] = useState(''),
    [worldId, setWorldId] = useState(''),
    [entryId, setEntryId] = useState('');
  const profile = data.profiles.find((p) => p.id === data.selectedProfileId),
    world = catalog.worlds.find((w) => w.id === worldId),
    entry = board.entries.find(
      (e) => e.id === entryId && e.type === 'household',
    );
  const available = (packs: string[]) =>
    packs.every(
      (p) => p === 'base-game' || settings.preferences.ownedPacks.includes(p),
    );
  const allWorlds = catalog.worlds.filter(
    (w) =>
      w.origin === 'official' ||
      profile?.assignments.some((a) => a.worldId === w.id),
  );
  const filtered = allWorlds.filter(
    (w) =>
      w.name.toLowerCase().includes(query.toLowerCase()) &&
      (!ownedOnly ||
        available(w.requiredPacks) ||
        profile?.assignments.some((a) => a.worldId === w.id)) &&
      (!status ||
        populationStatus(
          populationStats(
            profile?.assignments.filter((a) => a.worldId === w.id) ?? [],
            board.entries,
          ),
        ) === status),
  );
  const stats = populationStats(profile?.assignments ?? [], board.entries);
  const empty = allWorlds.filter(
    (w) => !profile?.assignments.some((a) => a.worldId === w.id),
  ).length;
  const occurrences = new Map<string, number>();
  for (const a of profile?.assignments ?? [])
    for (const m of a.household.content.members)
      occurrences.set(m.id, (occurrences.get(m.id) ?? 0) + 1);
  return (
    <section className="population-page">
      <p className="eyebrow">YOUR SAVE, YOUR CAST</p>
      <h1 id="page-title" tabIndex={-1}>
        World Population
      </h1>
      <p className="page-introduction">
        Plan where your households belong. Townieverse profiles are planning
        notebooks; they do not read or modify Sims 4 save files.
      </p>
      <ProfileControls />
      <p
        role="status"
        aria-label="Planning status"
        className={blocked || stale ? 'error-notice' : 'helper-text'}
      >
        {notice}
      </p>
      <PlanningBackup />
      {!profile ? (
        <p className="empty-state">
          Create a profile to begin. Every world starts with zero planned
          residents.
        </p>
      ) : (
        <>
          <section
            aria-label="Selected profile statistics"
            className="population-summary"
          >
            <h2>{profile.name}</h2>
            <dl>
              <div>
                <dt>Planned households</dt>
                <dd>{stats.households}</dd>
              </div>
              <div>
                <dt>Unique planned Sims</dt>
                <dd>{stats.sims}</dd>
              </div>
              <div>
                <dt>Sims created in CAS</dt>
                <dd>{stats.created}</dd>
              </div>
              <div>
                <dt>Sims placed in worlds</dt>
                <dd>{stats.placedSims}</dd>
              </div>
              <div>
                <dt>Households placed</dt>
                <dd>{stats.placedHouseholds}</dd>
              </div>
              <div>
                <dt>Awaiting placement</dt>
                <dd>{stats.awaiting}</dd>
              </div>
              <div>
                <dt>Empty worlds</dt>
                <dd>{empty}</dd>
              </div>
              <div>
                <dt>Neighborhoods assigned</dt>
                <dd>{stats.neighborhoods}</dd>
              </div>
            </dl>
            <details>
              <summary>How progress is calculated</summary>
              <p>
                Only assignments in this profile count. Households use saved
                entry IDs, never names. Sims use member IDs and count once
                within each displayed scope; repeated IDs use the most advanced
                existing member progress. Created in CAS, Placed in World and
                Playing count as created; only Placed in World or Playing count
                as placed Sims. Household placement requires an explicit
                assignment setting and never advances member progress
                automatically. Completed means all assigned households and
                unique Sims are placed; it does not mean every in-game lot is
                occupied. Neighborhood coverage counts recorded neighborhoods
                with assignments, not verified completeness. World counts are
                per-world and may overlap when a Sim ID is assigned to more than
                one world; use the profile's unique total rather than adding
                world cards.
              </p>
            </details>
            {[...occurrences.values()].some((n) => n > 1) && (
              <p className="sample-notice">
                Repeated Sim IDs appear in multiple concepts. Unique totals
                count each ID once; world/neighborhood counts may overlap.
                Review duplicate concepts before placement. Names alone cannot
                identify a shared Sim.
              </p>
            )}
          </section>
          <details className="assign-from-board">
            <summary>Assign a saved household</summary>
            <label>
              Saved household
              <select
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
              >
                <option value="">Choose a Casting Board household</option>
                {board.entries
                  .filter((e) => e.type === 'household')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} · {e.id.slice(0, 8)}
                    </option>
                  ))}
              </select>
            </label>
            {!board.entries.some((e) => e.type === 'household') && (
              <p>
                Save a household on <a href="#/household">Households</a>, then
                assign it here or from its Casting Board card.
              </p>
            )}
            {entry && (
              <AssignmentEditor
                key={`${profile.id}:${entry.id}`}
                profile={profile}
                entry={entry}
                onClose={() => setEntryId('')}
              />
            )}
          </details>
          <div className="form-grid population-filters">
            <label>
              Search worlds
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Population status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All population statuses</option>
                <option value="empty">Empty worlds</option>
                <option value="partial">Partially populated worlds</option>
                <option value="completed">Completed planned populations</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
              />
              Owned-pack worlds + existing assignments
            </label>
          </div>
          <p className="helper-text">
            {filtered.length} worlds shown. Disabled-pack worlds with saved
            assignments remain visible.
          </p>
          {world && (
            <WorldDetail
              key={`${profile.id}:${world.id}`}
              profile={profile}
              world={world}
              onClose={() => {
                setWorldId('');
                document.getElementById(`plan-${world.id}`)?.focus();
              }}
            />
          )}
          <div className="population-grid">
            {filtered.map((w) => {
              const assignments = profile.assignments.filter(
                  (a) => a.worldId === w.id,
                ),
                s = populationStats(assignments, board.entries);
              return (
                <article key={w.id} className="world-plan-card">
                  <h2>{w.name}</h2>
                  <p>
                    {w.origin === 'official'
                      ? 'Official world'
                      : 'Fictional save concept'}{' '}
                    ·{' '}
                    {w.requiredPacks
                      .map(
                        (id) =>
                          catalog.packs.find((p) => p.id === id)?.name ?? id,
                      )
                      .join(', ') || 'Base game'}
                  </p>
                  {!available(w.requiredPacks) && (
                    <p className="status-badge">
                      Pack disabled · saved plans retained
                    </p>
                  )}
                  <dl>
                    <div>
                      <dt>Planned households</dt>
                      <dd>{s.households}</dd>
                    </div>
                    <div>
                      <dt>Assigned Sims</dt>
                      <dd>{s.sims}</dd>
                    </div>
                    <div>
                      <dt>Created in CAS</dt>
                      <dd>{s.created}</dd>
                    </div>
                    <div>
                      <dt>Placed households</dt>
                      <dd>{s.placedHouseholds}</dd>
                    </div>
                  </dl>
                  <p>
                    {populationStatus(s)} · {s.placedHouseholds} of{' '}
                    {s.households} households placed · {s.placedSims} of{' '}
                    {s.sims} Sims placed
                  </p>
                  <progress
                    aria-label={`${w.name}: ${s.placedHouseholds} of ${s.households} planned households placed`}
                    value={s.placedHouseholds}
                    max={Math.max(1, s.households)}
                  />
                  <p>
                    Neighborhood coverage: {s.neighborhoods} of{' '}
                    {w.neighborhoods.length} recorded neighborhoods assigned
                  </p>
                  <button
                    id={`plan-${w.id}`}
                    className="secondary-button"
                    onClick={() => setWorldId(w.id)}
                  >
                    Plan {w.name}
                  </button>
                </article>
              );
            })}
          </div>
          {!filtered.length && (
            <p>No worlds match these filters. Your assignments remain saved.</p>
          )}
        </>
      )}
    </section>
  );
}
