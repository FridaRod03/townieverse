// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { BOARD_KEY, exportJson } from '../src/utils/casting';
import { newProfile, PLANNING_KEY } from '../src/utils/planning';
import { emptyWeb, newConnection, standaloneNode } from '../src/utils/web';
import { defaultSettings, SETTINGS_KEY } from '../src/utils/preferences';
import { householdEntry } from './casting-fixtures';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/home';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('starts with no demo saves and opt-in mature themes, with keyboard-accessible privacy guidance', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(localStorage.getItem(BOARD_KEY)).toBeNull();
  expect(localStorage.getItem(PLANNING_KEY)).toBeNull();
  const preferences = defaultSettings().preferences;
  expect(preferences.allowAdultRomance).toBe(false);
  expect(preferences.allowCrime).toBe(false);
  expect(preferences.allowSubstanceUse).toBe(false);
  const summary = screen.getByText('Public beta · Privacy & your saves');
  summary.focus();
  expect(summary).toHaveFocus();
  // jsdom does not implement native summary keyboard activation; production
  // browser checks cover Enter/Space. Its click default action is supported.
  await user.click(summary);
  expect(summary.parentElement).toHaveAttribute('open');
  expect(
    screen.getByText(/Localhost saves do not automatically transfer/),
  ).toBeVisible();
  expect(
    screen.getByText(/Not affiliated with or endorsed by Electronic Arts/),
  ).toBeInTheDocument();
});

it('retains existing collection, web, profile and preference bytes across application remounts', () => {
  const household = householdEntry();
  household.notes = 'Keep this private story';
  household.favorite = true;
  const profile = newProfile('Existing save');
  const alex = { ...standaloneNode(), label: 'Alex', age: 'adult' as const };
  const blair = { ...standaloneNode(), label: 'Blair', age: 'adult' as const };
  profile.relationshipWeb = {
    ...emptyWeb(),
    nodes: [alex, blair],
    edges: [
      {
        ...newConnection(),
        from: alex.id,
        to: blair.id,
        type: 'friends',
        notes: 'Keep this connection',
      },
    ],
  };
  const stored = {
    [BOARD_KEY]: exportJson([household]),
    [PLANNING_KEY]: JSON.stringify({
      schemaVersion: 1,
      selectedProfileId: profile.id,
      profiles: [profile],
    }),
    [SETTINGS_KEY]: JSON.stringify(defaultSettings()),
  };
  for (const [key, value] of Object.entries(stored))
    localStorage.setItem(key, value);
  window.location.hash = '#/web';
  const first = render(<App />);
  expect(
    screen.getByRole('heading', { name: 'Relationship Web', level: 1 }),
  ).toBeInTheDocument();
  expect(screen.getAllByText('Alex').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Blair').length).toBeGreaterThan(0);
  first.unmount();
  render(<App />);
  expect(screen.getAllByText('Alex').length).toBeGreaterThan(0);
  for (const [key, value] of Object.entries(stored))
    expect(localStorage.getItem(key)).toBe(value);
});
