import { useCasting } from '../hooks/CastingContext';
import { sameContent } from '../utils/casting';
import type { EntryType } from '../types/casting';
export function SaveActions({
  type,
  title,
  snapshot,
  text,
  world = '',
  members = [],
  labelSuffix = '',
}: {
  type: EntryType;
  title: string;
  snapshot: object;
  text: string;
  world?: string;
  members?: { id: string; name: string }[];
  labelSuffix?: string;
}) {
  const { board, save, update, blocked } = useCasting();
  const content = {
    snapshot: snapshot as Record<string, unknown>,
    text,
    members,
  };
  const existing = board.entries.find((e) => sameContent(e, type, content));
  return (
    <div className="save-actions">
      <button
        className="secondary-button"
        disabled={blocked}
        aria-label={
          labelSuffix
            ? `${existing ? 'Saved to Casting Board' : 'Save to Casting Board'} · ${labelSuffix}`
            : undefined
        }
        onClick={() => save(type, title, content, world)}
      >
        {existing ? 'Saved to Casting Board' : 'Save to Casting Board'}
      </button>
      <button
        className="secondary-button"
        disabled={blocked}
        aria-pressed={existing?.favorite ?? false}
        aria-label={
          labelSuffix
            ? `${existing?.favorite ? 'Unfavorite' : 'Favorite'} · ${labelSuffix}`
            : undefined
        }
        onClick={() =>
          existing
            ? update(existing.id, { favorite: !existing.favorite })
            : save(type, title, content, world, true)
        }
      >
        <span aria-hidden="true">{existing?.favorite ? '♥' : '♡'}</span>{' '}
        {existing?.favorite ? 'Unfavorite' : 'Favorite'}
      </button>
      <a className="text-button" href="#/casting">
        View Casting Board
      </a>
      {blocked && <span>Saved data needs recovery on the Casting Board.</span>}
    </div>
  );
}
