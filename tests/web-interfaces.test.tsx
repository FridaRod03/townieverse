// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { catalog } from '../src/data/library';
import { householdEntry } from './casting-fixtures';
import { BOARD_KEY, clone } from '../src/utils/casting';
import {
  newProfile,
  parsePlanning,
  PLANNING_KEY,
  assignHousehold,
} from '../src/utils/planning';
import {
  emptyWeb,
  exportWeb,
  newConnection,
  standaloneNode,
  reconcileWeb,
} from '../src/utils/web';
import type { SaveProfile } from '../src/types/planning';
import { RelationshipGraph } from '../src/components/web/RelationshipGraph';
const user = () => userEvent.setup();
it('exports selected and all relationship JSON through download controls', async () => {
  seed();
  const create = vi.fn(() => 'blob:web');
  Object.defineProperty(URL, 'createObjectURL', {
    value: create,
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  render(<App />);
  const u = user();
  await u.click(screen.getByText('Relationship backups'));
  await u.click(
    screen.getByRole('button', { name: 'Export selected relationship web' }),
  );
  await u.click(
    screen.getByRole('button', { name: 'Export all relationship data' }),
  );
  expect(create).toHaveBeenCalledTimes(2);
  expect(
    click.mock.contexts.map((a) => (a as HTMLAnchorElement).download),
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('relationship-profile'),
      expect.stringContaining('all-relationship-webs'),
    ]),
  );
});
it.each([50, 100, 200])(
  'renders %i character cards with simplified large-graph details',
  (count) => {
    const web = emptyWeb();
    web.nodes = Array.from({ length: count }, (_, i) => ({
      ...standaloneNode(),
      id: `n${i}`,
      label: `Sim ${i}`,
      age: 'adult' as const,
      x: (i % 5) * 240,
      y: Math.floor(i / 5) * 150,
    }));
    web.edges = web.nodes
      .slice(1)
      .map((n, i) => ({ ...newConnection(), from: web.nodes[i].id, to: n.id }));
    const start = performance.now();
    render(
      <RelationshipGraph
        web={web}
        nodes={web.nodes}
        edges={web.edges}
        selected=""
        disabled={false}
        worlds={new Map()}
        onSelect={() => {}}
        onPosition={() => {}}
        onView={() => {}}
        onReset={() => {}}
      />,
    );
    const elapsed = performance.now() - start;
    expect(screen.getAllByRole('button', { name: /Select Sim/ })).toHaveLength(
      count,
    );
    if (count > 100)
      expect(screen.queryByText('adult')).not.toBeInTheDocument();
    console.info(
      `Graph render ${count} nodes/${count - 1} edges: ${elapsed.toFixed(1)} ms`,
    );
    expect(elapsed).toBeLessThan(5000);
  },
);
it('persists a touch-style pointer drag once on release and permits canvas panning', () => {
  vi.stubGlobal('PointerEvent', MouseEvent);
  const web = emptyWeb();
  web.nodes = [
    { ...standaloneNode(), id: 'touch', label: 'Touch Sim', x: 20, y: 30 },
  ];
  const position = vi.fn(),
    view = vi.fn();
  render(
    <RelationshipGraph
      web={web}
      nodes={web.nodes}
      edges={[]}
      selected=""
      disabled={false}
      worlds={new Map()}
      onSelect={() => {}}
      onPosition={position}
      onView={view}
      onReset={() => {}}
    />,
  );
  const card = screen.getByRole('button', {
    name: 'Select Touch Sim · Standalone Sim',
  });
  fireEvent.pointerDown(card, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(card, { clientX: 160, clientY: 140 });
  expect(position).not.toHaveBeenCalled();
  fireEvent.pointerUp(card, { clientX: 160, clientY: 140 });
  expect(position).toHaveBeenCalledExactlyOnceWith('touch', 80, 70);
  const canvas = document.querySelector('.relationship-canvas')!;
  fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100 });
  fireEvent.pointerUp(canvas, { clientX: 150, clientY: 160 });
  expect(view).toHaveBeenCalledExactlyOnceWith({
    ...web.view,
    panX: 70,
    panY: 80,
  });
  vi.unstubAllGlobals();
});
function seed(assigned = false) {
  const p = newProfile('Main save');
  p.relationshipWeb = {
    ...emptyWeb(),
    nodes: ['Alex', 'Blair', 'Casey'].map((label) => ({
      ...standaloneNode(),
      id: label,
      label,
      age: 'adult' as const,
    })),
  };
  if (assigned) {
    const entry = householdEntry();
    localStorage.setItem(
      BOARD_KEY,
      JSON.stringify({ schemaVersion: 1, entries: [entry] }),
    );
    const assignedProfile = assignHousehold(p, entry, {
      worldId: catalog.worlds[0].id,
      neighborhoodId: '',
      lotId: '',
      arrangement: '',
      notes: '',
      placed: false,
    });
    Object.assign(p, assignedProfile);
    p.relationshipWeb = reconcileWeb(p, []);
  }
  store([p]);
  return p;
}
function store(profiles: SaveProfile[]) {
  localStorage.setItem(
    PLANNING_KEY,
    JSON.stringify({
      schemaVersion: 1,
      selectedProfileId: profiles[0]?.id ?? '',
      profiles,
    }),
  );
}
const read = () => parsePlanning(localStorage.getItem(PLANNING_KEY)!, catalog);
const list = () =>
  within(screen.getByRole('region', { name: 'Relationship list' }));
const chars = () =>
  within(screen.getByRole('region', { name: 'Character list' }));
function file(raw: string) {
  const f = new File([raw], 'web.json', { type: 'application/json' });
  Object.defineProperty(f, 'text', { value: async () => raw });
  return f;
}
beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/web';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function createFriend() {
  const u = user();
  await u.click(screen.getByRole('button', { name: 'Create relationship' }));
  await u.selectOptions(screen.getByLabelText('First Sim'), 'Alex');
  await u.selectOptions(screen.getByLabelText('Second Sim'), 'Blair');
  await u.click(screen.getByRole('button', { name: 'Save connection' }));
}
it('provides an empty profile prompt and keeps all six generator links', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: 'Relationship Web', level: 1 }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Create a save-file profile/)).toBeInTheDocument();
  const nav = within(
    screen.getByRole('navigation', { name: 'Main navigation' }),
  );
  for (const name of [
    'Households',
    'Individual Sims',
    'Aesthetics',
    'Worlds & lots',
    'Relationships',
    'Mature stories',
  ])
    expect(
      nav.getByRole('link', { name: new RegExp(name) }),
    ).toBeInTheDocument();
});
it('creates standalone characters from the accessible form', async () => {
  seed();
  render(<App />);
  const u = user();
  await u.click(screen.getByRole('button', { name: 'Add standalone Sim' }));
  await u.type(screen.getByLabelText('Display label'), 'Robin');
  await u.selectOptions(screen.getByLabelText('Life stage'), 'young-adult');
  await u.click(screen.getByRole('button', { name: 'Save character' }));
  expect(chars().getByRole('heading', { name: 'Robin' })).toBeInTheDocument();
  expect(read().profiles[0].relationshipWeb!.nodes).toHaveLength(4);
});
it('creates and edits a relationship without using the graph', async () => {
  seed();
  render(<App />);
  await createFriend();
  expect(
    list().getByRole('heading', { name: 'Alex — Friends — Blair' }),
  ).toBeInTheDocument();
  const u = user();
  await u.click(
    list().getByRole('button', { name: 'Edit relationship Friends' }),
  );
  await u.type(
    screen.getByLabelText('Relationship notes'),
    'Met at the arcade',
  );
  await u.selectOptions(screen.getByLabelText('Relationship strength'), '4');
  await u.click(screen.getByRole('button', { name: 'Save connection' }));
  expect(list().getByText('Met at the arcade')).toBeInTheDocument();
  expect(read().profiles[0].relationshipWeb!.edges[0].strength).toBe(4);
});
it('prevents duplicate connections and retains existing details', async () => {
  seed();
  render(<App />);
  await createFriend();
  await createFriend();
  expect(screen.getByRole('alert')).toHaveTextContent(/identical/);
  expect(read().profiles[0].relationshipWeb!.edges).toHaveLength(1);
});
it('rejects adult romance with a minor in the form', async () => {
  const p = seed();
  p.relationshipWeb!.nodes[1].age = 'teen';
  store([p]);
  render(<App />);
  const u = user();
  await u.click(screen.getByRole('button', { name: 'Create relationship' }));
  await u.selectOptions(screen.getByLabelText('First Sim'), 'Alex');
  await u.selectOptions(screen.getByLabelText('Second Sim'), 'Blair');
  await u.selectOptions(screen.getByLabelText('Relationship type'), 'dating');
  await u.click(screen.getByLabelText(/Both Sims are consenting/));
  await u.click(screen.getByRole('button', { name: 'Save connection' }));
  expect(screen.getByRole('alert')).toHaveTextContent(/known Young Adult/);
  expect(read().profiles[0].relationshipWeb!.edges).toHaveLength(0);
});
it('requires confirmation to delete a connection and supports Escape cancellation', async () => {
  seed();
  render(<App />);
  await createFriend();
  const u = user();
  await u.click(
    list().getByRole('button', { name: 'Delete relationship Friends' }),
  );
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await u.keyboard('{Escape}');
  expect(read().profiles[0].relationshipWeb!.edges).toHaveLength(1);
  await u.click(
    list().getByRole('button', { name: 'Delete relationship Friends' }),
  );
  await u.click(screen.getByRole('button', { name: 'Confirm web action' }));
  expect(read().profiles[0].relationshipWeb!.edges).toHaveLength(0);
});
it('deletes a standalone character and its edges only after confirmation', async () => {
  seed();
  render(<App />);
  await createFriend();
  const u = user();
  await u.click(chars().getByRole('button', { name: 'Delete character Alex' }));
  await u.click(screen.getByRole('button', { name: 'Confirm web action' }));
  expect(read().profiles[0].relationshipWeb!.nodes).toHaveLength(2);
  expect(read().profiles[0].relationshipWeb!.edges).toHaveLength(0);
});
it('persists keyboard node positions across remounts', async () => {
  seed();
  const app = render(<App />);
  const u = user();
  const card = screen.getByRole('button', {
    name: 'Select Alex · Standalone Sim',
  });
  await u.click(card);
  await u.keyboard('{ArrowRight}{ArrowDown}');
  expect(read().profiles[0].relationshipWeb!.nodes[0]).toMatchObject({
    x: 20,
    y: 20,
  });
  app.unmount();
  render(<App />);
  expect(chars().getByText('Position: 20, 20')).toBeInTheDocument();
});
it('supports numerical position editing and list-only preference', async () => {
  seed();
  render(<App />);
  const u = user();
  await u.click(screen.getByLabelText('List view only'));
  expect(
    screen.queryByRole('region', { name: 'Visual relationship graph' }),
  ).not.toBeInTheDocument();
  await u.click(chars().getByRole('button', { name: 'Edit character Alex' }));
  const x = screen.getByLabelText('Horizontal position');
  await u.clear(x);
  await u.type(x, '187');
  await u.click(screen.getByRole('button', { name: 'Save character' }));
  expect(read().profiles[0].relationshipWeb!.nodes[0].x).toBe(187);
  expect(read().profiles[0].relationshipWeb!.view.listOnly).toBe(true);
});
it('keeps profile nodes and edges isolated while switching', async () => {
  const p = seed(),
    other = newProfile('Other save');
  store([p, other]);
  render(<App />);
  await createFriend();
  await user().selectOptions(
    screen.getByLabelText('Relationship save profile'),
    other.id,
  );
  expect(
    screen.queryByRole('heading', { name: 'Alex' }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/0 characters · 0 connections/)).toBeInTheDocument();
  await user().selectOptions(
    screen.getByLabelText('Relationship save profile'),
    p.id,
  );
  expect(
    list().getByRole('heading', { name: 'Alex — Friends — Blair' }),
  ).toBeInTheDocument();
});
it('searches and focuses through accessible filter controls', async () => {
  seed();
  render(<App />);
  await createFriend();
  const u = user();
  await u.click(screen.getByText('Search and filter connections'));
  await u.selectOptions(screen.getByLabelText('Focus mode'), 'Alex');
  expect(
    chars().queryByRole('heading', { name: 'Casey' }),
  ).not.toBeInTheDocument();
  expect(chars().getByRole('heading', { name: 'Blair' })).toBeInTheDocument();
  await u.type(
    screen.getByLabelText('Search characters and connections'),
    'Alex',
  );
  expect(
    chars().queryByRole('heading', { name: 'Blair' }),
  ).not.toBeInTheDocument();
});
it('retains original snapshots and integrates Casting Board household links', async () => {
  const p = seed(true),
    original = localStorage.getItem(BOARD_KEY);
  window.location.hash = '#/casting';
  render(<App />);
  const u = user();
  await u.click(screen.getByText('View in Relationship Web'));
  await u.click(
    screen.getByRole('link', {
      name: 'Main save — View household relationships',
    }),
  );
  expect(
    screen.getByRole('heading', { name: 'Relationship Web', level: 1 }),
  ).toBeInTheDocument();
  expect(read().profiles[0].relationshipWeb!.filters.householdId).toBe(
    p.assignments[0].householdId,
  );
  expect(localStorage.getItem(BOARD_KEY)).toBe(original);
});
it('shows orphan history and detaches without deleting relationships', async () => {
  const p = seed(true),
    source = p.relationshipWeb!.nodes.find((n) => n.householdId)!;
  p.relationshipWeb!.edges = [
    { ...newConnection(), from: source.id, to: 'Alex' },
  ];
  p.assignments = [];
  store([p]);
  render(<App />);
  const u = user();
  expect(chars().getAllByText(/Orphaned: household/).length).toBeGreaterThan(0);
  await u.click(
    chars().getByRole('button', {
      name: `Detach ${source.label} as standalone`,
    }),
  );
  const updated = read().profiles[0].relationshipWeb!;
  expect(updated.edges).toHaveLength(1);
  expect(updated.nodes.find((n) => n.label === source.label)?.householdId).toBe(
    '',
  );
});
it('previews imports and merges exact connections once', async () => {
  const p = seed();
  p.relationshipWeb!.edges = [
    { ...newConnection(), from: 'Alex', to: 'Blair' },
  ];
  store([p]);
  render(<App />);
  const u = user();
  await u.click(screen.getByText('Relationship backups'));
  await u.upload(
    screen.getByLabelText('Import relationship JSON'),
    file(exportWeb([p], [])),
  );
  expect(
    screen.getByRole('region', { name: 'Relationship import preview' }),
  ).toHaveTextContent('3 characters · 1 connections');
  await u.click(
    screen.getByRole('button', { name: 'Merge relationship data' }),
  );
  expect(read().profiles[0].relationshipWeb!.edges).toHaveLength(1);
});
it('requires confirmation before replacing imported webs while keeping assignments', async () => {
  const p = seed(true),
    incoming = clone(p);
  incoming.relationshipWeb = emptyWeb();
  render(<App />);
  const u = user();
  await u.click(screen.getByText('Relationship backups'));
  await u.upload(
    screen.getByLabelText('Import relationship JSON'),
    file(exportWeb([incoming], [])),
  );
  await u.click(screen.getByRole('button', { name: 'Replace imported webs…' }));
  expect(screen.getByRole('dialog')).toHaveTextContent(/Household assignments/);
  await u.click(
    screen.getByRole('button', { name: 'Confirm web replacement' }),
  );
  expect(read().profiles[0].assignments).toHaveLength(1);
});
it('preserves corrupt storage and exposes planner recovery without writing', () => {
  const raw = '{broken';
  localStorage.setItem(PLANNING_KEY, raw);
  render(<App />);
  expect(
    screen.getByRole('status', { name: 'Relationship storage status' }),
  ).toHaveTextContent(/unreadable/);
  expect(localStorage.getItem(PLANNING_KEY)).toBe(raw);
  expect(
    screen.getByRole('link', { name: 'Population backups and recovery' }),
  ).toBeInTheDocument();
});
it('blocks stale-tab writes even if the storage event was missed', async () => {
  seed();
  render(<App />);
  const external = localStorage.getItem(PLANNING_KEY)! + ' ';
  localStorage.setItem(PLANNING_KEY, external);
  const u = user();
  await u.click(screen.getByRole('button', { name: 'Add standalone Sim' }));
  await u.type(screen.getByLabelText('Display label'), 'New Sim');
  await u.click(screen.getByRole('button', { name: 'Save character' }));
  expect(
    screen.getByRole('status', { name: 'Relationship storage status' }),
  ).toHaveTextContent(/another tab/);
  expect(localStorage.getItem(PLANNING_KEY)).toBe(external);
});
it('blocks edits when a storage event arrives', () => {
  seed();
  render(<App />);
  fireEvent(
    window,
    new StorageEvent('storage', { key: PLANNING_KEY, newValue: 'changed' }),
  );
  expect(
    screen.getByRole('button', { name: 'Add standalone Sim' }),
  ).toBeDisabled();
});
it('leaves previous plans unchanged when storage quota is exhausted', async () => {
  seed();
  render(<App />);
  const raw = localStorage.getItem(PLANNING_KEY);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Full', 'QuotaExceededError');
  });
  const u = user();
  await u.click(screen.getByRole('button', { name: 'Add standalone Sim' }));
  await u.type(screen.getByLabelText('Display label'), 'Quota Sim');
  await u.click(screen.getByRole('button', { name: 'Save character' }));
  expect(
    screen.getByRole('status', { name: 'Relationship storage status' }),
  ).toHaveTextContent(/storage is full/);
  expect(localStorage.getItem(PLANNING_KEY)).toBe(raw);
});
it('confirms reset layout instead of overwriting saved positions on render', async () => {
  const p = seed();
  p.relationshipWeb!.nodes[0].x = 77;
  store([p]);
  render(<App />);
  expect(read().profiles[0].relationshipWeb!.nodes[0].x).toBe(77);
  const u = user();
  await u.click(screen.getByRole('button', { name: 'Reset layout…' }));
  expect(read().profiles[0].relationshipWeb!.nodes[0].x).toBe(77);
  await u.click(screen.getByRole('button', { name: 'Confirm web action' }));
  expect(read().profiles[0].relationshipWeb!.nodes[0].x).toBe(0);
});
