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
import { BOARD_KEY, clone, parseBoard } from '../src/utils/casting';
import {
  assignHousehold,
  emptyPlanning,
  exportPlanning,
  newProfile,
  parsePlanning,
  PLANNING_KEY,
} from '../src/utils/planning';
import { defaultSettings, SETTINGS_KEY } from '../src/utils/preferences';
const world = catalog.worlds.find((w) => w.name === 'Willow Creek')!;
const read = () => parsePlanning(localStorage.getItem(PLANNING_KEY)!, catalog);
const storedProfile = () => {
  const p = newProfile('My Blank Save');
  localStorage.setItem(
    PLANNING_KEY,
    JSON.stringify({
      schemaVersion: 1,
      selectedProfileId: p.id,
      profiles: [p],
    }),
  );
  return p;
};
const storeAssignment = () => {
  const entry = householdEntry();
  localStorage.setItem(
    BOARD_KEY,
    JSON.stringify({ schemaVersion: 1, entries: [entry] }),
  );
  const p = assignHousehold(newProfile('Legacy Challenge'), entry, {
    worldId: world.id,
    neighborhoodId: '',
    lotId: '',
    arrangement: '',
    notes: '',
    placed: false,
  });
  localStorage.setItem(
    PLANNING_KEY,
    JSON.stringify({
      schemaVersion: 1,
      selectedProfileId: p.id,
      profiles: [p],
    }),
  );
  return p;
};
const file = (raw: string) => {
  const f = new File([raw], 'plans.json', { type: 'application/json' });
  Object.defineProperty(f, 'text', { value: async () => raw });
  return f;
};
beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/population';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('restores a missing assigned household from its preserved snapshot without erasing other board entries', async () => {
  const p = storeAssignment();
  localStorage.setItem(
    BOARD_KEY,
    JSON.stringify({ schemaVersion: 1, entries: [] }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  await user.click(screen.getByText(/Individual Sim progress ·/));
  await user.click(
    screen.getByRole('button', { name: 'Restore household to Casting Board' }),
  );
  expect(parseBoard(localStorage.getItem(BOARD_KEY)!).entries[0]).toEqual(
    p.assignments[0].household,
  );
  expect(read().profiles[0].assignments).toHaveLength(1);
});
it('exports selected/all profiles and a compatible assigned-household board backup', async () => {
  storeAssignment();
  const create = vi.fn(() => 'blob:plan');
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
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Planning backups and recovery'));
  for (const name of [
    'Export all profiles',
    'Export selected profile',
    'Export assigned households as Casting Board JSON',
  ])
    await user.click(screen.getByRole('button', { name }));
  expect(create).toHaveBeenCalledTimes(3);
  expect(click).toHaveBeenCalledTimes(3);
  expect(
    click.mock.contexts.map((a) => (a as HTMLAnchorElement).download),
  ).toEqual(
    expect.arrayContaining([
      expect.stringContaining('all-save-profiles'),
      expect.stringContaining('save-profile'),
      expect.stringContaining('assigned-households'),
    ]),
  );
});
it('shows an assignment removal confirmation and preserves the source household', async () => {
  storeAssignment();
  const before = localStorage.getItem(BOARD_KEY);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  await user.click(screen.getByRole('button', { name: 'Unassign household' }));
  expect(read().profiles[0].assignments).toHaveLength(1);
  await user.click(
    screen.getByRole('button', { name: 'Confirm unassignment' }),
  );
  expect(read().profiles[0].assignments).toHaveLength(0);
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
});
it('restores focus after closing a world detail section', async () => {
  storedProfile();
  const user = userEvent.setup();
  render(<App />);
  const button = screen.getByRole('button', { name: 'Plan Willow Creek' });
  await user.click(button);
  expect(
    screen.getByRole('heading', { name: 'Willow Creek planning' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Close world detail' }));
  expect(button).toHaveFocus();
});
it('creates a profile, displays all official worlds and starts at zero', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('New profile name'), 'My Blank Save');
  await user.click(screen.getByRole('button', { name: 'Create profile' }));
  expect(read().profiles).toHaveLength(1);
  expect(document.querySelectorAll('.world-plan-card')).toHaveLength(31);
  expect(
    within(
      screen.getByRole('region', { name: 'Selected profile statistics' }),
    ).getByText('Unique planned Sims').nextElementSibling,
  ).toHaveTextContent('0');
});
it('renames, duplicates and switches profiles without sharing assignment arrays', async () => {
  storedProfile();
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Edit profile name and notes'));
  await user.clear(screen.getByLabelText('Profile name'));
  await user.type(screen.getByLabelText('Profile name'), 'Occult Save');
  await user.type(
    screen.getByLabelText('Profile description / notes'),
    'Need elders',
  );
  await user.click(
    screen.getByRole('button', { name: 'Save profile details' }),
  );
  await user.click(screen.getByRole('button', { name: 'Duplicate profile' }));
  expect(read().profiles).toHaveLength(2);
  const original = read().profiles[0];
  await user.selectOptions(
    screen.getByLabelText('Selected save-file profile'),
    original.id,
  );
  expect(read().selectedProfileId).toBe(original.id);
  expect(read().profiles[0].description).toBe('Need elders');
});
it('requires confirmation to delete a profile and preserves board data', async () => {
  storeAssignment();
  const before = localStorage.getItem(BOARD_KEY);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Delete profile' }));
  await user.keyboard('{Escape}');
  expect(read().profiles).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Delete profile' }));
  await user.click(
    screen.getByRole('button', { name: 'Delete profile permanently' }),
  );
  expect(read().profiles).toHaveLength(0);
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
});
it('assigns directly from Casting Board without changing generated content', async () => {
  const p = storedProfile(),
    entry = householdEntry();
  localStorage.setItem(
    BOARD_KEY,
    JSON.stringify({ schemaVersion: 1, entries: [entry] }),
  );
  window.location.hash = '#/casting';
  const before = localStorage.getItem(BOARD_KEY);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Assign to World' }));
  await user.selectOptions(screen.getByLabelText('Assignment world'), world.id);
  await user.type(screen.getByLabelText('Assignment notes'), 'Reserve garden');
  await user.click(screen.getByRole('button', { name: 'Save assignment' }));
  expect(
    read().profiles.find((x) => x.id === p.id)!.assignments[0],
  ).toMatchObject({
    householdId: entry.id,
    worldId: world.id,
    notes: 'Reserve garden',
  });
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
});
it('updates an assignment and tracks member progress through the existing board store', async () => {
  const p = storeAssignment();
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  await user.click(screen.getByText(/Individual Sim progress ·/));
  const member = p.assignments[0].household.content.members[0];
  await user.selectOptions(
    screen.getByLabelText(`Sim 1 · ${member.name}`),
    'Created in CAS',
  );
  expect(
    parseBoard(localStorage.getItem(BOARD_KEY)!).entries[0].memberProgress[
      member.id
    ],
  ).toBe('Created in CAS');
  expect(read().profiles[0].assignments[0].placed).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Change assignment' }));
  await user.selectOptions(
    screen.getByLabelText('Assignment neighborhood'),
    world.neighborhoods[0].id,
  );
  await user.selectOptions(
    screen.getByLabelText('Household placement'),
    'placed',
  );
  await user.click(screen.getByRole('button', { name: 'Save assignment' }));
  expect(read().profiles[0].assignments[0]).toMatchObject({
    neighborhoodId: world.neighborhoods[0].id,
    placed: true,
  });
  expect(
    parseBoard(localStorage.getItem(BOARD_KEY)!).entries[0].memberProgress[
      member.id
    ],
  ).toBe('Created in CAS');
});
it('keeps disabled-pack assignments visible under the owned-packs filter', async () => {
  const p = storeAssignment(),
    w = catalog.worlds.find((w) => w.name === 'Windenburg')!;
  p.assignments[0].worldId = w.id;
  localStorage.setItem(
    PLANNING_KEY,
    JSON.stringify({
      schemaVersion: 1,
      selectedProfileId: p.id,
      profiles: [p],
    }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByLabelText('Owned-pack worlds + existing assignments'),
  );
  expect(
    screen.getByRole('button', { name: 'Plan Windenburg' }),
  ).toBeInTheDocument();
  expect(read().profiles[0].assignments[0].worldId).toBe(w.id);
});
it('adds custom lots without required dimensions and uses them in assignments', async () => {
  storeAssignment();
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  await user.click(screen.getByText('Custom lots · 0'));
  await user.type(
    screen.getByLabelText('Custom lot name'),
    'Community garden house',
  );
  await user.type(screen.getByLabelText('Custom lot description'), 'My build');
  await user.click(
    screen.getByRole('button', { name: 'Add custom planning lot' }),
  );
  const lot = read().profiles[0].customLots[0];
  expect(lot.size).toBeUndefined();
  await user.click(screen.getByRole('button', { name: 'Change assignment' }));
  await user.selectOptions(screen.getByLabelText('Assignment lot'), lot.id);
  await user.click(screen.getByRole('button', { name: 'Save assignment' }));
  expect(read().profiles[0].assignments[0].lotId).toBe(lot.id);
});
it('rejects partial custom dimensions without losing existing lots', async () => {
  storedProfile();
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  await user.click(screen.getByText('Custom lots · 0'));
  await user.type(screen.getByLabelText('Custom lot name'), 'My lot');
  await user.type(screen.getByLabelText('Optional lot width'), '20');
  await user.click(
    screen.getByRole('button', { name: 'Add custom planning lot' }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent('both dimensions');
  expect(read().profiles[0].customLots).toHaveLength(0);
});
it('persists world and neighborhood notes across reloads', async () => {
  storedProfile();
  const user = userEvent.setup();
  const app = render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  await user.type(
    screen.getByLabelText('World notes'),
    'Need more elderly residents',
  );
  await user.click(screen.getByRole('button', { name: 'Save world notes' }));
  expect(read().profiles[0].worldNotes[world.id]).toBe(
    'Need more elderly residents',
  );
  app.unmount();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Plan Willow Creek' }));
  expect(screen.getByLabelText('World notes')).toHaveValue(
    'Need more elderly residents',
  );
  const n = world.neighborhoods[0];
  await user.click(
    screen.getByText(`${n.name} · 0 households · 0 Sims · 0 placed households`),
  );
  await user.type(
    screen.getByLabelText(`Notes for ${n.name}`),
    'Working class',
  );
  await user.click(
    screen.getByRole('button', {
      name: `Save notes for ${n.name.toLowerCase()}`,
    }),
  );
  expect(read().profiles[0].neighborhoodNotes[n.id]).toBe('Working class');
});
it('previews import and merges without silently overwriting profile IDs', async () => {
  const p = storedProfile(),
    incoming = {
      schemaVersion: 1 as const,
      selectedProfileId: p.id,
      profiles: [{ ...p, description: 'Other version' }],
    };
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Planning backups and recovery'));
  await user.upload(
    screen.getByLabelText('Import planning JSON'),
    file(exportPlanning(incoming, [])),
  );
  expect(screen.getByText('Planning import preview')).toBeInTheDocument();
  expect(read().profiles).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Merge profiles' }));
  expect(read().profiles).toHaveLength(2);
  expect(read().profiles[0].description).toBe('');
});
it('requires confirmation before replacing profiles', async () => {
  storedProfile();
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Planning backups and recovery'));
  await user.upload(
    screen.getByLabelText('Import planning JSON'),
    file(JSON.stringify(emptyPlanning())),
  );
  await user.click(
    screen.getByRole('button', { name: 'Replace planning profiles…' }),
  );
  expect(read().profiles).toHaveLength(1);
  await user.click(
    screen.getByRole('button', { name: 'Confirm planning replacement' }),
  );
  expect(read().profiles).toHaveLength(0);
});
it('preserves corrupt raw data and recovers only after confirmation', async () => {
  localStorage.setItem(PLANNING_KEY, '{broken');
  const entry = householdEntry();
  const board = JSON.stringify({ schemaVersion: 1, entries: [entry] });
  localStorage.setItem(BOARD_KEY, board);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Planning backups and recovery'));
  await user.click(
    screen.getByRole('button', { name: 'Start empty planning store…' }),
  );
  expect(localStorage.getItem(PLANNING_KEY)).toBe('{broken');
  await user.click(
    screen.getByRole('button', { name: 'Confirm planning reset' }),
  );
  expect(read()).toEqual(emptyPlanning());
  expect(localStorage.getItem(BOARD_KEY)).toBe(board);
});
it('preserves previous planning data on quota failure', async () => {
  storedProfile();
  const before = localStorage.getItem(PLANNING_KEY),
    original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
    this: Storage,
    key,
    value,
  ) {
    if (key === PLANNING_KEY)
      throw new DOMException('Full', 'QuotaExceededError');
    return original.call(this, key, value);
  });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Duplicate profile' }));
  expect(localStorage.getItem(PLANNING_KEY)).toBe(before);
  expect(
    screen.getByRole('status', { name: 'Planning status' }),
  ).toHaveTextContent('storage is full');
});
it('blocks stale-tab overwrites even if the storage event was missed', async () => {
  const p = storedProfile();
  const user = userEvent.setup();
  render(<App />);
  const changed = JSON.stringify({
    schemaVersion: 1,
    selectedProfileId: p.id,
    profiles: [{ ...p, name: 'Other tab' }],
  });
  localStorage.setItem(PLANNING_KEY, changed);
  await user.click(screen.getByRole('button', { name: 'Duplicate profile' }));
  expect(localStorage.getItem(PLANNING_KEY)).toBe(changed);
  expect(
    screen.getByRole('status', { name: 'Planning status' }),
  ).toHaveTextContent('another tab');
});
it('responds to storage events by preventing edits', () => {
  storedProfile();
  render(<App />);
  fireEvent(
    window,
    new StorageEvent('storage', { key: PLANNING_KEY, newValue: 'changed' }),
  );
  expect(screen.getByRole('button', { name: 'Create profile' })).toBeDisabled();
  expect(
    screen.getByRole('status', { name: 'Planning status' }),
  ).toHaveTextContent('another tab');
});
it('preserves plan metadata when generator preferences change', () => {
  const p = storeAssignment();
  const settings = defaultSettings();
  settings.preferences.ownedPacks = [];
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  render(<App />);
  expect(read().profiles[0]).toEqual(p);
});
it('shows repeated-ID warnings and does not double count duplicated concepts', () => {
  const p = storeAssignment(),
    a = clone(p.assignments[0]);
  a.householdId = crypto.randomUUID();
  a.household.id = a.householdId;
  p.assignments.push(a);
  localStorage.setItem(
    PLANNING_KEY,
    JSON.stringify({
      schemaVersion: 1,
      selectedProfileId: p.id,
      profiles: [p],
    }),
  );
  render(<App />);
  expect(screen.getByText(/Repeated Sim IDs/)).toBeInTheDocument();
  const scope = within(
    screen.getByRole('region', { name: 'Selected profile statistics' }),
  );
  expect(
    scope.getByText('Unique planned Sims').nextElementSibling,
  ).toHaveTextContent(String(a.household.content.members.length));
});
