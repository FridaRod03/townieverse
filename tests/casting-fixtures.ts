import { generateConcept } from '../src/generators/concepts';
import {
  starterCatalog,
  starterSimData,
  starterTwists,
} from '../src/data/starter';
import { defaultSettings } from '../src/utils/preferences';
import { createSeededRandom } from '../src/utils/random';
import { aestheticText, conceptText, simText } from '../src/utils/resultText';
import { newEntry } from '../src/utils/casting';
import type { CastingEntry, EntryType } from '../src/types/casting';
export function householdEntry(): CastingEntry {
  const result = generateConcept(
    starterCatalog,
    starterSimData,
    starterTwists,
    defaultSettings(),
    { categories: [], finance: '', living: '' },
    {
      seed: 'casting-test',
      iteration: 0,
      random: (field) => createSeededRandom(field),
    },
  );
  if (!result.success) throw new Error(result.error.message);
  const concept = result.value;
  return newEntry(
    'household',
    'Test household',
    {
      snapshot: concept as unknown as Record<string, unknown>,
      text: conceptText(concept),
      members: concept.sims.map((s) => ({ id: s.id, name: s.name })),
    },
    concept.world.name,
    false,
    '2026-10-10T12:00:00.000Z',
  );
}
export function entryOf(type: EntryType): CastingEntry {
  const base = householdEntry();
  const snapshot = base.content.snapshot;
  if (type === 'household') return base;
  const sim = (snapshot.sims as Parameters<typeof simText>[0][])[0];
  const style = snapshot.aesthetic as Parameters<typeof aestheticText>[0];
  const content =
    type === 'sim'
      ? {
          snapshot: { sim, aesthetic: style },
          text: simText(sim),
          members: [{ id: sim.id, name: sim.name }],
        }
      : type === 'aesthetic'
        ? {
            snapshot: { styles: [style] },
            text: aestheticText(style),
            members: [],
          }
        : type === 'world'
          ? {
              snapshot: {
                world: snapshot.world,
                neighborhood: snapshot.neighborhood,
                lot: snapshot.lot,
              },
              text: 'Saved world',
              members: [],
            }
          : type === 'relationship'
            ? {
                snapshot: {
                  relationship: {
                    id: 'rel',
                    prompt: starterCatalog.relationships[0],
                    fromId: 'a',
                    toId: 'b',
                  },
                  from: 'A',
                  to: 'B',
                },
                text: 'A and B',
                members: [],
              }
            : {
                snapshot: {
                  story: { ...starterTwists[0], participantIds: ['adult'] },
                  name: 'Adult participant',
                  age: 'adult',
                },
                text: 'Adult storyline',
                members: [],
              };
  return newEntry(type, type, content, '', false, '2026-10-10T12:00:00.000Z');
}
