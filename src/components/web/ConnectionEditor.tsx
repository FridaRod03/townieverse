import { useState } from 'react';
import { CONNECTION_TYPES } from '../../types/web';
import type { Connection, RelationshipWeb } from '../../types/web';
import { connectionError, connectionGroup } from '../../utils/web';
export function ConnectionEditor({
  web,
  edge,
  onSave,
  onCancel,
}: {
  web: RelationshipWeb;
  edge: Connection;
  onSave: (e: Connection) => boolean;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(edge),
    [error, setError] = useState('');
  const patch = (p: Partial<Connection>) => setDraft((d) => ({ ...d, ...p }));
  return (
    <form
      className="web-panel"
      aria-label="Connection editor"
      onSubmit={(e) => {
        e.preventDefault();
        const issue = connectionError(web, draft);
        if (issue) {
          setError(issue);
          return;
        }
        if (onSave(draft)) onCancel();
      }}
    >
      <h2>
        {web.edges.some((e) => e.id === edge.id)
          ? 'Edit connection'
          : 'Create connection'}
      </h2>
      <p>
        For parent / child and grandparent / grandchild, select the ancestor
        first. Strength is a story-planning scale, independent of game values.
      </p>
      <div className="web-form-grid">
        {(['from', 'to'] as const).map((key, index) => (
          <label key={key}>
            {index === 0 ? 'First Sim' : 'Second Sim'}
            <select
              required
              value={draft[key]}
              onChange={(e) => patch({ [key]: e.target.value })}
            >
              <option value="">Choose a Sim</option>
              {web.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} · {n.householdName || 'Standalone'} ·{' '}
                  {n.id.slice(-8)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Relationship type
          <select
            value={draft.type}
            onChange={(e) => {
              const type = e.target.value as Connection['type'];
              patch({
                type,
                label: CONNECTION_TYPES[type],
                status: ['ex', 'former-friends'].includes(type)
                  ? 'ended'
                  : draft.status,
                adultConsent: false,
              });
            }}
          >
            {Object.entries(CONNECTION_TYPES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Relationship label
          <input
            required
            maxLength={120}
            value={draft.label}
            onChange={(e) => patch({ label: e.target.value })}
          />
        </label>
        {draft.type === 'custom' && (
          <label>
            Custom relationship category
            <select
              value={draft.customGroup}
              onChange={(e) =>
                patch({
                  customGroup: e.target.value as Connection['customGroup'],
                  adultConsent: false,
                })
              }
            >
              {['Family', 'Romance', 'Friendship', 'Conflict', 'Other'].map(
                (g) => (
                  <option key={g}>{g}</option>
                ),
              )}
            </select>
          </label>
        )}
        <label>
          Relationship status
          <select
            value={draft.status}
            onChange={(e) =>
              patch({ status: e.target.value as Connection['status'] })
            }
          >
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="planned">Planned</option>
          </select>
        </label>
        <label>
          Relationship strength
          <select
            value={draft.strength ?? ''}
            onChange={(e) =>
              patch({
                strength: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          >
            <option value="">Unspecified</option>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
          />
        </label>
        <label>
          Tags (comma separated)
          <input
            value={draft.tags.join(', ')}
            maxLength={2000}
            onChange={(e) =>
              patch({
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 30),
              })
            }
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          maxLength={100000}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </label>
      <label>
        Relationship notes
        <textarea
          maxLength={100000}
          value={draft.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>
      {connectionGroup(draft) === 'Romance' && (
        <label className="web-check">
          <input
            type="checkbox"
            checked={draft.adultConsent}
            onChange={(e) => patch({ adultConsent: e.target.checked })}
          />
          Both Sims are consenting adults (Young Adult, Adult or Elder)
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="inline-actions">
        <button className="secondary-button" type="submit">
          Save connection
        </button>
        <button className="text-button" type="button" onClick={onCancel}>
          Cancel connection editing
        </button>
      </div>
    </form>
  );
}
