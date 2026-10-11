// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { defaultSettings, SETTINGS_KEY } from '../src/utils/preferences';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/home';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const settings = defaultSettings();
  settings.seed = 'expanded-ui';
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('generates a real expanded household with individually labeled fields', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Generate Household/ }));
  expect(document.querySelectorAll('.sim-profile').length).toBeGreaterThan(0);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(
    screen.getByText(/Official game fields are labeled individually/),
  ).toBeInTheDocument();
});
it('browses and generates a canonical style through an alias with full styling details', async () => {
  window.location.hash = '#/aesthetic';
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Search aesthetics'), 'Forest Girl');
  expect(
    screen.getByText('Browse the styling library · 1 of 200 styles'),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Generate aesthetic/ }));
  expect(screen.getByRole('heading', { name: 'Mori Kei' })).toBeInTheDocument();
  expect(screen.getByText('Hair suggestions')).toBeInTheDocument();
  expect(screen.getByText('Optional makeup')).toBeInTheDocument();
  expect(
    screen.getByText(/skin tone is never a costume requirement/),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Households' }));
  await user.click(screen.getByRole('button', { name: /Generate Household/ }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mori Kei' })).toBeInTheDocument();
});
it('retains verified world generation when roleplay is disabled and groups all pack controls', async () => {
  const settings = defaultSettings();
  settings.preferences.allowRoleplayContent = false;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.location.hash = '#/world';
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Generate world' }));
  expect(screen.getByText('OFFICIAL RESIDENTIAL WORLD')).toBeInTheDocument();
  expect(screen.getByText('World sources')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await user.click(screen.getByText('Shared settings'));
  expect(screen.getByText('Expansion packs · 21')).toBeInTheDocument();
  expect(screen.getByText('Game packs · 12')).toBeInTheDocument();
  expect(screen.getByText('Stuff packs · 20')).toBeInTheDocument();
  expect(screen.getByText('Kits · 62')).toBeInTheDocument();
});
