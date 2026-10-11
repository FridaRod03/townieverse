import { useEffect, useMemo, useState } from 'react';
import { usePlanning } from '../hooks/PlanningContext';
import { useCasting } from '../hooks/CastingContext';
import { useStudio } from '../hooks/StudioContext';
import { CONNECTION_TYPES } from '../types/web';
import type {
  CharacterNode,
  Connection,
  RelationshipWeb as Web,
  WebFilters,
} from '../types/web';
import {
  connectionGroup,
  filterWeb,
  orphanIds,
  reconcileWeb,
  removeNode,
  validateWeb,
  standaloneNode,
  newConnection,
} from '../utils/web';
import { NodeEditor } from './web/NodeEditor';
import { ConnectionEditor } from './web/ConnectionEditor';
import { RelationshipGraph } from './web/RelationshipGraph';
import { WebBackup } from './web/WebBackup';
import { Confirmation } from './Confirmation';
import '../styles/web.css';

export function RelationshipWeb() {
  const planning = usePlanning();
  const profile = planning.data.profiles.find(
    (p) => p.id === planning.data.selectedProfileId,
  );
  return (
    <section className="relationship-page container">
      <span className="eyebrow">EVERY SIM HAS A STORY</span>
      <h1 id="page-title" tabIndex={-1}>
        Relationship Web
      </h1>
      <p>
        A character board for your Townieverse save profile. Connections and
        strength are story-planning metadata, separate from Sims 4 game files.
      </p>
      <label>
        Relationship save profile
        <select
          value={profile?.id ?? ''}
          disabled={planning.blocked || planning.stale}
          onChange={(e) =>
            planning.commit(
              { ...planning.data, selectedProfileId: e.target.value },
              'Selected relationship profile.',
            )
          }
        >
          <option value="" disabled>
            Select a profile
          </option>
          {planning.data.profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <p role="status" aria-label="Relationship storage status">
        {planning.notice}
      </p>
      <WebBackup />
      {profile ? (
        <ProfileWeb key={profile.id} />
      ) : (
        <p>
          Create a save-file profile in{' '}
          <a href="#/population">World Population</a> to start your character
          board.
        </p>
      )}
    </section>
  );
}
function ProfileWeb() {
  const { data, updateProfile, blocked, stale } = usePlanning(),
    { board } = useCasting(),
    { catalog } = useStudio();
  const profile = data.profiles.find((p) => p.id === data.selectedProfileId)!;
  const web = useMemo(
    () => reconcileWeb(profile, board.entries),
    [profile, board.entries],
  );
  const [selected, setSelected] = useState(''),
    [nodeDraft, setNodeDraft] = useState<CharacterNode | null>(null),
    [edgeDraft, setEdgeDraft] = useState<Connection | null>(null),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState<{
      kind: 'node' | 'edge' | 'layout';
      id: string;
    } | null>(null);
  const disabled = blocked || stale;
  useEffect(() => {
    if (
      !disabled &&
      JSON.stringify(profile.relationshipWeb) !== JSON.stringify(web)
    )
      updateProfile({ ...profile, relationshipWeb: web });
  }, [profile, web, disabled, updateProfile]);
  const save = (next: Web) => {
    if (!validateWeb(next)) {
      setError(
        'Invalid relationship data. Check life stages, family ties, duplicate connections and field limits. Existing data is unchanged.',
      );
      return false;
    }
    const result = updateProfile({ ...profile, relationshipWeb: next });
    if (result) setError('');
    return result;
  };
  const filters = web.filters,
    visible = useMemo(() => filterWeb(web), [web]),
    orphans = orphanIds(profile, web),
    worldNames = new Map(catalog.worlds.map((w) => [w.id, w.name]));
  const node = web.nodes.find((n) => n.id === selected),
    edge = web.edges.find((e) => e.id === selected);
  const setFilters = (patch: Partial<WebFilters>) =>
    save({ ...web, filters: { ...filters, ...patch } });
  const select = (id: string, isEdge = false) => {
    setSelected(id);
    setNodeDraft(null);
    if (isEdge) setEdgeDraft(null);
  };
  const editNode = (n: CharacterNode) => {
    setNodeDraft(n);
    setEdgeDraft(null);
  };
  const editEdge = (e: Connection) => {
    setEdgeDraft(e);
    setNodeDraft(null);
  };
  return (
    <>
      <h2>{profile.name}</h2>
      <p>
        {web.nodes.length} characters · {web.edges.length} connections ·{' '}
        {orphans.size} orphaned characters
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="web-toolbar">
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={() =>
            editNode({
              ...standaloneNode(),
              x: (web.nodes.length % 5) * 320,
              y: Math.floor(web.nodes.length / 5) * 180,
            })
          }
        >
          Add standalone Sim
        </button>
        <button
          className="secondary-button"
          disabled={disabled || web.nodes.length < 2}
          onClick={() => editEdge(newConnection())}
        >
          Create relationship
        </button>
        <a href="#/population">Assign households in World Population</a>
      </div>
      <details className="web-panel">
        <summary>Search and filter connections</summary>
        <div className="web-form-grid">
          <label>
            Search characters and connections
            <input
              type="search"
              value={filters.search}
              disabled={disabled}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </label>
          <label>
            Household filter
            <select
              value={filters.householdId}
              disabled={disabled}
              onChange={(e) => setFilters({ householdId: e.target.value })}
            >
              <option value="">All households</option>
              {[
                ...new Map(
                  web.nodes
                    .filter((n) => n.householdId)
                    .map((n) => [n.householdId, n.householdName]),
                ).entries(),
              ].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            World filter
            <select
              value={filters.worldId}
              disabled={disabled}
              onChange={(e) => setFilters({ worldId: e.target.value })}
            >
              <option value="">All worlds</option>
              {catalog.worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Connection type filter
            <select
              value={filters.type}
              disabled={disabled}
              onChange={(e) => setFilters({ type: e.target.value })}
            >
              <option value="">All types</option>
              {Object.entries(CONNECTION_TYPES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Connection status filter
            <select
              value={filters.status}
              disabled={disabled}
              onChange={(e) => setFilters({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              {['active', 'ended', 'planned'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {(['simId', 'focusId'] as const).map((key, i) => (
            <label key={key}>
              {i ? 'Focus mode' : 'Individual Sim filter'}
              <select
                value={filters[key]}
                disabled={disabled}
                onChange={(e) => setFilters({ [key]: e.target.value })}
              >
                <option value="">{i ? 'Entire web' : 'All Sims'}</option>
                {web.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} · {n.householdName || 'Standalone'}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="web-check">
          <input
            type="checkbox"
            checked={filters.favorites}
            disabled={disabled}
            onChange={(e) => setFilters({ favorites: e.target.checked })}
          />
          Favorite characters only
        </label>
        <button
          className="text-button"
          disabled={disabled}
          onClick={() =>
            setFilters({
              search: '',
              householdId: '',
              worldId: '',
              type: '',
              status: '',
              simId: '',
              focusId: '',
              favorites: false,
            })
          }
        >
          Clear web filters
        </button>
        <p>
          Household/world/favorite filters show connections only when both
          endpoints are visible. Individual Sim and focus mode include adjacent
          connections.
        </p>
      </details>
      <div className="web-toolbar">
        <label className="web-check">
          <input
            type="checkbox"
            checked={web.view.listOnly}
            disabled={disabled}
            onChange={(e) =>
              save({
                ...web,
                view: { ...web.view, listOnly: e.target.checked },
              })
            }
          />
          List view only
        </label>
        <label className="web-check">
          <input
            type="checkbox"
            checked={web.view.simplified}
            disabled={disabled}
            onChange={(e) =>
              save({
                ...web,
                view: { ...web.view, simplified: e.target.checked },
              })
            }
          />
          Simplified graph
        </label>
      </div>
      {nodeDraft && (
        <NodeEditor
          key={nodeDraft.id}
          node={nodeDraft}
          worlds={catalog.worlds}
          onCancel={() => setNodeDraft(null)}
          onSave={(n) =>
            save({
              ...web,
              nodes: web.nodes.some((old) => old.id === n.id)
                ? web.nodes.map((old) => (old.id === n.id ? n : old))
                : [...web.nodes, n],
            })
          }
        />
      )}
      {edgeDraft && (
        <ConnectionEditor
          key={edgeDraft.id}
          edge={edgeDraft}
          web={web}
          onCancel={() => setEdgeDraft(null)}
          onSave={(e) =>
            save({
              ...web,
              edges: web.edges.some((old) => old.id === e.id)
                ? web.edges.map((old) => (old.id === e.id ? e : old))
                : [...web.edges, e],
            })
          }
        />
      )}
      {!web.view.listOnly && (
        <RelationshipGraph
          web={web}
          nodes={visible.nodes}
          edges={visible.edges}
          selected={selected}
          disabled={disabled}
          worlds={worldNames}
          onSelect={select}
          onPosition={(id, x, y) =>
            save({
              ...web,
              nodes: web.nodes.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      x: Math.max(-100000, Math.min(100000, x)),
                      y: Math.max(-100000, Math.min(100000, y)),
                    }
                  : n,
              ),
            })
          }
          onView={(view) => save({ ...web, view })}
          onReset={() => setConfirm({ kind: 'layout', id: '' })}
        />
      )}
      {(node || edge) && (
        <section className="web-panel" aria-label="Selected graph item">
          <h2>{node ? node.label : edge?.label}</h2>
          {node ? (
            <>
              <p>
                {node.householdName || 'Standalone'} ·{' '}
                {node.age || 'Unknown life stage'} ·{' '}
                {worldNames.get(node.worldId) || 'No world'}
              </p>
              <button
                className="secondary-button"
                disabled={disabled}
                onClick={() => editNode(node)}
              >
                Edit selected character
              </button>
            </>
          ) : (
            edge && (
              <>
                <p>
                  {web.nodes.find((n) => n.id === edge.from)?.label} →{' '}
                  {web.nodes.find((n) => n.id === edge.to)?.label} ·{' '}
                  {edge.status} · {connectionGroup(edge)}
                </p>
                <p>{edge.description}</p>
                <p>{edge.notes}</p>
                <p>
                  Strength{' '}
                  {edge.strength === null
                    ? 'unspecified'
                    : `${edge.strength}/5`}
                  {edge.startDate ? ` · Since ${edge.startDate}` : ''}
                  {edge.tags.length ? ` · Tags: ${edge.tags.join(', ')}` : ''}
                </p>
                <button
                  className="secondary-button"
                  disabled={disabled}
                  onClick={() => editEdge(edge)}
                >
                  Edit selected connection
                </button>
              </>
            )
          )}
          <button className="text-button" onClick={() => setSelected('')}>
            Close selection
          </button>
        </section>
      )}
      <section className="web-panel" aria-label="Character list">
        <h2>Character list</h2>
        <p>
          Edit details and positions here without using the graph. Orphaned
          household characters retain history: keep them, detach them as
          standalone characters, or explicitly delete them and their
          connections. Reassign the household to restore its source link.
        </p>
        <div className="web-list">
          {visible.nodes.map((n) => (
            <article key={n.id}>
              <h3>{n.label}</h3>
              <p>
                {n.householdName || 'Standalone Sim'} ·{' '}
                {n.age || 'Unknown life stage'} ·{' '}
                {worldNames.get(n.worldId) || 'No world'}
              </p>
              {n.aesthetic && <p>{n.aesthetic}</p>}
              <p>
                Position: {Math.round(n.x)}, {Math.round(n.y)}
                {n.favorite ? ' · Favorite' : ''}
              </p>
              {orphans.has(n.id) && (
                <p className="status-badge">
                  Orphaned: household no longer assigned to this profile
                </p>
              )}
              <div className="web-toolbar">
                <button
                  className="secondary-button"
                  disabled={disabled}
                  onClick={() => editNode(n)}
                >
                  Edit character {n.label}
                </button>
                <button
                  className="text-button"
                  disabled={disabled}
                  onClick={() => setFilters({ focusId: n.id })}
                >
                  Focus on {n.label}
                </button>
                {orphans.has(n.id) && (
                  <button
                    className="secondary-button"
                    disabled={disabled}
                    onClick={() => {
                      const id = crypto.randomUUID();
                      save({
                        ...web,
                        nodes: web.nodes.map((old) =>
                          old.id === n.id
                            ? { ...old, id, householdId: '', memberId: '' }
                            : old,
                        ),
                        edges: web.edges.map((e) => ({
                          ...e,
                          from: e.from === n.id ? id : e.from,
                          to: e.to === n.id ? id : e.to,
                        })),
                        knownFamily: web.knownFamily?.map((pair) => ({
                          from: pair.from === n.id ? id : pair.from,
                          to: pair.to === n.id ? id : pair.to,
                        })),
                        filters: {
                          ...filters,
                          focusId:
                            filters.focusId === n.id ? id : filters.focusId,
                          simId: filters.simId === n.id ? id : filters.simId,
                        },
                      });
                    }}
                  >
                    Detach {n.label} as standalone
                  </button>
                )}
                <button
                  className="text-button danger-button"
                  disabled={disabled || (!!n.householdId && !orphans.has(n.id))}
                  onClick={() => setConfirm({ kind: 'node', id: n.id })}
                >
                  Delete character {n.label}
                </button>
              </div>
              {n.householdId && !orphans.has(n.id) && (
                <p className="helper-text">
                  To remove an assigned character, unassign its household first
                  in World Population.
                </p>
              )}
            </article>
          ))}
        </div>
        {!visible.nodes.length && (
          <p>No characters match. Assign households or add a standalone Sim.</p>
        )}
      </section>
      <section className="web-panel" aria-label="Relationship list">
        <h2>Relationship list</h2>
        <p>{visible.edges.length} visible connections</p>
        {visible.edges.map((e) => (
          <article className="relationship-list-item" key={e.id}>
            <h3>
              {web.nodes.find((n) => n.id === e.from)?.label} — {e.label} —{' '}
              {web.nodes.find((n) => n.id === e.to)?.label}
            </h3>
            <p>
              {CONNECTION_TYPES[e.type]} · {connectionGroup(e)} · {e.status} ·
              Strength {e.strength === null ? 'unspecified' : `${e.strength}/5`}
              {e.startDate ? ` · Since ${e.startDate}` : ''}
            </p>
            {e.description && <p>{e.description}</p>}
            {e.notes && <p>{e.notes}</p>}
            {e.tags.length > 0 && <p>Tags: {e.tags.join(', ')}</p>}
            <div className="web-toolbar">
              <button
                className="secondary-button"
                disabled={disabled}
                onClick={() => editEdge(e)}
              >
                Edit relationship {e.label}
              </button>
              <button
                className="text-button danger-button"
                disabled={disabled}
                onClick={() => setConfirm({ kind: 'edge', id: e.id })}
              >
                Delete relationship {e.label}
              </button>
            </div>
          </article>
        ))}
        {!visible.edges.length && (
          <p>
            No connections match. Create a relationship to connect characters.
          </p>
        )}
      </section>
      {confirm && (
        <Confirmation
          title={
            confirm.kind === 'layout'
              ? 'Reset character positions?'
              : confirm.kind === 'node'
                ? 'Delete character and connections?'
                : 'Delete relationship?'
          }
          description={
            confirm.kind === 'node'
              ? 'This removes this character and all attached connections from this profile. Original Casting Board data stays intact. Export a backup first.'
              : confirm.kind === 'layout'
                ? 'This rearranges every character in this profile. Existing saved positions will be replaced only after confirmation.'
                : 'This removes this connection from this profile. Keep an exported backup first.'
          }
          confirmLabel="Confirm web action"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const next =
              confirm.kind === 'node'
                ? removeNode(web, confirm.id)
                : confirm.kind === 'edge'
                  ? {
                      ...web,
                      edges: web.edges.filter((e) => e.id !== confirm.id),
                    }
                  : {
                      ...web,
                      nodes: web.nodes.map((n, i) => ({
                        ...n,
                        x: (i % 5) * 320,
                        y: Math.floor(i / 5) * 180,
                      })),
                      view: { ...web.view, zoom: 1, panX: 20, panY: 20 },
                    };
            if (save(next)) {
              setConfirm(null);
              setSelected('');
            }
          }}
        />
      )}
    </>
  );
}
