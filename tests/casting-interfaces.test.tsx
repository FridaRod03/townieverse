// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { CastingProvider } from '../src/components/CastingProvider';
import { useCasting } from '../src/hooks/CastingContext';
import { BOARD_KEY, exportJson } from '../src/utils/casting';
import { SETTINGS_KEY } from '../src/utils/preferences';
import { entryOf, householdEntry } from './casting-fixtures';
beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/casting';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const store = (entries = [householdEntry()]) =>
  localStorage.setItem(
    BOARD_KEY,
    JSON.stringify({ schemaVersion: 1, entries }),
  );
const stored = () => JSON.parse(localStorage.getItem(BOARD_KEY)!);
function Harness() {
  const state = useCasting();
  const sample = entryOf('sim');
  return (
    <>
      <button onClick={() => state.save('sim', 'Saved Sim', sample.content)}>
        Save test
      </button>
      <button
        onClick={() =>
          state.importBoard(
            { schemaVersion: 1, entries: [sample] },
            'replace',
            false,
          )
        }
      >
        Unconfirmed replacement
      </button>
      <pre data-testid="state">{JSON.stringify(state.board)}</pre>
    </>
  );
}
it('offers a helpful empty state and browser-specific backup reminder', () => {
  render(<App />);
  expect(screen.getByText('Your Casting Board is empty!')).toBeInTheDocument();
  expect(
    screen.getByText(/not automatically synchronized/),
  ).toBeInTheDocument();
});
it('saves exact household snapshots, prevents repeat saves, and keeps individual progress', async () => {
  window.location.hash = '#/household';
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Generate Household/ }));
  const saves = screen.getAllByRole('button', {
    name: 'Save to Casting Board',
  });
  await user.click(saves[saves.length - 1]);
  const board = stored();
  expect(board.entries).toHaveLength(1);
  expect(board.entries[0].type).toBe('household');
  const original = board.entries[0].content;
  expect(original.snapshot.generatedTitle).toBe(board.entries[0].title);
  expect(original.text).toContain(board.entries[0].title);
  await user.click(
    screen.getByRole('button', { name: 'Saved to Casting Board' }),
  );
  expect(stored().entries).toHaveLength(1);
  expect(stored().entries[0].content).toEqual(original);
  await user.click(screen.getByRole('button', { name: /Generate Household/ }));
  expect(stored().entries[0].content).toEqual(original);
  await user.click(screen.getByRole('link', { name: 'Casting Board' }));
  expect(await screen.findByText('1 of 1 saved entries')).toBeInTheDocument();
});
it('edits title, notes, tags, world, overall status and separate member status without changing generated content', async () => {
  const entry = householdEntry();
  store([entry]);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Edit entry' }));
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), 'The Holloways');
  await user.type(screen.getByLabelText('Notes'), 'Build their kitchen');
  await user.type(
    screen.getByLabelText('Tags (comma-separated)'),
    '#AltTownies, CreatedInCAS',
  );
  await user.clear(screen.getByLabelText('World association'));
  await user.type(screen.getByLabelText('World association'), 'Windenburg');
  await user.selectOptions(
    screen.getByLabelText('Progress status'),
    'Planning',
  );
  await user.selectOptions(
    screen.getByLabelText(`Sim 1 · ${entry.content.members[0].name} status`),
    'Created in CAS',
  );
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(stored().entries[0]).toMatchObject({
    title: 'The Holloways',
    notes: 'Build their kitchen',
    tags: ['AltTownies', 'CreatedInCAS'],
    world: 'Windenburg',
    status: 'Planning',
  });
  expect(stored().entries[0].memberProgress[entry.content.members[0].id]).toBe(
    'Created in CAS',
  );
  expect(stored().entries[0].content).toEqual(entry.content);
  await user.click(screen.getByRole('button', { name: 'Edit entry' }));
  await user.clear(screen.getByLabelText('Tags (comma-separated)'));
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(stored().entries[0].tags).toEqual([]);
});
it('persists favorites after remount and filters favorites only', async () => {
  const entry = householdEntry();
  store([entry, entryOf('sim')]);
  const user = userEvent.setup();
  const app = render(<App />);
  await user.click(
    screen.getByRole('button', { name: `Favorite ${entry.title}` }),
  );
  expect(stored().entries[0].favorite).toBe(true);
  app.unmount();
  render(<App />);
  await user.click(screen.getByLabelText('Favorites only'));
  expect(screen.getByText('1 of 2 saved entries')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: `Unfavorite ${entry.title}` }),
  ).toHaveAttribute('aria-pressed', 'true');
});
it('duplicates metadata and exact snapshots into independent entries', async () => {
  store();
  const original = stored().entries[0];
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Duplicate' }));
  const entries = stored().entries;
  expect(entries).toHaveLength(2);
  expect(entries[1].id).not.toBe(original.id);
  expect(entries[1].content).toEqual(original.content);
  expect(entries[1].title).toMatch(/alternate/);
});
it('supports search, type, world, status, tag and sort controls', async () => {
  const a = householdEntry(),
    b = entryOf('sim');
  a.tags = ['Occult'];
  a.status = 'Planning';
  store([a, b]);
  const user = userEvent.setup();
  render(<App />);
  await user.type(
    screen.getByLabelText('Search Casting Board'),
    'Test household',
  );
  await user.selectOptions(screen.getByLabelText('Entry type'), 'household');
  await user.selectOptions(screen.getByLabelText('Filter by world'), a.world);
  await user.selectOptions(
    screen.getByLabelText('Filter by status'),
    'Planning',
  );
  await user.selectOptions(screen.getByLabelText('Filter by tag'), 'Occult');
  await user.selectOptions(
    screen.getByLabelText('Sort entries'),
    'alphabetical',
  );
  expect(screen.getByText('1 of 2 saved entries')).toBeInTheDocument();
});
it('requires delete confirmation and supports escape, keyboard focus and cancellation', async () => {
  store();
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Delete entry' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(
    within(dialog).getByRole('button', { name: 'Confirm delete' }),
  ).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(stored().entries).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Delete entry' }));
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
  expect(stored().entries).toHaveLength(0);
});
it('preserves corrupt raw storage and only resets it after explicit confirmation', async () => {
  localStorage.setItem(BOARD_KEY, '{broken');
  const user = userEvent.setup();
  render(<App />);
  expect(
    screen.getByRole('button', { name: 'Export raw recovery data' }),
  ).toBeInTheDocument();
  expect(localStorage.getItem(BOARD_KEY)).toBe('{broken');
  await user.click(
    screen.getByRole('button', { name: 'Start a new empty board' }),
  );
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(localStorage.getItem(BOARD_KEY)).toBe('{broken');
  await user.click(
    screen.getByRole('button', { name: 'Start a new empty board' }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Confirm new empty board' }),
  );
  expect(stored().entries).toEqual([]);
});
it('rejects an unconfirmed provider replacement without modifying saved entries', async () => {
  store();
  const before = localStorage.getItem(BOARD_KEY);
  const user = userEvent.setup();
  render(
    <CastingProvider>
      <Harness />
    </CastingProvider>,
  );
  await user.click(
    screen.getByRole('button', { name: 'Unconfirmed replacement' }),
  );
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
  expect(screen.getByRole('status')).toHaveTextContent(/Confirm replacement/);
});
it('handles quota failures atomically and leaves preferences and theme untouched', async () => {
  store();
  localStorage.setItem(SETTINGS_KEY, 'preference sentinel');
  localStorage.setItem('townieverse.theme', 'dark');
  const before = localStorage.getItem(BOARD_KEY);
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Full', 'QuotaExceededError');
  });
  const user = userEvent.setup();
  render(
    <CastingProvider>
      <Harness />
    </CastingProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'Save test' }));
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
  expect(screen.getByRole('status')).toHaveTextContent(/storage is full/);
  expect(localStorage.getItem(SETTINGS_KEY)).toBe('preference sentinel');
  expect(localStorage.getItem('townieverse.theme')).toBe('dark');
  spy.mockRestore();
});
it('detects another tab changing the board instead of overwriting it', async () => {
  store();
  const user = userEvent.setup();
  render(
    <CastingProvider>
      <Harness />
    </CastingProvider>,
  );
  localStorage.setItem(BOARD_KEY, exportJson([entryOf('aesthetic')]));
  const changed = localStorage.getItem(BOARD_KEY);
  await user.click(screen.getByRole('button', { name: 'Save test' }));
  expect(localStorage.getItem(BOARD_KEY)).toBe(changed);
  expect(screen.getByRole('status')).toHaveTextContent(/another tab/);
});
function backupFile(raw: string) {
  const file = new File([raw], 'backup.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => raw });
  return file;
}
it.each([
  ['sim', 'Generate Sim', 'sim'],
  ['aesthetic', 'Generate aesthetic', 'aesthetic'],
  ['world', 'Generate world', 'world'],
  ['relationship', 'Generate relationship', 'relationship'],
] as const)(
  'saves and favorites a real %s generator result',
  async (page, button, type) => {
    window.location.hash = `#/${page}`;
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: button }));
    await user.click(screen.getByRole('button', { name: 'Favorite' }));
    expect(stored().entries).toHaveLength(1);
    expect(stored().entries[0]).toMatchObject({ type, favorite: true });
    await user.click(
      screen.getByRole('button', { name: 'Saved to Casting Board' }),
    );
    expect(stored().entries).toHaveLength(1);
  },
);
it('saves an enabled adult storyline and its exact participant', async () => {
  window.location.hash = '#/mature';
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    within(
      document.querySelector('.generator-page .mature-settings') as HTMLElement,
    ).getByLabelText('Crime storylines'),
  );
  await user.click(
    screen.getByRole('button', { name: /Generate narrative twist/ }),
  );
  await user.click(
    screen.getByRole('button', { name: 'Save to Casting Board' }),
  );
  expect(stored().entries[0].type).toBe('storyline');
  expect(stored().entries[0].content.snapshot.age).toBe('adult');
});
it('downloads single and whole-board JSON and TXT with timestamped filenames', async () => {
  const create = vi.fn(() => 'blob:test');
  const revoke = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', {
    value: create,
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: revoke,
    configurable: true,
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  store();
  const user = userEvent.setup();
  render(<App />);
  for (const name of [
    'Export Backup',
    'Export board as TXT',
    'Export JSON',
    'Export TXT',
  ])
    await user.click(screen.getByRole('button', { name }));
  expect(create).toHaveBeenCalledTimes(4);
  expect(click).toHaveBeenCalledTimes(4);
  for (const call of click.mock.contexts)
    expect((call as HTMLAnchorElement).download).toMatch(
      /^townieverse-.+-\d{4}-\d\d-\d\dT.+\.(json|txt)$/,
    );
});
it('previews a valid backup, merges it and skips exact duplicate IDs', async () => {
  const entry = householdEntry();
  store([entry]);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Import JSON backup'));
  await user.upload(
    screen.getByLabelText('Backup JSON file'),
    backupFile(exportJson([entry, entryOf('sim')])),
  );
  expect(
    screen.getByText('2 entries · 1 potential duplicate IDs'),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Import and merge' }));
  expect(stored().entries).toHaveLength(2);
});
it('validates replacement before confirmation and does not delete data on failed import', async () => {
  store();
  const before = localStorage.getItem(BOARD_KEY);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Import JSON backup'));
  await user.upload(
    screen.getByLabelText('Backup JSON file'),
    backupFile('{broken'),
  );
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
  expect(screen.queryByText('Import preview')).not.toBeInTheDocument();
  await user.upload(
    screen.getByLabelText('Backup JSON file'),
    backupFile(exportJson([entryOf('aesthetic')])),
  );
  await user.selectOptions(screen.getByLabelText('Import option'), 'replace');
  await user.click(screen.getByRole('button', { name: 'Import and replace' }));
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(localStorage.getItem(BOARD_KEY)).toBe(before);
  await user.click(screen.getByRole('button', { name: 'Import and replace' }));
  await user.click(screen.getByRole('button', { name: 'Confirm replacement' }));
  expect(stored().entries).toHaveLength(1);
  expect(stored().entries[0].type).toBe('aesthetic');
});
