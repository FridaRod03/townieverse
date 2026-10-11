import { describe, expect, it } from 'vitest';
import {
  BOARD_KEY,
  LEGACY_BOARD_KEY,
  clone,
  exportJson,
  exportText,
  mergeBoards,
  normalizeTags,
  parseBoard,
  readBoard,
  sameContent,
  selectEntries,
  validateEntry,
} from '../src/utils/casting';
import { ENTRY_TYPES } from '../src/types/casting';
import { entryOf, householdEntry } from './casting-fixtures';
const envelope = (entries = [householdEntry()]) => ({
  schemaVersion: 1 as const,
  entries,
});
const filters = {
  search: '',
  type: '',
  world: '',
  status: '',
  favorites: false,
  tag: '',
  sort: 'newest' as const,
};
describe('casting snapshots and validation', () => {
  it.each(ENTRY_TYPES)(
    'round trips exact %s generated content and metadata',
    (type) => {
      const entry = entryOf(type);
      entry.tags = ['AltTownies'];
      entry.notes = 'My notes';
      entry.favorite = true;
      entry.status = 'Planning';
      expect(validateEntry(entry)).toBe(true);
      expect(parseBoard(exportJson([entry])).entries[0]).toEqual(entry);
    },
  );
  it('clones generated content and recognizes repeated saves', () => {
    const entry = householdEntry();
    const saved = clone(entry);
    entry.content.text = 'changed';
    expect(saved.content.text).not.toBe('changed');
    expect(sameContent(saved, 'household', saved.content)).toBe(true);
    expect(sameContent(saved, 'sim', saved.content)).toBe(false);
  });
  it('rejects malformed nested generated profiles', () => {
    const entry = householdEntry();
    (entry.content.snapshot.sims as Record<string, unknown>[])[0].personality =
      {};
    expect(validateEntry(entry)).toBe(false);
    expect(() => parseBoard(JSON.stringify(envelope([entry])))).toThrow();
  });
  it('rejects mismatched progress member IDs and roster counts', () => {
    const entry = householdEntry();
    entry.memberProgress.extra = 'Playing';
    expect(validateEntry(entry)).toBe(false);
    delete entry.memberProgress.extra;
    entry.content.members = [];
    expect(validateEntry(entry)).toBe(false);
  });
  it.each([
    'not json',
    '[]',
    'null',
    '{"schemaVersion":2,"entries":[]}',
    '{"schemaVersion":1,"entries":[{}]}',
  ])('rejects invalid or unsupported input %s', (raw) =>
    expect(() => parseBoard(raw)).toThrow(),
  );
  it.each(['__proto__', 'constructor', 'prototype'])(
    'rejects unsafe keys recursively: %s',
    (key) => {
      const raw = exportJson([householdEntry()]).replace(
        '"notes": ""',
        `"notes": "", "${key}": {"polluted": true}`,
      );
      expect(() => parseBoard(raw)).toThrow(/Unsafe/);
      expect(Object.prototype).not.toHaveProperty('polluted');
    },
  );
  it('rejects non-finite values, dates and invalid metadata', () => {
    const original = householdEntry();
    for (const patch of [
      { createdAt: 'wrong' },
      { status: 'Done' },
      { favorite: 'true' },
      { title: '' },
      { tags: ['Same', 'same'] },
      { notes: 'x'.repeat(10001) },
    ])
      expect(validateEntry({ ...original, ...patch })).toBe(false);
  });
  it('rejects duplicate IDs within one file', () => {
    const entry = householdEntry();
    expect(() => parseBoard(JSON.stringify(envelope([entry, entry])))).toThrow(
      /Duplicate IDs/,
    );
  });
  it('migrates a version zero envelope without rewriting snapshots', () => {
    const entry = householdEntry();
    expect(
      parseBoard(JSON.stringify({ schemaVersion: 0, entries: [entry] })),
    ).toEqual(envelope([entry]));
  });
  it('loads the legacy key and keeps its original raw value', () => {
    const raw = JSON.stringify({
      schemaVersion: 0,
      entries: [householdEntry()],
    });
    const result = readBoard({
      getItem: (key) => (key === LEGACY_BOARD_KEY ? raw : null),
    });
    expect(result.blocked).toBe(false);
    expect(result.raw).toBe(raw);
    expect(result.board.schemaVersion).toBe(1);
  });
  it('preserves corrupt and future-version raw data for recovery', () => {
    for (const raw of ['broken', '{"schemaVersion":99,"entries":[]}']) {
      const result = readBoard({
        getItem: (key) => (key === BOARD_KEY ? raw : null),
      });
      expect(result.blocked).toBe(true);
      expect(result.raw).toBe(raw);
      expect(result.notice).toMatch(/not been overwritten/);
    }
  });
  it('handles storage denial without pretending an empty board is safe', () => {
    expect(
      readBoard({
        getItem: () => {
          throw new Error('Denied');
        },
      }).blocked,
    ).toBe(true);
  });
  it('initializes genuinely empty storage', () => {
    expect(readBoard({ getItem: () => null })).toMatchObject({
      blocked: false,
      raw: null,
      board: { entries: [] },
    });
  });
});
describe('casting organization and export', () => {
  it('normalizes edited tags, including removing tags and case duplicates', () => {
    expect(normalizeTags(' #AltTownies, Windenburg, alttownies,, ')).toEqual([
      'AltTownies',
      'Windenburg',
    ]);
    expect(normalizeTags('')).toEqual([]);
  });
  it('searches notes, tags and original content, and intersects filters', () => {
    const entry = householdEntry();
    entry.notes = 'Special idea';
    entry.tags = ['Occult'];
    entry.favorite = true;
    entry.status = 'Planning';
    expect(
      selectEntries([entry], {
        ...filters,
        search: 'special',
        type: 'household',
        status: 'Planning',
        favorites: true,
        tag: 'Occult',
        world: entry.world,
      }),
    ).toEqual([entry]);
    expect(selectEntries([entry], { ...filters, search: 'missing' })).toEqual(
      [],
    );
    expect(selectEntries([entry], { ...filters, type: 'sim' })).toEqual([]);
  });
  it('sorts all four ways without mutating the board', () => {
    const a = householdEntry(),
      b = householdEntry();
    a.title = 'Zebra';
    b.title = 'Alpha';
    b.createdAt = b.modifiedAt = '2026-10-11T12:00:00.000Z';
    a.modifiedAt = '2026-10-12T12:00:00.000Z';
    const entries = [a, b];
    expect(selectEntries(entries, filters)[0]).toBe(b);
    expect(selectEntries(entries, { ...filters, sort: 'oldest' })[0]).toBe(a);
    expect(
      selectEntries(entries, { ...filters, sort: 'alphabetical' })[0],
    ).toBe(b);
    expect(selectEntries(entries, { ...filters, sort: 'modified' })[0]).toBe(a);
    expect(entries).toEqual([a, b]);
  });
  it('exports readable metadata and individual Sim statuses as TXT', () => {
    const entry = householdEntry();
    entry.notes = 'Do this next';
    entry.tags = ['CAS'];
    entry.favorite = true;
    entry.memberProgress[entry.content.members[0].id] = 'Created in CAS';
    const text = exportText([entry]);
    expect(text).toContain('Do this next');
    expect(text).toContain('Tags: CAS');
    expect(text).toContain('Favorite: Yes');
    expect(text).toContain('Created in CAS');
    expect(text).toContain(entry.content.text);
  });
  it('exports single entries and full boards with version and timestamp', () => {
    const entries = ENTRY_TYPES.map(entryOf);
    const parsed = JSON.parse(exportJson(entries, '2026-10-10T12:00:00.000Z'));
    expect(parsed).toMatchObject({
      format: 'townieverse-casting-board',
      schemaVersion: 1,
      exportedAt: '2026-10-10T12:00:00.000Z',
    });
    expect(parseBoard(JSON.stringify(parsed)).entries).toHaveLength(6);
  });
  it('merges new entries, skips exact ID duplicates, and preserves conflicting IDs', () => {
    const a = householdEntry(),
      b = entryOf('sim');
    const conflict = { ...clone(a), notes: 'Imported alternate' };
    const current = envelope([a]);
    const result = mergeBoards(current, envelope([a, b]));
    expect(result.entries).toHaveLength(2);
    const merged = mergeBoards(current, envelope([conflict]));
    expect(merged.entries).toHaveLength(2);
    expect(merged.entries[0]).toEqual(a);
    expect(merged.entries[1].id).not.toBe(a.id);
    expect(merged.entries[1].notes).toBe('Imported alternate');
    expect(current.entries).toEqual([a]);
  });
});
