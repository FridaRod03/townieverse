import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { catalog as activeCatalog } from '../src/data/library';
import { householdEntry } from './casting-fixtures';
import { clone, exportJson, parseBoard } from '../src/utils/casting';
import {
  assignHousehold,
  duplicateProfile,
  emptyPlanning,
  exportPlanning,
  mergePlanning,
  newProfile,
  parsePlanning,
  populationStats,
  populationStatus,
  resolveHousehold,
  validateProfile,
} from '../src/utils/planning';
import type { PlanningData } from '../src/types/planning';
const world = activeCatalog.worlds.find((w) => w.name === 'Willow Creek')!;
const placement = () => ({
  worldId: world.id,
  neighborhoodId: '',
  lotId: '',
  arrangement: 'Shared rental',
  notes: 'Keep the garden',
  placed: false,
});
const plan = () => {
  const p = assignHousehold(
    newProfile('Blank Save'),
    householdEntry(),
    placement(),
  );
  return {
    schemaVersion: 1,
    selectedProfileId: p.id,
    profiles: [p],
  } as PlanningData;
};
describe('planning profiles, identity and statistics', () => {
  it('creates unique named profiles without inventing assignments', () => {
    const a = newProfile('  Blank Save  '),
      b = newProfile('Blank Save');
    expect(a.id).not.toBe(b.id);
    expect(a.name).toBe('Blank Save');
    expect(a.assignments).toEqual([]);
    expect(validateProfile(a, activeCatalog)).toBe(true);
  });
  it('duplicates independently, preserving notes, lots, assignments and snapshots', () => {
    const p = plan().profiles[0];
    p.worldNotes[world.id] = 'Garden';
    const copy = duplicateProfile(p);
    expect(copy.id).not.toBe(p.id);
    expect(copy.assignments).toEqual(p.assignments);
    copy.assignments[0].notes = 'Changed';
    expect(p.assignments[0].notes).toBe('Keep the garden');
  });
  it('updates an assignment by saved household ID rather than title', () => {
    const p = plan().profiles[0],
      e = p.assignments[0].household;
    const changed = assignHousehold(p, e, {
      ...placement(),
      neighborhoodId: world.neighborhoods[0].id,
      placed: true,
    });
    expect(changed.assignments).toHaveLength(1);
    expect(changed.assignments[0].placed).toBe(true);
    expect(changed.assignments[0].household.content).toEqual(e.content);
    expect(p.assignments[0].placed).toBe(false);
  });
  it('keeps same-name households distinct and deduplicates shared member IDs', () => {
    const e = householdEntry(),
      second = { ...clone(e), id: crypto.randomUUID() };
    let p = assignHousehold(newProfile('Same names'), e, placement());
    p = assignHousehold(p, second, placement());
    const stats = populationStats(p.assignments, []);
    expect(stats.households).toBe(2);
    expect(stats.sims).toBe(e.content.members.length);
  });
  it('does not infer that created Sims or households are placed', () => {
    const data = plan(),
      a = data.profiles[0].assignments[0];
    for (const m of a.household.content.members)
      a.household.memberProgress[m.id] = 'Created in CAS';
    const stats = populationStats([a], []);
    expect(stats.created).toBe(stats.sims);
    expect(stats.placedSims).toBe(0);
    expect(stats.placedHouseholds).toBe(0);
    expect(populationStatus(stats)).toBe('partial');
  });
  it('does not infer member placement from explicit household placement', () => {
    const a = plan().profiles[0].assignments[0];
    a.placed = true;
    const stats = populationStats([a], []);
    expect(stats.placedHouseholds).toBe(1);
    expect(stats.placedSims).toBe(0);
    expect(populationStatus(stats)).toBe('partial');
  });
  it('uses live board member progress and requires every assigned member for completion', () => {
    const a = plan().profiles[0].assignments[0],
      live = clone(a.household);
    a.placed = true;
    for (const m of live.content.members)
      live.memberProgress[m.id] = 'Placed in World';
    const stats = populationStats([a], [live]);
    expect(stats.placedSims).toBe(stats.sims);
    expect(populationStatus(stats)).toBe('completed');
    expect(a.household.memberProgress).not.toEqual(live.memberProgress);
  });
  it('keeps Playing as a compatible legacy created/placed member status', () => {
    const a = plan().profiles[0].assignments[0];
    for (const m of a.household.content.members)
      a.household.memberProgress[m.id] = 'Playing';
    expect(populationStats([a], []).placedSims).toBe(
      a.household.content.members.length,
    );
  });
  it('reports truly empty worlds as zero residents and empty status', () => {
    const s = populationStats([], []);
    expect(s).toMatchObject({
      households: 0,
      sims: 0,
      created: 0,
      placedHouseholds: 0,
      awaiting: 0,
      neighborhoods: 0,
    });
    expect(populationStatus(s)).toBe('empty');
  });
  it('counts only selected-scope assignments and distinct occupied neighborhoods', () => {
    const a = plan().profiles[0].assignments[0];
    a.neighborhoodId = world.neighborhoods[0].id;
    expect(populationStats([a], []).neighborhoods).toBe(1);
    expect(populationStats([], []).sims).toBe(0);
  });
  it('retains recovery snapshots when board entries disappear', () => {
    const a = plan().profiles[0].assignments[0];
    expect(resolveHousehold(a, [])).toEqual(a.household);
    expect(populationStats([a], []).sims).toBe(
      a.household.content.members.length,
    );
  });
  it('does not silently use different content after a conflicting board ID import', () => {
    const a = plan().profiles[0].assignments[0],
      other = clone(a.household);
    other.content.text = 'Different snapshot';
    expect(resolveHousehold(a, [other])).toEqual(a.household);
  });
});
describe('planning validation and backups', () => {
  it('round trips one/all profiles with latest board metadata without mutating sources', () => {
    const data = plan(),
      original = clone(data),
      live = clone(data.profiles[0].assignments[0].household);
    live.notes = 'New board notes';
    const imported = parsePlanning(exportPlanning(data, [live]), activeCatalog);
    expect(imported.profiles[0].assignments[0].household.notes).toBe(
      'New board notes',
    );
    expect(data).toEqual(original);
    expect(
      parsePlanning(
        exportPlanning(data, [live], data.selectedProfileId),
        activeCatalog,
      ).profiles,
    ).toHaveLength(1);
  });
  it('merges exact profile duplicates once and preserves conflicting IDs under new IDs', () => {
    const data = plan();
    expect(mergePlanning(data, clone(data)).profiles).toHaveLength(1);
    const incoming = clone(data);
    incoming.profiles[0].description = 'Alternate';
    const merged = mergePlanning(data, incoming);
    expect(merged.profiles).toHaveLength(2);
    expect(merged.profiles[0]).toEqual(data.profiles[0]);
    expect(merged.profiles[1].id).not.toBe(data.profiles[0].id);
  });
  it('supports explicit v0 migration without discarding planning content', () => {
    const data = plan();
    expect(
      parsePlanning(
        JSON.stringify({
          ...data,
          schemaVersion: 0,
          selectedProfileId: undefined,
        }),
        activeCatalog,
      ),
    ).toEqual(data);
  });
  it('accepts existing Phase 6 Casting Board JSON through its unchanged importer', () => {
    const raw = readFileSync(
      new URL('../docs/phase-6-backup-check.json', import.meta.url),
      'utf8',
    );
    expect(parseBoard(raw).entries.length).toBeGreaterThan(0);
    expect(() => parsePlanning(raw, activeCatalog)).toThrow();
    expect(() => parseBoard(exportPlanning(plan(), []))).toThrow();
    expect(parseBoard(exportJson([householdEntry()])).entries).toHaveLength(1);
  });
  it('retains disabled-pack world assignments and worlds without lots', () => {
    const p = plan().profiles[0],
      w = activeCatalog.worlds.find((w) => w.name === 'Windenburg')!;
    p.assignments[0].worldId = w.id;
    expect(w.lots).toHaveLength(0);
    expect(validateProfile(p, activeCatalog)).toBe(true);
  });
  it('permits world-level assignment when a world has no neighborhood records', () => {
    const data = clone(activeCatalog);
    data.worlds[0].neighborhoods = [];
    data.worlds[0].lots = [];
    const p = assignHousehold(newProfile('Unknown map'), householdEntry(), {
      ...placement(),
      worldId: data.worlds[0].id,
    });
    expect(validateProfile(p, data)).toBe(true);
  });
  it('accepts clearly separate custom lots with optional dimensions', () => {
    const p = plan().profiles[0];
    p.customLots.push({
      id: 'custom:one',
      name: 'My Garden',
      worldId: world.id,
      neighborhoodId: '',
      lotType: 'Residential',
      description: 'Personal build',
    });
    p.assignments[0].lotId = 'custom:one';
    expect(validateProfile(p, activeCatalog)).toBe(true);
    p.customLots[0].size = { width: 30, height: 20 };
    expect(validateProfile(p, activeCatalog)).toBe(true);
  });
  it.each([0, -1, 1.5, 1001, NaN])(
    'rejects invalid custom lot width %s',
    (width) => {
      const p = plan().profiles[0];
      p.customLots.push({
        id: 'custom:one',
        name: 'Custom',
        worldId: world.id,
        neighborhoodId: '',
        lotType: 'Residential',
        description: '',
        size: { width, height: 20 },
      });
      expect(validateProfile(p, activeCatalog)).toBe(false);
    },
  );
  it('rejects wrong-world neighborhoods and lots, duplicate assignments and mismatched IDs', () => {
    const p = plan().profiles[0];
    p.assignments[0].neighborhoodId =
      activeCatalog.worlds[1].neighborhoods[0].id;
    expect(validateProfile(p, activeCatalog)).toBe(false);
    p.assignments[0].neighborhoodId = '';
    p.assignments.push(clone(p.assignments[0]));
    expect(validateProfile(p, activeCatalog)).toBe(false);
    p.assignments.pop();
    p.assignments[0].householdId = 'different';
    expect(validateProfile(p, activeCatalog)).toBe(false);
  });
  it('validates world/neighborhood note references and required profile names', () => {
    const p = newProfile('');
    expect(validateProfile(p, activeCatalog)).toBe(false);
    p.name = 'Valid';
    p.worldNotes.unknown = 'Invalid';
    expect(validateProfile(p, activeCatalog)).toBe(false);
  });
  it('rejects future schemas, duplicate profile IDs and missing selected profiles', () => {
    const d = plan();
    for (const v of [
      { ...d, schemaVersion: 2 },
      { ...d, profiles: [d.profiles[0], d.profiles[0]] },
      { ...d, selectedProfileId: 'missing' },
    ])
      expect(() => parsePlanning(JSON.stringify(v), activeCatalog)).toThrow();
  });
  it('rejects unsafe prototype keys and excessive import size', () => {
    expect(() =>
      parsePlanning(
        '{"schemaVersion":1,"profiles":[],"selectedProfileId":"","__proto__":{}}',
        activeCatalog,
      ),
    ).toThrow();
    expect(() =>
      parsePlanning(' '.repeat(10 * 1024 * 1024 + 1), activeCatalog),
    ).toThrow(/10 MB/);
  });
  it('imports an empty versioned planning store without adding default populations', () =>
    expect(
      parsePlanning(JSON.stringify(emptyPlanning()), activeCatalog),
    ).toEqual(emptyPlanning()));
});
