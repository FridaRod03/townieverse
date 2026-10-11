import type { CastingEntry, Progress } from '../types/casting';
import type { ContentCatalog } from '../types/models';
import type {
  PlanningData,
  SaveProfile,
  HouseholdAssignment,
} from '../types/planning';
import { clone, MAX_IMPORT_BYTES, validateEntry } from './casting';
import { validateWeb } from './web';
export const PLANNING_KEY = 'townieverse.planning.v1';
export const LEGACY_PLANNING_KEY = 'townieverse.planning.v0';
export const emptyPlanning = (): PlanningData => ({
  schemaVersion: 1,
  selectedProfileId: '',
  profiles: [],
});
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 100000): v is string =>
  typeof v === 'string' && v.length <= max;
const id = (v: unknown): v is string => text(v, 200) && !!v;
const date = (v: unknown) =>
  text(v) && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));
const notes = (v: unknown): v is Record<string, string> =>
  record(v) && Object.entries(v).every(([k, val]) => id(k) && text(val));
export function newProfile(
  name: string,
  now = new Date().toISOString(),
): SaveProfile {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: '',
    createdAt: now,
    modifiedAt: now,
    assignments: [],
    customLots: [],
    worldNotes: {},
    neighborhoodNotes: {},
  };
}
export function duplicateProfile(profile: SaveProfile): SaveProfile {
  const now = new Date().toISOString();
  return {
    ...clone(profile),
    id: crypto.randomUUID(),
    name: `${profile.name} · copy`.slice(0, 120),
    createdAt: now,
    modifiedAt: now,
  };
}
export function validateProfile(
  value: unknown,
  catalog: ContentCatalog,
): value is SaveProfile {
  if (
    !record(value) ||
    (value.relationshipWeb !== undefined &&
      !validateWeb(value.relationshipWeb)) ||
    !id(value.id) ||
    !text(value.name, 120) ||
    !value.name.trim() ||
    !text(value.description) ||
    !date(value.createdAt) ||
    !date(value.modifiedAt) ||
    !notes(value.worldNotes) ||
    !notes(value.neighborhoodNotes) ||
    !Array.isArray(value.assignments) ||
    value.assignments.length > 2000 ||
    !Array.isArray(value.customLots) ||
    value.customLots.length > 2000
  )
    return false;
  const worldIds = new Set(catalog.worlds.map((w) => w.id));
  const neighborhoodIds = new Set(
    catalog.worlds.flatMap((w) => w.neighborhoods.map((n) => n.id)),
  );
  if (
    Object.keys(value.worldNotes).some((k) => !worldIds.has(k)) ||
    Object.keys(value.neighborhoodNotes).some((k) => !neighborhoodIds.has(k))
  )
    return false;
  const lots = new Map<string, { worldId: string; neighborhoodId: string }>();
  for (const world of catalog.worlds)
    for (const lot of world.lots) lots.set(lot.id, lot);
  const customIds = new Set<string>();
  for (const lot of value.customLots) {
    if (
      !record(lot) ||
      !id(lot.id) ||
      customIds.has(lot.id) ||
      lots.has(lot.id) ||
      !text(lot.name, 120) ||
      !lot.name.trim() ||
      !id(lot.worldId) ||
      !worldIds.has(lot.worldId) ||
      !text(lot.neighborhoodId, 200) ||
      (!catalog.worlds
        .find((w) => w.id === lot.worldId)
        ?.neighborhoods.some((n) => n.id === lot.neighborhoodId) &&
        lot.neighborhoodId !== '') ||
      !text(lot.lotType, 120) ||
      !lot.lotType.trim() ||
      !text(lot.description)
    )
      return false;
    if (
      lot.size !== undefined &&
      (!record(lot.size) ||
        !Number.isInteger(lot.size.width) ||
        !Number.isInteger(lot.size.height) ||
        Number(lot.size.width) <= 0 ||
        Number(lot.size.height) <= 0 ||
        Number(lot.size.width) > 1000 ||
        Number(lot.size.height) > 1000)
    )
      return false;
    customIds.add(lot.id);
    lots.set(lot.id, {
      worldId: lot.worldId,
      neighborhoodId: lot.neighborhoodId,
    });
  }
  const householdIds = new Set<string>();
  for (const a of value.assignments) {
    if (
      !record(a) ||
      !id(a.householdId) ||
      householdIds.has(a.householdId) ||
      !validateEntry(a.household) ||
      a.household.type !== 'household' ||
      a.household.id !== a.householdId ||
      !id(a.worldId) ||
      !worldIds.has(a.worldId) ||
      !text(a.neighborhoodId, 200) ||
      !text(a.lotId, 200) ||
      !text(a.arrangement, 500) ||
      !text(a.notes) ||
      typeof a.placed !== 'boolean'
    )
      return false;
    const world = catalog.worlds.find((w) => w.id === a.worldId)!;
    if (
      a.neighborhoodId &&
      !world.neighborhoods.some((n) => n.id === a.neighborhoodId)
    )
      return false;
    const lot = lots.get(a.lotId);
    if (
      a.lotId &&
      (!lot ||
        lot.worldId !== a.worldId ||
        lot.neighborhoodId !== a.neighborhoodId)
    )
      return false;
    householdIds.add(a.householdId);
  }
  return true;
}
export function parsePlanning(
  raw: string,
  catalog: ContentCatalog,
): PlanningData {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    throw new Error('Planning backup exceeds 10 MB.');
  const value: unknown = JSON.parse(raw);
  if (record(value) && value.format === 'townieverse-casting-board')
    throw new Error(
      'Use Casting Board to import a legacy Casting Board backup.',
    );
  const safe = (v: unknown, depth = 0): boolean =>
    depth <= 50 &&
    (v === null ||
      typeof v === 'string' ||
      typeof v === 'boolean' ||
      (typeof v === 'number' && Number.isFinite(v)) ||
      (Array.isArray(v) &&
        v.length <= 20000 &&
        v.every((x) => safe(x, depth + 1))) ||
      (record(v) &&
        Object.entries(v).every(
          ([k, x]) =>
            !['__proto__', 'prototype', 'constructor'].includes(k) &&
            safe(x, depth + 1),
        )));
  if (
    !safe(value) ||
    !record(value) ||
    ![0, 1].includes(value.schemaVersion as number) ||
    !Array.isArray(value.profiles) ||
    value.profiles.length > 100 ||
    !value.profiles.every((p) => validateProfile(p, catalog)) ||
    new Set(value.profiles.map((p) => p.id)).size !== value.profiles.length
  )
    throw new Error(
      'Invalid or unsupported planning backup. Existing data is unchanged.',
    );
  if (value.format !== undefined && value.format !== 'townieverse-planning')
    throw new Error(
      'Use Casting Board to import a legacy Casting Board backup.',
    );
  // v0 had no selected-profile field. v1 preserves every profile and snapshot.
  const selected =
    value.schemaVersion === 0
      ? (value.profiles[0]?.id ?? '')
      : value.selectedProfileId;
  if (
    !text(selected, 200) ||
    (selected !== '' && !value.profiles.some((p) => p.id === selected)) ||
    (value.profiles.length > 0 && !selected)
  )
    throw new Error('Invalid selected profile.');
  return {
    schemaVersion: 1,
    selectedProfileId: selected,
    profiles: clone(value.profiles),
  };
}
export function mergePlanning(
  current: PlanningData,
  incoming: PlanningData,
): PlanningData {
  const profiles = clone(current.profiles);
  for (const p of incoming.profiles) {
    const existing = profiles.find((x) => x.id === p.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(p)) continue;
    profiles.push(
      existing
        ? {
            ...clone(p),
            id: crypto.randomUUID(),
            name: `${p.name} · imported`.slice(0, 120),
          }
        : clone(p),
    );
  }
  return {
    ...current,
    profiles,
    selectedProfileId: current.selectedProfileId || profiles[0]?.id || '',
  };
}
export function exportPlanning(
  data: PlanningData,
  entries: readonly CastingEntry[],
  profileId?: string,
): string {
  const profiles = clone(
    data.profiles.filter((p) => !profileId || p.id === profileId),
  );
  for (const p of profiles)
    for (const a of p.assignments)
      a.household = clone(resolveHousehold(a, entries));
  return JSON.stringify(
    {
      format: 'townieverse-planning',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      selectedProfileId: profileId ?? data.selectedProfileId,
      profiles,
    },
    null,
    2,
  );
}
export function resolveHousehold(
  a: HouseholdAssignment,
  entries: readonly CastingEntry[],
): CastingEntry {
  const live = entries.find(
    (e) => e.id === a.householdId && e.type === 'household',
  );
  // Never substitute a different snapshot after an ID-conflicting board replacement.
  return live &&
    JSON.stringify(live.content) === JSON.stringify(a.household.content)
    ? live
    : a.household;
}
export function assignHousehold(
  profile: SaveProfile,
  entry: CastingEntry,
  patch: Omit<HouseholdAssignment, 'householdId' | 'household'>,
): SaveProfile {
  const assignment = {
    ...patch,
    householdId: entry.id,
    household: clone(entry),
  };
  return {
    ...profile,
    modifiedAt: new Date().toISOString(),
    assignments: [
      ...profile.assignments.filter((a) => a.householdId !== entry.id),
      assignment,
    ],
  };
}
const created = (s: Progress) =>
  ['Created in CAS', 'Placed in World', 'Playing'].includes(s);
const placed = (s: Progress) => ['Placed in World', 'Playing'].includes(s);
export function populationStats(
  assignments: readonly HouseholdAssignment[],
  entries: readonly CastingEntry[],
) {
  const sims = new Map<string, { created: boolean; placed: boolean }>();
  for (const a of assignments) {
    const entry = resolveHousehold(a, entries);
    for (const member of entry.content.members) {
      const status = entry.memberProgress[member.id] ?? 'Idea';
      const previous = sims.get(member.id);
      sims.set(member.id, {
        created: !!previous?.created || created(status),
        placed: !!previous?.placed || placed(status),
      });
    }
  }
  return {
    households: assignments.length,
    sims: sims.size,
    created: [...sims.values()].filter((s) => s.created).length,
    placedSims: [...sims.values()].filter((s) => s.placed).length,
    placedHouseholds: assignments.filter((a) => a.placed).length,
    awaiting: assignments.filter((a) => !a.placed).length,
    neighborhoods: new Set(
      assignments.map((a) => a.neighborhoodId).filter(Boolean),
    ).size,
  };
}
export function populationStatus(
  stats: ReturnType<typeof populationStats>,
): 'empty' | 'partial' | 'completed' {
  return !stats.households
    ? 'empty'
    : stats.placedHouseholds === stats.households &&
        stats.placedSims === stats.sims
      ? 'completed'
      : 'partial';
}
