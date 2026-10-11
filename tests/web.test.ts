import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { catalog } from '../src/data/library';
import { householdEntry } from './casting-fixtures';
import { clone, parseBoard } from '../src/utils/casting';
import {
  assignHousehold,
  duplicateProfile,
  exportPlanning,
  newProfile,
  parsePlanning,
} from '../src/utils/planning';
import {
  assignedNodes,
  connectionError,
  emptyWeb,
  exportWeb,
  filterWeb,
  memberNodeId,
  mergeWeb,
  newConnection,
  orphanIds,
  parseWebBackup,
  reconcileWeb,
  removeNode,
  standaloneNode,
  validateWeb,
} from '../src/utils/web';
import type {
  CharacterNode,
  Connection,
  RelationshipWeb,
} from '../src/types/web';
const node = (
  id: string,
  age: CharacterNode['age'] = 'adult',
): CharacterNode => ({ ...standaloneNode(), id, label: id, age });
const web = (): RelationshipWeb => ({
  ...emptyWeb(),
  nodes: [node('Alex'), node('Blair'), node('Casey')],
});
const edge = (patch: Partial<Connection> = {}): Connection => ({
  ...newConnection(),
  id: 'edge1',
  from: 'Alex',
  to: 'Blair',
  ...patch,
});
function profile() {
  return assignHousehold(newProfile('Story save'), householdEntry(), {
    worldId: catalog.worlds[0].id,
    neighborhoodId: '',
    lotId: '',
    arrangement: '',
    notes: '',
    placed: false,
  });
}
describe('relationship identity and source preservation', () => {
  it('creates independent standalone IDs without fabricating source details', () => {
    const a = standaloneNode(),
      b = standaloneNode();
    expect(a.id).not.toBe(b.id);
    expect(a.age).toBe('');
    expect(a.label).toBe('');
  });
  it('uses composite household/member IDs rather than names', () => {
    expect(memberNodeId('a:b', 'c')).not.toBe(memberNodeId('a', 'b:c'));
    expect(memberNodeId('a', 'slot')).not.toBe(memberNodeId('b', 'slot'));
  });
  it('uses saved member names and known ages without changing snapshot', () => {
    const p = profile(),
      original = JSON.stringify(p);
    const nodes = assignedNodes(p, []);
    expect(nodes.map((n) => n.label)).toEqual(
      p.assignments[0].household.content.members.map((m) => m.name),
    );
    expect(nodes.every((n) => n.age !== '')).toBe(true);
    expect(JSON.stringify(p)).toBe(original);
  });
  it('preserves edited labels, positions, notes and stable IDs through reconciliation', () => {
    const p = profile(),
      w = reconcileWeb(p, []);
    w.nodes[0].label = 'My label';
    w.nodes[0].x = 553;
    p.relationshipWeb = w;
    const next = reconcileWeb(p, []);
    expect(next.nodes[0]).toMatchObject({
      label: 'My label',
      x: 553,
      id: w.nodes[0].id,
    });
  });
  it('keeps connections after world reassignment', () => {
    const p = profile();
    p.relationshipWeb = reconcileWeb(p, []);
    const a = p.relationshipWeb.nodes[0],
      b = node('Standalone');
    p.relationshipWeb.nodes.push(b);
    p.relationshipWeb.edges.push(edge({ from: a.id, to: b.id }));
    p.assignments[0].worldId = catalog.worlds[1].id;
    const next = reconcileWeb(p, []);
    expect(next.edges).toHaveLength(1);
    expect(next.nodes[0].worldId).toBe(catalog.worlds[1].id);
  });
  it('retains orphan nodes and history after unassignment', () => {
    const p = profile();
    p.relationshipWeb = reconcileWeb(p, []);
    const count = p.relationshipWeb.nodes.length;
    p.assignments = [];
    expect(reconcileWeb(p, []).nodes).toHaveLength(count);
    expect(orphanIds(p, p.relationshipWeb).size).toBe(count);
  });
  it('isolates duplicated profile web mutations', () => {
    const p = profile();
    p.relationshipWeb = web();
    const copy = duplicateProfile(p);
    copy.relationshipWeb!.nodes[0].x = 99;
    expect(p.relationshipWeb.nodes[0].x).toBe(0);
    expect(copy.id).not.toBe(p.id);
  });
  it('removes a standalone node only with its attached edges and family references', () => {
    const w = web();
    w.edges = [edge()];
    w.knownFamily = [{ from: 'Alex', to: 'Blair' }];
    const next = removeNode(w, 'Alex');
    expect(next.nodes).toHaveLength(2);
    expect(next.edges).toHaveLength(0);
    expect(next.knownFamily).toEqual([]);
    expect(w.nodes).toHaveLength(3);
  });
  it('records source family restrictions without creating romantic edges', () => {
    const p = profile();
    const h = p.assignments[0].household;
    const members = h.content.members;
    h.content.snapshot.household = {
      dynamics: [
        {
          kind: 'siblings',
          fromId: members[0].id,
          toId: members[1]?.id ?? members[0].id,
        },
      ],
    };
    const next = reconcileWeb(p, []);
    expect(next.edges).toEqual([]);
    if (members.length > 1) expect(next.knownFamily).toHaveLength(1);
  });
});
describe('connection validation', () => {
  it('requires recognizable custom romantic labels to use the Romance category', () =>
    expect(
      connectionError(
        web(),
        edge({ type: 'custom', customGroup: 'Other', label: 'Secret lovers' }),
      ),
    ).toMatch(/Classify/));
  it('rejects multiple contradictory active romance stages for the same pair', () => {
    const w = web();
    w.edges = [edge({ type: 'married', adultConsent: true })];
    expect(
      connectionError(
        w,
        edge({ id: 'second', type: 'engaged', adultConsent: true }),
      ),
    ).toMatch(/Contradictory/);
  });
  it('rejects sibling and ancestor contradictions in either direction', () => {
    const w = web();
    w.nodes.forEach((n) => (n.age = ''));
    w.edges = [edge({ type: 'parent-child' })];
    expect(
      connectionError(
        w,
        edge({ id: 'sibling', from: 'Blair', to: 'Alex', type: 'siblings' }),
      ),
    ).toMatch(/contradicts/);
  });
  it('creates and edits relationship details', () => {
    const w = web();
    w.edges = [
      edge({ notes: 'Story note', strength: 3, startDate: '2026-10-10' }),
    ];
    expect(validateWeb(w)).toBe(true);
    w.edges[0].notes = 'Changed';
    expect(validateWeb(w)).toBe(true);
  });
  it.each(['parent-child', 'siblings', 'friends'] as const)(
    'rejects self %s',
    (type) =>
      expect(
        connectionError(web(), edge({ from: 'Alex', to: 'Alex', type })),
      ).toMatch(/themselves/),
  );
  it('rejects unknown endpoints', () =>
    expect(connectionError(web(), edge({ to: 'missing' }))).toMatch(
      /existing Sims/,
    ));
  it('prevents identical reciprocal friendships', () => {
    const w = web();
    w.edges = [edge()];
    expect(
      connectionError(w, edge({ id: 'new', from: 'Blair', to: 'Alex' })),
    ).toMatch(/identical/);
  });
  it('does not treat editing the same edge as duplication', () => {
    const w = web();
    w.edges = [edge()];
    expect(connectionError(w, { ...w.edges[0], notes: 'Edit' })).toBe('');
  });
  it('allows multiple friendships to different Sims', () => {
    const w = web();
    w.edges = [edge()];
    expect(connectionError(w, edge({ id: 'other', to: 'Casey' }))).toBe('');
  });
  it('prevents impossible known parent ages', () => {
    const w = web();
    w.nodes[0].age = 'child';
    expect(connectionError(w, edge({ type: 'parent-child' }))).toMatch(/older/);
    w.nodes[0].age = 'young-adult';
    w.nodes[1].age = 'teen';
    expect(connectionError(w, edge({ type: 'parent-child' }))).toMatch(/older/);
  });
  it('allows compatible parent/child and grandparent ages', () => {
    const w = web();
    w.nodes[0].age = 'elder';
    w.nodes[1].age = 'child';
    expect(connectionError(w, edge({ type: 'parent-child' }))).toBe('');
    expect(connectionError(w, edge({ type: 'grandparent-grandchild' }))).toBe(
      '',
    );
  });
  it('rejects ancestry cycles even for unknown ages', () => {
    const w = web();
    w.nodes.forEach((n) => (n.age = ''));
    w.edges = [edge({ type: 'parent-child' })];
    expect(
      connectionError(
        w,
        edge({ id: 'cycle', from: 'Blair', to: 'Alex', type: 'parent-child' }),
      ),
    ).toMatch(/cycle/);
  });
  it.each(['newborn', 'infant', 'toddler', 'child', 'teen', ''] as const)(
    'rejects romance for %s life stage',
    (age) => {
      const w = web();
      w.nodes[0].age = age;
      expect(
        connectionError(w, edge({ type: 'dating', adultConsent: true })),
      ).toMatch(/known Young Adult/);
    },
  );
  it('requires explicit adult consent', () =>
    expect(connectionError(web(), edge({ type: 'dating' }))).toMatch(
      /consent/,
    ));
  it('permits multiple consenting adult romances without exclusivity inference', () => {
    const w = web();
    w.edges = [edge({ type: 'married', adultConsent: true })];
    expect(
      connectionError(
        w,
        edge({ id: 'second', to: 'Casey', type: 'dating', adultConsent: true }),
      ),
    ).toBe('');
  });
  it('permits ended ex-partners alongside a current connection', () => {
    const w = web();
    w.edges = [edge({ type: 'ex', status: 'ended', adultConsent: true })];
    expect(
      connectionError(
        w,
        edge({ id: 'current', type: 'dating', adultConsent: true }),
      ),
    ).toBe('');
  });
  it('rejects contradictory active friendship and enemy states', () => {
    const w = web();
    w.edges = [edge()];
    expect(
      connectionError(w, edge({ id: 'conflict', type: 'enemies' })),
    ).toMatch(/Contradictory/);
  });
  it('rejects contradictory active ex and marriage states', () => {
    const w = web();
    w.edges = [edge({ type: 'ex', adultConsent: true })];
    expect(
      connectionError(
        w,
        edge({ id: 'new', type: 'married', adultConsent: true }),
      ),
    ).toMatch(/Contradictory/);
  });
  it('prevents direct and indirect family romance', () => {
    const w = web();
    w.edges = [
      edge({ type: 'siblings' }),
      edge({ id: 'family2', from: 'Blair', to: 'Casey', type: 'cousins' }),
    ];
    expect(
      connectionError(
        w,
        edge({
          id: 'romance',
          to: 'Casey',
          type: 'dating',
          adultConsent: true,
        }),
      ),
    ).toMatch(/family/);
  });
  it('checks family additions against existing romance', () => {
    const w = web();
    w.edges = [edge({ type: 'dating', adultConsent: true })];
    expect(
      connectionError(w, edge({ id: 'family', type: 'adoptive' })),
    ).toMatch(/family/);
  });
  it('enforces known source family constraints', () => {
    const w = web();
    w.knownFamily = [{ from: 'Alex', to: 'Blair' }];
    expect(
      connectionError(w, edge({ type: 'dating', adultConsent: true })),
    ).toMatch(/family/);
  });
  it('supports chosen family and complicated adult romance', () => {
    const w = web();
    w.edges = [edge({ type: 'chosen-family' })];
    expect(
      connectionError(
        w,
        edge({ id: 'romance', type: 'complicated', adultConsent: true }),
      ),
    ).toBe('');
  });
  it('classifies custom romance for age checks', () => {
    const w = web();
    w.nodes[0].age = 'teen';
    expect(
      connectionError(
        w,
        edge({
          type: 'custom',
          customGroup: 'Romance',
          adultConsent: true,
          label: 'Custom romance',
        }),
      ),
    ).toMatch(/known/);
  });
  it('permits user-defined nonromantic labels', () =>
    expect(
      connectionError(
        web(),
        edge({ type: 'custom', label: 'Mystery club', customGroup: 'Other' }),
      ),
    ).toBe(''));
  it('rejects invalid dates without throwing', () => {
    const w = web();
    w.edges = [edge({ startDate: '2026-99-99' })];
    expect(() => validateWeb(w)).not.toThrow();
    expect(validateWeb(w)).toBe(false);
  });
  it.each([NaN, Infinity, 100001])('rejects invalid position %s', (x) => {
    const w = web();
    w.nodes[0].x = x;
    expect(validateWeb(w)).toBe(false);
  });
});
describe('discovery and backups', () => {
  it('preserves current character metadata when an import conflicts', () => {
    const a = web(),
      b = clone(a);
    b.nodes[0].label = 'Different';
    expect(() => mergeWeb(a, b)).toThrow(/Conflicting character/);
    expect(a.nodes[0].label).toBe('Alex');
  });
  it('searches labels, source households and connection notes', () => {
    const w = web();
    w.nodes[0].householdName = 'Photo studio';
    w.edges = [edge({ notes: 'Secret club' })];
    expect(
      filterWeb(w, { ...w.filters, search: 'photo' }).nodes.map((n) => n.id),
    ).toEqual(['Alex']);
    expect(filterWeb(w, { ...w.filters, search: 'secret' }).edges).toHaveLength(
      1,
    );
  });
  it('filters favorites, world, type and status', () => {
    const w = web();
    w.nodes[0].favorite = true;
    w.nodes[0].worldId = 'world';
    w.edges = [edge()];
    expect(filterWeb(w, { ...w.filters, favorites: true }).nodes).toHaveLength(
      1,
    );
    expect(filterWeb(w, { ...w.filters, worldId: 'world' }).nodes).toHaveLength(
      1,
    );
    expect(filterWeb(w, { ...w.filters, type: 'enemies' }).edges).toHaveLength(
      0,
    );
    expect(filterWeb(w, { ...w.filters, status: 'ended' }).edges).toHaveLength(
      0,
    );
  });
  it('focus mode and individual filters include adjacent Sims only', () => {
    const w = web();
    w.edges = [edge()];
    expect(filterWeb(w, { ...w.filters, focusId: 'Alex' }).nodes).toHaveLength(
      2,
    );
    expect(filterWeb(w, { ...w.filters, simId: 'Alex' }).nodes).toHaveLength(2);
    expect(
      filterWeb(w, { ...w.filters, focusId: 'Casey' }).nodes.map((n) => n.id),
    ).toEqual(['Casey']);
  });
  it('exports one or all profile webs and imports positions/details', () => {
    const a = newProfile('A'),
      b = newProfile('B');
    a.relationshipWeb = web();
    a.relationshipWeb.nodes[0].x = 73;
    a.relationshipWeb.edges = [edge({ notes: 'Keep' })];
    const one = parseWebBackup(exportWeb([a, b], [], a.id));
    expect(one.profiles).toHaveLength(1);
    expect(one.profiles[0].web.nodes[0].x).toBe(73);
    expect(one.profiles[0].web.edges[0].notes).toBe('Keep');
    expect(parseWebBackup(exportWeb([a, b], [])).profiles).toHaveLength(2);
  });
  it('migrates documented v0 web fields without erasing nodes', () => {
    const w = web();
    const parsed = parseWebBackup(
      JSON.stringify({
        format: 'townieverse-relationship-web',
        schemaVersion: 0,
        profiles: [
          { id: 'old', name: 'Old', web: { nodes: w.nodes, edges: [] } },
        ],
      }),
    );
    expect(parsed.profiles[0].web.nodes).toEqual(w.nodes);
    expect(parsed.profiles[0].web.filters).toEqual(emptyWeb().filters);
  });
  it('roundtrips relationship data inside population backups', () => {
    const p = newProfile('Web save');
    p.relationshipWeb = web();
    const raw = exportPlanning(
      { schemaVersion: 1, selectedProfileId: p.id, profiles: [p] },
      [],
    );
    expect(parsePlanning(raw, catalog).profiles[0].relationshipWeb).toEqual(
      p.relationshipWeb,
    );
  });
  it('loads actual Phase 8 population and Phase 6 board backups', () => {
    const plans = parsePlanning(
      readFileSync(
        new URL('../docs/phase-8-backup-check.json', import.meta.url),
        'utf8',
      ),
      catalog,
    );
    expect(plans.profiles).toHaveLength(2);
    expect(plans.profiles[0].relationshipWeb).toBeUndefined();
    expect(
      parseBoard(
        readFileSync(
          new URL('../docs/phase-6-backup-check.json', import.meta.url),
          'utf8',
        ),
      ).entries.length,
    ).toBeGreaterThan(0);
  });
  it('rejects wrong formats, unsafe keys, future schemas and duplicate nodes', () => {
    expect(() => parseWebBackup('{"__proto__":{}}')).toThrow();
    expect(() =>
      parseWebBackup(
        JSON.stringify({
          format: 'townieverse-relationship-web',
          schemaVersion: 99,
          profiles: [],
        }),
      ),
    ).toThrow();
    const w = web();
    w.nodes.push(clone(w.nodes[0]));
    expect(validateWeb(w)).toBe(false);
  });
  it('deduplicates repeated imports without changing current positions', () => {
    const a = web();
    a.edges = [edge()];
    const b = clone(a);
    b.nodes[0].x = 99;
    const merged = mergeWeb(a, b);
    expect(merged.edges).toHaveLength(1);
    expect(merged.nodes).toHaveLength(3);
    expect(merged.nodes[0].x).toBe(0);
  });
  it('blocks conflicting edge details without modifying the current web', () => {
    const a = web();
    a.edges = [edge({ notes: 'Current' })];
    const b = clone(a);
    b.edges[0].notes = 'Incoming';
    expect(() => mergeWeb(a, b)).toThrow(/Conflicting/);
    expect(a.edges[0].notes).toBe('Current');
  });
  it('merges new connections and retains existing family constraints', () => {
    const a = web(),
      b = web();
    b.edges = [edge()];
    a.knownFamily = [{ from: 'Alex', to: 'Casey' }];
    const merged = mergeWeb(a, b);
    expect(merged.edges).toHaveLength(1);
    expect(merged.knownFamily).toHaveLength(1);
  });
  it.each([50, 100, 200])(
    'validates and filters a %i-character graph promptly',
    (count) => {
      const w = emptyWeb();
      w.nodes = Array.from({ length: count }, (_, i) => node(`Sim ${i}`));
      w.edges = Array.from({ length: count - 1 }, (_, i) =>
        edge({ id: `e${i}`, from: w.nodes[i].id, to: w.nodes[i + 1].id }),
      );
      const start = performance.now();
      expect(validateWeb(w)).toBe(true);
      expect(
        filterWeb(w, { ...w.filters, focusId: 'Sim 0' }).nodes,
      ).toHaveLength(2);
      const elapsed = performance.now() - start;
      console.info(
        `Relationship graph ${count} nodes/${count - 1} edges: ${elapsed.toFixed(1)} ms`,
      );
      expect(elapsed).toBeLessThan(1500);
    },
  );
});
