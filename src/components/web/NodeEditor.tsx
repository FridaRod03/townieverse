import { useState } from 'react';
import { WEB_AGES } from '../../types/web';
import type { CharacterNode } from '../../types/web';
export function NodeEditor({
  node,
  worlds,
  onSave,
  onCancel,
}: {
  node: CharacterNode;
  worlds: { id: string; name: string }[];
  onSave: (n: CharacterNode) => boolean;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(node);
  const patch = (p: Partial<CharacterNode>) =>
    setDraft((n) => ({ ...n, ...p }));
  return (
    <form
      className="web-panel"
      aria-label="Character editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSave({ ...draft, label: draft.label.trim() })) onCancel();
      }}
    >
      <h2>{node.label ? 'Edit character' : 'Add standalone Sim'}</h2>
      <p>
        These display details are separate from the original Casting Board
        snapshot. Unknown life stages cannot be used for romance.
      </p>
      <div className="web-form-grid">
        <label>
          Display label
          <input
            required
            maxLength={120}
            value={draft.label}
            onChange={(e) => patch({ label: e.target.value })}
          />
        </label>
        <label>
          Life stage
          <select
            value={draft.age}
            disabled={!!node.householdId}
            onChange={(e) =>
              patch({ age: e.target.value as CharacterNode['age'] })
            }
          >
            <option value="">Unknown</option>
            {WEB_AGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          Aesthetic (optional)
          <input
            maxLength={2000}
            value={draft.aesthetic}
            onChange={(e) => patch({ aesthetic: e.target.value })}
          />
        </label>
        {!node.householdId && (
          <>
            <label>
              Household display name (optional)
              <input
                maxLength={2000}
                value={draft.householdName}
                onChange={(e) => patch({ householdName: e.target.value })}
              />
            </label>
            <label>
              World (optional)
              <select
                value={draft.worldId}
                onChange={(e) => patch({ worldId: e.target.value })}
              >
                <option value="">Unspecified</option>
                {worlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label>
          Accent color
          <input
            type="color"
            value={draft.color || '#9c215e'}
            onChange={(e) => patch({ color: e.target.value })}
          />
        </label>
        <label>
          Icon or initials (optional)
          <input
            maxLength={8}
            value={draft.icon}
            onChange={(e) => patch({ icon: e.target.value })}
          />
        </label>
        <label>
          Horizontal position
          <input
            type="number"
            min={-100000}
            max={100000}
            required
            value={draft.x}
            onChange={(e) => patch({ x: Number(e.target.value) })}
          />
        </label>
        <label>
          Vertical position
          <input
            type="number"
            min={-100000}
            max={100000}
            required
            value={draft.y}
            onChange={(e) => patch({ y: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="web-check">
        <input
          type="checkbox"
          checked={draft.favorite}
          onChange={(e) => patch({ favorite: e.target.checked })}
        />
        Favorite character
      </label>
      <div className="inline-actions">
        <button className="secondary-button">Save character</button>
        <button type="button" className="text-button" onClick={onCancel}>
          Cancel character editing
        </button>
      </div>
    </form>
  );
}
