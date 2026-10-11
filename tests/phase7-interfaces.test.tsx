// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { BOARD_KEY, parseBoard } from '../src/utils/casting';
import { defaultSettings, SETTINGS_KEY } from '../src/utils/preferences';
beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/aesthetic';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const settings = defaultSettings();
  settings.preferences.ownedPacks = ['werewolves'];
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('filters the directory, expands styling tips and favorites a canonical aesthetic', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(
    screen.getByLabelText('Style classification'),
    'established',
  );
  await user.selectOptions(screen.getByLabelText('Style rarity'), 'uncommon');
  await user.type(screen.getByLabelText('Search aesthetics'), 'trad goth');
  await user.click(
    screen.getByText('Browse the styling library · 1 of 200 styles'),
  );
  await user.click(
    await screen.findByText('Styling tips for Traditional Goth'),
  );
  expect(
    await screen.findByRole('heading', { name: 'Traditional Goth' }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Favorite · Traditional Goth' }),
  );
  const entry = parseBoard(localStorage.getItem(BOARD_KEY)!).entries[0];
  expect(entry).toMatchObject({
    type: 'aesthetic',
    favorite: true,
    title: 'Traditional Goth',
  });
  expect(
    (entry.content.snapshot.styles as { styleType: string }[])[0].styleType,
  ).toBe('established');
  await user.click(screen.getByRole('link', { name: 'Casting Board' }));
  expect(
    screen.getByRole('heading', { name: 'Traditional Goth' }),
  ).toBeInTheDocument();
});
it('paginates the directory without rendering hidden full styling cards', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(document.querySelectorAll('.library-grid > article')).toHaveLength(0);
  await user.click(screen.getByText(/Browse the styling library/));
  await waitFor(() =>
    expect(document.querySelectorAll('.library-grid > article')).toHaveLength(
      24,
    ),
  );
  expect(document.querySelectorAll('.aesthetic-result')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Show 24 more styles' }));
  expect(document.querySelectorAll('.library-grid > article')).toHaveLength(48);
  await user.type(screen.getByLabelText('Search aesthetics'), 'Forest Girl');
  expect(document.querySelectorAll('.library-grid > article')).toHaveLength(1);
});
it('filters by associated world independently of inspiration weighting', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.selectOptions(
    screen.getByLabelText('Filter by associated world'),
    'library:world:moonwood-mill',
  );
  await user.type(
    screen.getByLabelText('Search aesthetics'),
    'Forest Goth Layering',
  );
  await user.click(screen.getByRole('button', { name: /Generate aesthetic/ }));
  expect(
    screen.getByRole('heading', { name: 'Forest Goth Layering' }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Inspiration world')).toHaveValue('');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
