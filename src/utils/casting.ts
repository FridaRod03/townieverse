import { ENTRY_TYPES, PROGRESS } from '../types/casting';
import { LIFE_STAGES } from '../types/models';
import type {
  CastingBoardData,
  CastingEntry,
  CastingExport,
  EntryType,
  SavedContent,
} from '../types/casting';

export const BOARD_KEY = 'townieverse.casting-board.v1';
export const LEGACY_BOARD_KEY = 'townieverse.casting-board.v0';
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const empty = (): CastingBoardData => ({ schemaVersion: 1, entries: [] });
const record = (value: unknown): value is Record<string, unknown> =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
const string = (v: unknown, max = 100000) =>
  typeof v === 'string' && v.length <= max;
const strings = (v: unknown, max = 1000): v is string[] =>
  Array.isArray(v) && v.length <= max && v.every((item) => string(item));
const date = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d\d-\d\dT/.test(v) &&
  Number.isFinite(Date.parse(v));
const status = (v: unknown) => PROGRESS.includes(v as never);
const named = (v: unknown) =>
  record(v) && string(v.id, 200) && !!v.id && string(v.name, 500) && !!v.name;
function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 50) return false;
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value))
    return value.length <= 20000 && value.every((v) => safeJson(v, depth + 1));
  return (
    record(value) &&
    Object.entries(value).every(
      ([key, v]) =>
        !['__proto__', 'prototype', 'constructor'].includes(key) &&
        safeJson(v, depth + 1),
    )
  );
}
function contentEntry(v: unknown): boolean {
  return (
    named(v) &&
    record(v) &&
    string(v.description) &&
    ['official', 'custom', 'roleplay'].includes(v.origin as string) &&
    strings(v.requiredPacks) &&
    record(v.verification) &&
    ['verified', 'unverified', 'not-applicable'].includes(
      v.verification.status as string,
    ) &&
    strings(v.verification.sources) &&
    strings(v.categories) &&
    strings(v.tags) &&
    typeof v.weight === 'number' &&
    v.weight > 0 &&
    typeof v.commonness === 'number' &&
    v.commonness >= 0 &&
    v.commonness <= 1 &&
    typeof v.adultOnly === 'boolean' &&
    strings(v.themes) &&
    v.themes.every((theme) =>
      ['adult-romance', 'crime', 'substance-use'].includes(theme),
    ) &&
    (v.allowedAges === undefined ||
      (strings(v.allowedAges) &&
        v.allowedAges.every((age) => LIFE_STAGES.includes(age as never))))
  );
}
const list = (v: unknown, check: (x: unknown) => boolean) =>
  Array.isArray(v) && v.every(check);
function sim(v: unknown): boolean {
  if (
    !named(v) ||
    !record(v) ||
    !['child', 'teen', 'young-adult', 'adult', 'elder'].includes(
      v.age as string,
    ) ||
    !record(v.personality)
  )
    return false;
  return (
    contentEntry(v.aspiration) &&
    record(v.aspiration) &&
    strings(v.aspiration.traitRequirements) &&
    contentEntry(v.career) &&
    record(v.career) &&
    ['career', 'part-time', 'occupation', 'roleplay'].includes(
      v.career.kind as string,
    ) &&
    contentEntry(v.personality.profile) &&
    list(
      v.personality.traits,
      (trait) =>
        contentEntry(trait) && record(trait) && strings(trait.conflictsWith),
    ) &&
    strings(v.personality.hobbies) &&
    strings(v.personality.likes) &&
    strings(v.personality.dislikes) &&
    string(v.personality.personalGoal) &&
    string(v.personality.flaw) &&
    list(v.storylines, contentEntry)
  );
}
function style(v: unknown): boolean {
  return (
    contentEntry(v) &&
    record(v) &&
    string(v.category, 100) &&
    strings(v.casSuggestions) &&
    strings(v.worldAssociations) &&
    strings(v.suggestedAges) &&
    v.suggestedAges.every((age) => LIFE_STAGES.includes(age as never)) &&
    ['aliases', 'hairSuggestions', 'makeupSuggestions', 'accessories'].every(
      (key) => v[key] === undefined || strings(v[key]),
    ) &&
    (v.culturalContext === undefined || string(v.culturalContext)) &&
    typeof v.wildcard === 'boolean'
  );
}
function neighborhood(v: unknown): boolean {
  return contentEntry(v) && record(v) && string(v.worldId, 200);
}
function lot(v: unknown): boolean {
  return (
    neighborhood(v) &&
    record(v) &&
    string(v.neighborhoodId, 200) &&
    string(v.lotType, 100) &&
    (v.size === undefined ||
      (record(v.size) &&
        Number.isInteger(v.size.width) &&
        Number.isInteger(v.size.height) &&
        (v.size.width as number) > 0 &&
        (v.size.height as number) > 0))
  );
}
function world(v: unknown): boolean {
  return (
    contentEntry(v) &&
    record(v) &&
    ['residential', 'destination', 'special'].includes(v.worldType as string) &&
    list(v.neighborhoods, neighborhood) &&
    list(v.lots, lot)
  );
}
function snapshot(type: EntryType, v: Record<string, unknown>): boolean {
  switch (type) {
    case 'household':
      return (
        world(v.world) &&
        record(v.household) &&
        string(v.household.id, 200) &&
        string(v.household.backstory) &&
        [
          'singles',
          'couples',
          'families',
          'single-parents',
          'blended-families',
          'roommates',
          'multigenerational',
          'elders',
          'occult',
          'adult-only',
        ].includes(v.household.category as string) &&
        string(v.household.promptId, 200) &&
        string(v.household.financialSituation) &&
        string(v.household.livingArrangement) &&
        typeof v.household.adultOnly === 'boolean' &&
        list(v.household.storylines, contentEntry) &&
        Array.isArray(v.household.members) &&
        v.household.members.length > 0 &&
        v.household.members.length <= 8 &&
        list(
          v.household.members,
          (member) =>
            named(member) &&
            record(member) &&
            LIFE_STAGES.includes(member.age as never) &&
            string(member.occult, 100) &&
            string(member.slotId, 200) &&
            strings(member.requiredPacks),
        ) &&
        list(
          v.household.dynamics,
          (x) =>
            record(x) &&
            string(x.fromId, 200) &&
            string(x.toId, 200) &&
            string(x.kind, 100),
        ) &&
        list(v.sims, sim) &&
        Array.isArray(v.sims) &&
        v.sims.length === v.household.members.length &&
        v.sims.every(
          (profile) =>
            v.household &&
            record(v.household) &&
            Array.isArray(v.household.members) &&
            v.household.members.some(
              (member) =>
                record(member) &&
                record(profile) &&
                member.id === profile.id &&
                member.age === profile.age,
            ),
        ) &&
        style(v.aesthetic) &&
        typeof v.seed === 'string' &&
        Number.isInteger(v.iteration) &&
        (v.twist === undefined || contentEntry(v.twist))
      );
    case 'sim':
      return (
        sim(v.sim) &&
        (v.aesthetic === undefined ||
          v.aesthetic === null ||
          style(v.aesthetic))
      );
    case 'aesthetic':
      return (
        Array.isArray(v.styles) &&
        v.styles.length >= 1 &&
        v.styles.length <= 2 &&
        v.styles.every(style)
      );
    case 'relationship':
      return (
        record(v.relationship) &&
        contentEntry(v.relationship.prompt) &&
        string(v.relationship.fromId, 200) &&
        string(v.relationship.toId, 200) &&
        string(v.from, 500) &&
        string(v.to, 500)
      );
    case 'storyline':
      return (
        contentEntry(v.story) &&
        record(v.story) &&
        strings(v.story.participantIds) &&
        string(v.name, 500) &&
        ['young-adult', 'adult', 'elder'].includes(v.age as string)
      );
    case 'world':
      return (
        world(v.world) &&
        (v.neighborhood === undefined || neighborhood(v.neighborhood)) &&
        (v.lot === undefined || lot(v.lot)) &&
        (v.aesthetic === undefined || style(v.aesthetic))
      );
  }
}
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function validateEntry(v: unknown): v is CastingEntry {
  if (
    !record(v) ||
    !safeJson(v) ||
    !string(v.id, 200) ||
    !v.id ||
    !ENTRY_TYPES.includes(v.type as never) ||
    !string(v.title, 120) ||
    !(v.title as string).trim() ||
    !date(v.createdAt) ||
    !date(v.modifiedAt) ||
    Date.parse(v.modifiedAt as string) < Date.parse(v.createdAt as string) ||
    !string(v.notes, 10000) ||
    !strings(v.tags, 30) ||
    v.tags.some((t) => !t.trim() || t.length > 40) ||
    new Set(v.tags.map((t) => t.toLowerCase())).size !== v.tags.length ||
    !string(v.world, 120) ||
    !status(v.status) ||
    typeof v.favorite !== 'boolean' ||
    !record(v.memberProgress) ||
    !record(v.content) ||
    !record(v.content.snapshot) ||
    !string(v.content.text, 500000) ||
    !list(v.content.members, named)
  )
    return false;
  if (!snapshot(v.type as EntryType, v.content.snapshot)) return false;
  const members = v.content.members as { id: string; name: string }[];
  if (
    new Set(members.map((m) => m.id)).size !== members.length ||
    members.some(
      (m) => !status((v.memberProgress as Record<string, unknown>)[m.id]),
    ) ||
    Object.keys(v.memberProgress).some(
      (id) => !members.some((m) => m.id === id),
    )
  )
    return false;
  const generatedMembers =
    v.type === 'household'
      ? (v.content.snapshot.sims as { id: string; name: string }[])
      : v.type === 'sim'
        ? [v.content.snapshot.sim as { id: string; name: string }]
        : [];
  return (
    members.length === generatedMembers.length &&
    members.every((m) =>
      generatedMembers.some((g) => g.id === m.id && g.name === m.name),
    )
  );
}
export function parseBoard(raw: string): CastingBoardData {
  if (new Blob([raw]).size > MAX_IMPORT_BYTES)
    throw new Error('This file exceeds the 10 MB import limit.');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      'This is not valid JSON. Your existing board is unchanged.',
    );
  }
  if (!record(value) || !safeJson(value))
    throw new Error('Unsafe or malformed JSON structure.');
  // Explicit legacy envelope migration; entries must still pass current validation.
  if (value.schemaVersion === 0 && Array.isArray(value.entries))
    value = { ...value, schemaVersion: 1 };
  if (!record(value) || value.schemaVersion !== 1)
    throw new Error(
      'Unsupported schema version. Keep this file for recovery with a compatible Townieverse version.',
    );
  if (
    value.format !== undefined &&
    value.format !== 'townieverse-casting-board'
  )
    throw new Error('This is not a Townieverse Casting Board backup.');
  if (value.format !== undefined && !date(value.exportedAt))
    throw new Error('This backup has an invalid export timestamp.');
  if (
    !Array.isArray(value.entries) ||
    value.entries.length > 2000 ||
    !value.entries.every(validateEntry)
  )
    throw new Error(
      'Invalid saved entry or metadata. Your existing board is unchanged.',
    );
  if (new Set(value.entries.map((e) => e.id)).size !== value.entries.length)
    throw new Error(
      'Duplicate IDs inside the import. Resolve them before importing.',
    );
  return clone({ schemaVersion: 1, entries: value.entries });
}
export function readBoard(storage: Pick<Storage, 'getItem'>): {
  board: CastingBoardData;
  raw: string | null;
  blocked: boolean;
  notice: string;
} {
  let raw: string | null = null;
  try {
    raw = storage.getItem(BOARD_KEY) ?? storage.getItem(LEGACY_BOARD_KEY);
    if (raw === null)
      return { board: empty(), raw: null, blocked: false, notice: '' };
    return { board: parseBoard(raw), raw, blocked: false, notice: '' };
  } catch (error) {
    return {
      board: empty(),
      raw,
      blocked: true,
      notice: `Saved data could not be loaded. ${error instanceof Error ? error.message : 'Browser storage is unavailable.'} The original storage has not been overwritten.`,
    };
  }
}
export function newEntry(
  type: EntryType,
  title: string,
  content: SavedContent,
  worldName = '',
  favorite = false,
  now = new Date().toISOString(),
): CastingEntry {
  const entry: CastingEntry = {
    id: crypto.randomUUID(),
    type,
    title: title.slice(0, 120) || 'Untitled creation',
    content: clone(content),
    world: worldName,
    notes: '',
    tags: [],
    status: 'Idea',
    memberProgress: Object.fromEntries(
      content.members.map((m) => [m.id, 'Idea']),
    ),
    favorite,
    createdAt: now,
    modifiedAt: now,
  };
  if (!validateEntry(entry))
    throw new Error(
      'This result cannot be saved because its snapshot is invalid.',
    );
  return entry;
}
export const sameContent = (
  entry: CastingEntry,
  type: EntryType,
  content: SavedContent,
) =>
  entry.type === type &&
  JSON.stringify(entry.content) === JSON.stringify(clone(content));
export function mergeBoards(
  current: CastingBoardData,
  incoming: CastingBoardData,
): CastingBoardData {
  const entries = clone(current.entries);
  for (const entry of incoming.entries) {
    const existing = entries.find((e) => e.id === entry.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(entry))
      continue;
    const next = clone(entry);
    if (existing) next.id = crypto.randomUUID();
    entries.push(next);
  }
  if (entries.length > 2000)
    throw new Error(
      'The board supports at most 2,000 entries. Export and organize backups before adding more.',
    );
  return { schemaVersion: 1, entries };
}
export function exportJson(
  entries: CastingEntry[],
  now = new Date().toISOString(),
): string {
  const value: CastingExport = {
    format: 'townieverse-casting-board',
    schemaVersion: 1,
    exportedAt: now,
    entries: clone(entries),
  };
  return JSON.stringify(value, null, 2) + '\n';
}
export function exportText(entries: CastingEntry[]): string {
  return (
    [
      'TOWNIEVERSE · CASTING BOARD',
      'Saved in this browser; export JSON for a restorable backup.',
      ...entries.map((e) =>
        [
          e.title,
          `Type: ${e.type} · Status: ${e.status} · Favorite: ${e.favorite ? 'Yes' : 'No'}`,
          `World association: ${e.world || 'None'}`,
          `Tags: ${e.tags.join(', ') || 'None'}`,
          `Created: ${e.createdAt}\nModified: ${e.modifiedAt}`,
          `Notes: ${e.notes || 'None'}`,
          ...e.content.members.map(
            (m) => `${m.name}: ${e.memberProgress[m.id]}`,
          ),
          'ORIGINAL GENERATED CONTENT',
          e.content.text,
        ].join('\n'),
      ),
    ].join('\n\n---\n\n') + '\n'
  );
}
export function download(
  text: string,
  stem: string,
  extension: 'json' | 'txt',
) {
  const url = URL.createObjectURL(
    new Blob([text], {
      type:
        extension === 'json' ? 'application/json' : 'text/plain;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `townieverse-${stem}-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function normalizeTags(raw: string): string[] {
  const tags = new Map<string, string>();
  for (const tag of raw
    .split(',')
    .map((t) => t.trim().replace(/^#+/, ''))
    .filter(Boolean))
    if (!tags.has(tag.toLowerCase())) tags.set(tag.toLowerCase(), tag);
  return [...tags.values()];
}
export interface BoardFilters {
  search: string;
  type: string;
  world: string;
  status: string;
  favorites: boolean;
  tag: string;
  sort: 'newest' | 'oldest' | 'alphabetical' | 'modified';
}
export function selectEntries(entries: CastingEntry[], filters: BoardFilters) {
  const query = filters.search.trim().toLowerCase();
  return entries
    .filter(
      (e) =>
        (!query ||
          [e.title, e.notes, e.world, ...e.tags, e.content.text]
            .join(' ')
            .toLowerCase()
            .includes(query)) &&
        (!filters.type || e.type === filters.type) &&
        (!filters.world || e.world === filters.world) &&
        (!filters.status || e.status === filters.status) &&
        (!filters.favorites || e.favorite) &&
        (!filters.tag || e.tags.includes(filters.tag)),
    )
    .sort((a, b) =>
      filters.sort === 'alphabetical'
        ? a.title.localeCompare(b.title)
        : filters.sort === 'oldest'
          ? a.createdAt.localeCompare(b.createdAt)
          : filters.sort === 'modified'
            ? b.modifiedAt.localeCompare(a.modifiedAt)
            : b.createdAt.localeCompare(a.createdAt),
    );
}
