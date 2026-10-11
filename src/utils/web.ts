import { CONNECTION_TYPES, WEB_AGES } from '../types/web';
import type {
  CharacterNode,
  Connection,
  ConnectionGroup,
  RelationshipWeb,
  WebFilters,
} from '../types/web';
import type { SaveProfile } from '../types/planning';
import type { CastingEntry } from '../types/casting';
import { clone, MAX_IMPORT_BYTES } from './casting';
import { parentChildCompatible } from '../generators/households';

export const emptyWeb = (): RelationshipWeb => ({
  schemaVersion: 1,
  nodes: [],
  edges: [],
  filters: {
    search: '',
    householdId: '',
    worldId: '',
    type: '',
    status: '',
    simId: '',
    favorites: false,
    focusId: '',
  },
  view: { zoom: 1, panX: 20, panY: 20, simplified: false, listOnly: false },
});
export const memberNodeId = (householdId: string, memberId: string) =>
  `member:${encodeURIComponent(householdId)}:${encodeURIComponent(memberId)}`;
export const newConnection = (): Connection => ({
  id: crypto.randomUUID(),
  from: '',
  to: '',
  type: 'friends',
  label: 'Friends',
  description: '',
  notes: '',
  status: 'active',
  strength: null,
  startDate: '',
  tags: [],
  customGroup: 'Other',
  adultConsent: false,
});
export const standaloneNode = (): CharacterNode => ({
  id: crypto.randomUUID(),
  label: '',
  householdId: '',
  memberId: '',
  householdName: '',
  aesthetic: '',
  age: '',
  worldId: '',
  color: '',
  icon: '',
  favorite: false,
  x: 0,
  y: 0,
});
export function connectionGroup(
  edge: Pick<Connection, 'type' | 'customGroup'>,
): ConnectionGroup {
  if (edge.type === 'custom') return edge.customGroup;
  if (
    [
      'parent-child',
      'siblings',
      'grandparent-grandchild',
      'cousins',
      'adoptive',
      'stepfamily',
      'chosen-family',
    ].includes(edge.type)
  )
    return 'Family';
  if (
    [
      'dating',
      'married',
      'engaged',
      'ex',
      'crush',
      'complicated',
      'sexual',
    ].includes(edge.type)
  )
    return 'Romance';
  if (
    ['best', 'friends', 'acquaintances', 'former-friends'].includes(edge.type)
  )
    return 'Friendship';
  if (['rivals', 'enemies', 'feud', 'workplace-rivals'].includes(edge.type))
    return 'Conflict';
  return 'Other';
}
const kin = (e: Connection) =>
  connectionGroup(e) === 'Family' && e.type !== 'chosen-family';
const ancestry = (e: Connection) =>
  ['parent-child', 'grandparent-grandchild'].includes(e.type);
const adult = (age: string) => ['young-adult', 'adult', 'elder'].includes(age);
function reachable(
  start: string,
  end: string,
  edges: Connection[],
  directed = false,
): boolean {
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    adjacency.set(e.from, [...(adjacency.get(e.from) ?? []), e.to]);
    if (!directed)
      adjacency.set(e.to, [...(adjacency.get(e.to) ?? []), e.from]);
  }
  const queue = [start],
    seen = new Set(queue);
  for (let i = 0; i < queue.length; i++) {
    if (queue[i] === end) return true;
    for (const n of adjacency.get(queue[i]) ?? [])
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
  }
  return false;
}
export function connectionError(
  web: RelationshipWeb,
  candidate: Connection,
): string {
  if (
    candidate.type === 'custom' &&
    candidate.customGroup !== 'Romance' &&
    /\b(romantic|romance|dating|married|marriage|engaged|crush|lovers?|sexual|intimate|woohoo)\b/i.test(
      candidate.label,
    )
  )
    return 'Classify romantic or intimate custom labels as Romance so adult and family checks apply.';
  const from = web.nodes.find((n) => n.id === candidate.from),
    to = web.nodes.find((n) => n.id === candidate.to);
  if (!from || !to) return 'Choose two existing Sims in this profile.';
  if (from.id === to.id) return 'A Sim cannot have a connection to themselves.';
  const others = web.edges.filter((e) => e.id !== candidate.id);
  const samePair = (e: Connection) =>
    (e.from === candidate.from && e.to === candidate.to) ||
    (!ancestry(candidate) &&
      e.from === candidate.to &&
      e.to === candidate.from);
  if (
    others.some(
      (e) =>
        samePair(e) &&
        e.type === candidate.type &&
        e.label.trim().toLowerCase() === candidate.label.trim().toLowerCase() &&
        e.status === candidate.status,
    )
  )
    return 'An identical connection already exists.';
  if (ancestry(candidate)) {
    const a = WEB_AGES.indexOf(from.age as (typeof WEB_AGES)[number]),
      b = WEB_AGES.indexOf(to.age as (typeof WEB_AGES)[number]);
    if (
      a >= 0 &&
      b >= 0 &&
      (!parentChildCompatible(
        from.age as (typeof WEB_AGES)[number],
        to.age as (typeof WEB_AGES)[number],
        'biological-parent',
      ) ||
        (candidate.type === 'grandparent-grandchild' && a - b < 2))
    )
      return 'The parent or grandparent must have a compatible older life stage. The first Sim is the ancestor.';
    if (reachable(to.id, from.id, others.filter(ancestry), true))
      return 'Ancestry cannot form a cycle.';
  }
  const combined = [...others, candidate],
    family = [
      ...combined.filter(kin),
      ...(web.knownFamily ?? []).map((pair) => ({
        ...candidate,
        ...pair,
        type: 'siblings' as const,
      })),
    ];
  for (const e of combined.filter((e) => connectionGroup(e) === 'Romance')) {
    const a = web.nodes.find((n) => n.id === e.from),
      b = web.nodes.find((n) => n.id === e.to);
    if (!a || !b || !adult(a.age) || !adult(b.age))
      return 'Romantic and intimate connections require known Young Adult, Adult or Elder life stages.';
    if (!e.adultConsent)
      return 'Confirm that both adult Sims consent to the romantic connection.';
    if (reachable(e.from, e.to, family))
      return 'Romance is not permitted between connected family members. Review family history first.';
  }
  if (
    candidate.status === 'active' &&
    others.some(
      (e) =>
        e.status === 'active' &&
        samePair(e) &&
        ((['ex', 'former-friends'].includes(e.type) &&
          !['ex', 'former-friends'].includes(candidate.type) &&
          connectionGroup(e) === connectionGroup(candidate)) ||
          (['ex', 'former-friends'].includes(candidate.type) &&
            !['ex', 'former-friends'].includes(e.type) &&
            connectionGroup(e) === connectionGroup(candidate)) ||
          (connectionGroup(e) === 'Conflict' &&
            connectionGroup(candidate) === 'Friendship') ||
          (connectionGroup(e) === 'Friendship' &&
            connectionGroup(candidate) === 'Conflict') ||
          (['dating', 'engaged', 'married', 'ex'].includes(e.type) &&
            ['dating', 'engaged', 'married', 'ex'].includes(candidate.type) &&
            e.type !== candidate.type)),
    )
  )
    return 'Contradictory active states: end the earlier connection or use Complicated romance / a custom Other connection.';
  if (
    others.some(
      (e) =>
        ((e.from === candidate.from && e.to === candidate.to) ||
          (e.from === candidate.to && e.to === candidate.from)) &&
        ((ancestry(e) && candidate.type === 'siblings') ||
          (e.type === 'siblings' && ancestry(candidate))),
    )
  )
    return 'A sibling connection contradicts an ancestor connection between the same Sims.';
  return '';
}
export function assignedNodes(
  profile: SaveProfile,
  entries: readonly CastingEntry[],
): CharacterNode[] {
  const result: CharacterNode[] = [];
  for (const a of profile.assignments) {
    const live = entries.find(
      (e) =>
        e.id === a.householdId &&
        e.type === 'household' &&
        JSON.stringify(e.content) === JSON.stringify(a.household.content),
    );
    const entry = live ?? a.household,
      snapshot = entry.content.snapshot;
    const sims = Array.isArray(snapshot.sims) ? snapshot.sims : [];
    for (const m of entry.content.members) {
      const sim = sims.find(
        (s) =>
          typeof s === 'object' && s !== null && 'id' in s && s.id === m.id,
      ) as Record<string, unknown> | undefined;
      const aesthetic = sim?.aesthetic ?? snapshot.aesthetic;
      const age =
        typeof sim?.age === 'string' &&
        WEB_AGES.includes(sim.age as (typeof WEB_AGES)[number])
          ? (sim.age as CharacterNode['age'])
          : '';
      result.push({
        id: memberNodeId(entry.id, m.id),
        memberId: m.id,
        householdId: entry.id,
        label: m.name,
        householdName: entry.title,
        aesthetic:
          typeof aesthetic === 'object' &&
          aesthetic !== null &&
          'name' in aesthetic &&
          typeof aesthetic.name === 'string'
            ? aesthetic.name
            : '',
        age,
        worldId: a.worldId,
        color: '',
        icon: '',
        favorite: entry.favorite,
        x: (result.length % 5) * 320,
        y: Math.floor(result.length / 5) * 180,
      });
    }
  }
  return result;
}
/** Pure reconciliation: retain edited labels, positions and orphan history. */
export function reconcileWeb(
  profile: SaveProfile,
  entries: readonly CastingEntry[],
): RelationshipWeb {
  const web = clone(profile.relationshipWeb ?? emptyWeb()),
    sources = assignedNodes(profile, entries),
    existing = new Map(web.nodes.map((n) => [n.id, n]));
  for (const source of sources) {
    const old = existing.get(source.id);
    if (old) {
      old.householdName = source.householdName;
      old.worldId = source.worldId;
    } else {
      source.x = (web.nodes.length % 5) * 320;
      source.y = Math.floor(web.nodes.length / 5) * 180;
      web.nodes.push(source);
    }
  }
  const pairs = [...(web.knownFamily ?? [])];
  for (const a of profile.assignments) {
    const household = a.household.content.snapshot.household;
    if (!obj(household) || !Array.isArray(household.dynamics)) continue;
    for (const d of household.dynamics) {
      if (
        !obj(d) ||
        ![
          'biological-parent',
          'adoptive-parent',
          'step-parent',
          'siblings',
        ].includes(d.kind as string) ||
        typeof d.fromId !== 'string' ||
        typeof d.toId !== 'string'
      )
        continue;
      const from = memberNodeId(a.householdId, d.fromId),
        to = memberNodeId(a.householdId, d.toId);
      if (
        web.nodes.some((n) => n.id === from) &&
        web.nodes.some((n) => n.id === to) &&
        !pairs.some(
          (p) =>
            (p.from === from && p.to === to) ||
            (p.from === to && p.to === from),
        )
      )
        pairs.push({ from, to });
    }
  }
  if (pairs.length || web.knownFamily) web.knownFamily = pairs;
  return web;
}
export function orphanIds(
  profile: SaveProfile,
  web: RelationshipWeb,
): Set<string> {
  const active = new Set(profile.assignments.map((a) => a.householdId));
  return new Set(
    web.nodes
      .filter((n) => n.householdId && !active.has(n.householdId))
      .map((n) => n.id),
  );
}
export function removeNode(web: RelationshipWeb, id: string): RelationshipWeb {
  return {
    ...clone(web),
    knownFamily: web.knownFamily?.filter((p) => p.from !== id && p.to !== id),
    nodes: web.nodes.filter((n) => n.id !== id),
    edges: web.edges.filter((e) => e.from !== id && e.to !== id),
    filters: {
      ...web.filters,
      simId: web.filters.simId === id ? '' : web.filters.simId,
      focusId: web.filters.focusId === id ? '' : web.filters.focusId,
    },
  };
}
export function filterWeb(
  web: RelationshipWeb,
  filters: WebFilters = web.filters,
) {
  const query = filters.search.trim().toLocaleLowerCase(),
    nodeMap = new Map(web.nodes.map((n) => [n.id, n]));
  let edges = web.edges.filter(
    (e) =>
      (!filters.type || e.type === filters.type) &&
      (!filters.status || e.status === filters.status) &&
      (!filters.simId || e.from === filters.simId || e.to === filters.simId) &&
      (!filters.focusId ||
        e.from === filters.focusId ||
        e.to === filters.focusId),
  );
  const focus = new Set([
    filters.focusId,
    filters.simId,
    ...edges.flatMap((e) => [e.from, e.to]),
  ]);
  const nodes = web.nodes.filter(
    (n) =>
      (!filters.householdId || n.householdId === filters.householdId) &&
      (!filters.worldId || n.worldId === filters.worldId) &&
      (!filters.favorites || n.favorite) &&
      (!(filters.focusId || filters.simId) || focus.has(n.id)) &&
      (!query ||
        [
          n.label,
          n.householdName,
          n.aesthetic,
          n.icon,
          ...edges
            .filter((e) => e.from === n.id || e.to === n.id)
            .flatMap((e) => [e.label, e.description, e.notes, ...e.tags]),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query)),
  );
  const visible = new Set(nodes.map((n) => n.id));
  edges = edges.filter(
    (e) => visible.has(e.from) && visible.has(e.to) && nodeMap.has(e.from),
  );
  return { nodes, edges };
}
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = 100000): v is string =>
  typeof v === 'string' && v.length <= max;
const identity = (v: unknown) => str(v, 2000) && v.length > 0;
export function validateWeb(value: unknown): value is RelationshipWeb {
  if (
    !obj(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.nodes) ||
    value.nodes.length > 2000 ||
    !Array.isArray(value.edges) ||
    value.edges.length > 10000 ||
    !obj(value.filters) ||
    !obj(value.view)
  )
    return false;
  const f = value.filters,
    v = value.view;
  if (
    ![
      'search',
      'householdId',
      'worldId',
      'type',
      'status',
      'simId',
      'focusId',
    ].every((k) => str(f[k], 2000)) ||
    typeof f.favorites !== 'boolean' ||
    !['zoom', 'panX', 'panY'].every(
      (k) => typeof v[k] === 'number' && Number.isFinite(v[k]),
    ) ||
    Number(v.zoom) < 0.2 ||
    Number(v.zoom) > 3 ||
    Math.abs(Number(v.panX)) > 100000 ||
    Math.abs(Number(v.panY)) > 100000 ||
    typeof v.simplified !== 'boolean' ||
    typeof v.listOnly !== 'boolean'
  )
    return false;
  const ids = new Set<string>();
  for (const n of value.nodes) {
    if (
      !obj(n) ||
      !identity(n.id) ||
      ids.has(n.id as string) ||
      !str(n.label, 120) ||
      !n.label.trim() ||
      ![
        'householdId',
        'memberId',
        'householdName',
        'aesthetic',
        'worldId',
        'icon',
      ].every((k) => str(n[k], 2000)) ||
      !str(n.color) ||
      !(/^#[0-9a-f]{6}$/i.test(n.color) || n.color === '') ||
      !['', ...WEB_AGES].includes(n.age as never) ||
      typeof n.favorite !== 'boolean' ||
      !['x', 'y'].every(
        (k) =>
          typeof n[k] === 'number' &&
          Number.isFinite(n[k]) &&
          Math.abs(Number(n[k])) <= 100000,
      ) ||
      !!n.householdId !== !!n.memberId ||
      (n.householdId &&
        n.id !== memberNodeId(n.householdId as string, n.memberId as string))
    )
      return false;
    ids.add(n.id as string);
  }
  if (
    value.knownFamily !== undefined &&
    (!Array.isArray(value.knownFamily) ||
      value.knownFamily.length > 10000 ||
      !value.knownFamily.every(
        (p) =>
          obj(p) &&
          ids.has(p.from as string) &&
          ids.has(p.to as string) &&
          p.from !== p.to,
      ))
  )
    return false;
  const edgeIds = new Set<string>(),
    web = value as unknown as RelationshipWeb;
  for (const e of value.edges) {
    if (
      !obj(e) ||
      !identity(e.id) ||
      edgeIds.has(e.id as string) ||
      !ids.has(e.from as string) ||
      !ids.has(e.to as string) ||
      !Object.hasOwn(CONNECTION_TYPES, e.type as string) ||
      !str(e.label, 120) ||
      !e.label.trim() ||
      !str(e.description) ||
      !str(e.notes) ||
      !['active', 'ended', 'planned'].includes(e.status as string) ||
      !(
        e.strength === null ||
        (typeof e.strength === 'number' &&
          Number.isInteger(e.strength) &&
          e.strength >= 0 &&
          e.strength <= 5)
      ) ||
      !str(e.startDate, 10) ||
      (e.startDate !== '' &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(e.startDate) ||
          !Number.isFinite(Date.parse(e.startDate as string)) ||
          new Date(e.startDate as string).toISOString().slice(0, 10) !==
            e.startDate)) ||
      !Array.isArray(e.tags) ||
      e.tags.length > 30 ||
      !e.tags.every((t) => str(t, 120)) ||
      !['Family', 'Romance', 'Friendship', 'Conflict', 'Other'].includes(
        e.customGroup as string,
      ) ||
      typeof e.adultConsent !== 'boolean'
    )
      return false;
    edgeIds.add(e.id as string);
  }
  try {
    return web.edges.every((e) => !connectionError(web, e));
  } catch {
    return false;
  }
}
export interface WebBackup {
  format: 'townieverse-relationship-web';
  schemaVersion: 1;
  profiles: { id: string; name: string; web: RelationshipWeb }[];
}
export function exportWeb(
  profiles: SaveProfile[],
  entries: readonly CastingEntry[],
  id?: string,
): string {
  return JSON.stringify(
    {
      format: 'townieverse-relationship-web',
      schemaVersion: 1,
      profiles: profiles
        .filter((p) => !id || p.id === id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          web: reconcileWeb(p, entries),
        })),
    },
    null,
    2,
  );
}
export function parseWebBackup(raw: string): WebBackup {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    throw new Error('Backup exceeds 10 MB.');
  const v: unknown = JSON.parse(raw);
  const safe = (x: unknown, depth = 0): boolean =>
    depth <= 50 &&
    (x === null ||
      typeof x !== 'object' ||
      (Array.isArray(x) &&
        x.length <= 20000 &&
        x.every((n) => safe(n, depth + 1))) ||
      (obj(x) &&
        Object.entries(x).every(
          ([k, n]) =>
            !['__proto__', 'prototype', 'constructor'].includes(k) &&
            safe(n, depth + 1),
        )));
  if (
    !safe(v) ||
    !obj(v) ||
    v.format !== 'townieverse-relationship-web' ||
    ![0, 1].includes(v.schemaVersion as number) ||
    !Array.isArray(v.profiles) ||
    v.profiles.length > 100
  )
    throw new Error(
      'Use the appropriate Casting Board or population importer for legacy backups. Invalid or unsupported relationship backup.',
    );
  const profiles = v.profiles.map((p) => {
    if (!obj(p) || !identity(p.id) || !str(p.name, 120) || !p.name.trim())
      throw new Error('Invalid profile.');
    const web =
      v.schemaVersion === 0 && obj(p.web)
        ? { ...emptyWeb(), ...p.web, schemaVersion: 1 }
        : p.web;
    if (!validateWeb(web))
      throw new Error('Invalid connections, ages or node data.');
    return { id: p.id as string, name: p.name, web: clone(web) };
  });
  if (new Set(profiles.map((p) => p.id)).size !== profiles.length)
    throw new Error('Duplicate profile IDs.');
  return { format: 'townieverse-relationship-web', schemaVersion: 1, profiles };
}
/** Keep current positions, deduplicate exact edges and block conflicting details. */
export function mergeWeb(
  current: RelationshipWeb,
  incoming: RelationshipWeb,
): RelationshipWeb {
  const result = clone(current),
    mapping = new Map<string, string>();
  result.knownFamily = [
    ...(current.knownFamily ?? []),
    ...(incoming.knownFamily ?? []),
  ].filter(
    (p, i, all) =>
      all.findIndex((x) => x.from === p.from && x.to === p.to) === i,
  );
  for (const node of incoming.nodes) {
    const old = result.nodes.find((n) => n.id === node.id);
    if (old) {
      if (
        old.householdId !== node.householdId ||
        old.memberId !== node.memberId
      )
        throw new Error('Conflicting node identity.');
      if (
        ['label', 'age', 'aesthetic', 'color', 'icon', 'favorite'].some(
          (key) =>
            old[key as keyof CharacterNode] !==
            node[key as keyof CharacterNode],
        )
      )
        throw new Error(
          'Conflicting character details. Existing labels and styling are preserved; edit the character or confirm replacement.',
        );
      mapping.set(node.id, old.id);
      continue;
    }
    result.nodes.push(clone(node));
    mapping.set(node.id, node.id);
  }
  for (const edge of incoming.edges) {
    const next = {
      ...clone(edge),
      from: mapping.get(edge.from)!,
      to: mapping.get(edge.to)!,
    };
    const equivalent = result.edges.find(
      (e) =>
        e.from === next.from &&
        e.to === next.to &&
        e.type === next.type &&
        e.label === next.label &&
        e.status === next.status,
    );
    if (equivalent) {
      if (
        JSON.stringify({ ...equivalent, id: '' }) !==
        JSON.stringify({ ...next, id: '' })
      )
        throw new Error(
          'Conflicting relationship details. Export both versions and edit or confirm replacement.',
        );
      continue;
    }
    if (result.edges.some((e) => e.id === next.id))
      next.id = crypto.randomUUID();
    const error = connectionError(result, next);
    if (error) throw new Error(error);
    result.edges.push(next);
  }
  if (!validateWeb(result))
    throw new Error(
      'Merged relationship data conflicts with existing age or family restrictions.',
    );
  return result;
}
