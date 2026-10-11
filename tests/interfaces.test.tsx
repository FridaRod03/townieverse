// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { defaultSettings, SETTINGS_KEY } from '../src/utils/preferences';
import { starterWorlds } from '../src/data/starter';

// Keep Phase 4's fixed-seed regression scenarios stable while production uses
// the expanded library. Phase 5 integration tests exercise the real catalog.
vi.mock('../src/data/library', async () => {
  const fixture = await import('../src/data/starter');
  return {
    catalog: fixture.starterCatalog,
    simData: fixture.starterSimData,
    twists: fixture.starterTwists,
  };
});

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/home';
  document.documentElement.dataset.theme = 'light';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const settings = defaultSettings();
  settings.seed = 'phase-four-tests';
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const openSettings = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByText('Shared settings', {}));

describe('generator interfaces', () => {
  it('has three primary entry points and generates an expandable household concept', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByRole('link', { name: /Create a Household/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Style a Sim' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Populate a World' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Generate Household/ }),
    );
    expect(
      screen.getByLabelText('Generated household concept'),
    ).toBeInTheDocument();
    const profile = document.querySelector('.sim-profile summary');
    if (!profile) throw new Error('Missing profile');
    await user.click(profile);
    expect(
      screen.getAllByText('Traits (roleplay suggestions)').length,
    ).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(
      /undefined|NaN|\[object Object\]/,
    );
  });
  it('preserves world locks through rerolls and navigation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: /Generate Household/ }),
    );
    const before = document.querySelector(
      '.concept-result .result-card h3',
    )?.textContent;
    await user.click(screen.getByRole('button', { name: 'Lock world' }));
    await user.click(
      screen.getByRole('button', { name: /Generate Household/ }),
    );
    expect(
      document.querySelector('.concept-result .result-card h3')?.textContent,
    ).toBe(before);
    await user.click(screen.getByRole('link', { name: /Create a Household/ }));
    await screen.findByRole('heading', { name: 'Households' });
    expect(
      screen.getByRole('button', { name: 'Unlock world' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
  it('reports invalid shared size settings without displaying malformed results', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openSettings(user);
    await user.clear(screen.getByLabelText('Minimum household size'));
    await user.type(screen.getByLabelText('Minimum household size'), '3');
    await user.clear(screen.getByLabelText('Maximum household size'));
    await user.type(screen.getByLabelText('Maximum household size'), '1');
    await user.click(
      screen.getByRole('button', { name: /Generate Household/ }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Minimum household size',
    );
  });
  it('persists seed, mode, packs and independent mature controls without changing theme', async () => {
    const user = userEvent.setup();
    localStorage.setItem('townieverse.theme', 'light');
    const view = render(<App />);
    await openSettings(user);
    await user.clear(screen.getByLabelText('Optional random seed'));
    await user.type(screen.getByLabelText('Optional random seed'), 'my-save');
    await user.selectOptions(
      screen.getByLabelText('Randomization mode'),
      'balanced',
    );
    await user.click(screen.getByLabelText('Vampires'));
    await user.click(screen.getByLabelText('Crime storylines'));
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(saved.preferences.allowAdultRomance).toBe(false);
    expect(saved.preferences.allowCrime).toBe(true);
    expect(localStorage.getItem('townieverse.theme')).toBe('light');
    view.unmount();
    render(<App />);
    await openSettings(user);
    expect(screen.getByLabelText('Optional random seed')).toHaveValue(
      'my-save',
    );
    expect(screen.getByLabelText('Randomization mode')).toHaveValue('balanced');
    expect(screen.getByLabelText('Vampires')).toBeChecked();
  });
  it('loads corrupt storage safely and reports an empty starter pool when roleplay is disabled', async () => {
    const user = userEvent.setup();
    localStorage.setItem(SETTINGS_KEY, 'invalid-json');
    render(<App />);
    await openSettings(user);
    expect(
      screen.getByText(/Settings could not be loaded/),
    ).toBeInTheDocument();
    await user.click(screen.getByText('Content options'));
    await user.click(
      screen.getByLabelText('Include fictional roleplay samples'),
    );
    await user.click(
      screen.getByRole('button', { name: /Generate Household/ }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No eligible options');
  });
  it('generates a child Sim with compatible roleplay occupation and locks career', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/sim';
    render(<App />);
    await user.selectOptions(screen.getByLabelText('Sim age'), 'child');
    await user.click(screen.getByRole('button', { name: /Generate Sim/ }));
    expect(
      screen.getByText('Occupation (roleplay)').nextElementSibling,
    ).toHaveTextContent('Student');
    await user.click(screen.getByRole('button', { name: 'Lock Sim career' }));
    await user.click(
      screen.getByRole('button', { name: 'Reroll personality' }),
    );
    expect(
      screen.getByText('Occupation (roleplay)').nextElementSibling,
    ).toHaveTextContent('Student');
    expect(
      screen.getByRole('button', { name: 'Unlock Sim career' }),
    ).toBeInTheDocument();
  });
  it('reports an incompatible locked age without overwriting the profile', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/sim';
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Generate Sim/ }));
    await user.click(screen.getByRole('button', { name: 'Lock Sim age' }));
    await user.selectOptions(screen.getByLabelText('Sim age'), 'child');
    await user.click(screen.getByRole('button', { name: /Generate Sim/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('chosen age differs');
    expect(
      document.querySelector('.sim-profile summary small'),
    ).toHaveTextContent('Young Adult');
  });
  it('generates a blend, independently rerolls the unlocked half, and handles empty search', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/aesthetic';
    render(<App />);
    await user.click(screen.getByLabelText('Blend two aesthetics'));
    await user.click(
      screen.getByRole('button', { name: /Generate aesthetic blend/ }),
    );
    expect(document.querySelectorAll('.aesthetic-result')).toHaveLength(2);
    const first = document.querySelector('.aesthetic-result h3')?.textContent;
    await user.click(screen.getByRole('button', { name: 'Lock aesthetic 1' }));
    await user.click(screen.getByRole('button', { name: 'Reroll style 2' }));
    expect(document.querySelector('.aesthetic-result h3')?.textContent).toBe(
      first,
    );
    await user.type(
      screen.getByLabelText('Search aesthetics'),
      'nonexistent-style',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate aesthetic blend/ }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'locked aesthetic conflicts',
    );
  });
  it('filters disabled pack worlds from aesthetic world choices', () => {
    window.location.hash = '#/aesthetic';
    render(<App />);
    const select = screen.getByLabelText('Inspiration world');
    expect(
      within(select).queryByRole('option', { name: /Moonlit Quarter/ }),
    ).not.toBeInTheDocument();
  });
  it('handles missing lots and supports custom lots and rolled-lot exhaustion', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/world';
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Generate world$/ }));
    const selectedName = document.querySelector('.result-card h3')?.textContent;
    const selected = starterWorlds.find((world) => world.name === selectedName);
    if (!selected) throw new Error('No world');
    await user.click(
      screen.getByRole('button', { name: 'Generate eligible lot' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No verified or custom exact lots',
    );
    await user.click(screen.getByText(/Add custom lots ·/));
    await user.type(
      screen.getByLabelText('Custom lot name'),
      'My garden house',
    );
    await user.selectOptions(
      screen.getByLabelText('Custom lot world'),
      selected.id,
    );
    await user.click(screen.getByRole('button', { name: 'Add custom lot' }));
    await user.click(
      screen.getByRole('button', { name: 'Generate eligible lot' }),
    );
    expect(screen.getByText('Exact lot').nextElementSibling).toHaveTextContent(
      'My garden house',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Generate eligible lot' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No verified or custom exact lots',
    );
  });
  it('generates friendship and rejects adult/teen romance', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/relationship';
    render(<App />);
    await user.selectOptions(
      screen.getByLabelText('Relationship type'),
      'friendship',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate relationship/ }),
    );
    expect(document.querySelector('.result-card')).toHaveTextContent(
      'Sim A & Sim B',
    );
    await user.selectOptions(screen.getByLabelText('Second Sim age'), 'teen');
    await user.selectOptions(
      screen.getByLabelText('Relationship type'),
      'romantic',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate relationship/ }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No eligible options');
  });
  it('mature controls default off and cannot assign sexual themes to a teen', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/mature';
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: /Generate narrative twist/ }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'All mature themes are off',
    );
    const panel = document.querySelector('.generator-page .mature-settings');
    if (!panel) throw new Error('No mature panel');
    await user.click(
      within(panel as HTMLElement).getByLabelText(
        'Adult romantic / sexual storylines',
      ),
    );
    await user.selectOptions(
      screen.getByLabelText('Storyline participant age'),
      'teen',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate narrative twist/ }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('require an adult age');
    await user.selectOptions(
      screen.getByLabelText('Storyline participant age'),
      'adult',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate narrative twist/ }),
    );
    expect(document.querySelector('.result-card')).toHaveTextContent(
      'A changing agreement',
    );
    await user.click(
      within(panel as HTMLElement).getByLabelText(
        'Adult romantic / sexual storylines',
      ),
    );
    expect(document.querySelector('.result-card')).not.toBeInTheDocument();
  });
  it('closes the mobile menu with Escape from its toggle and restores focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    const menu = screen.getByRole('button', { name: /Menu/ });
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
  });
  it('copies readable result text with an explicit sample label', async () => {
    const user = userEvent.setup();
    const write = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue();
    render(<App />);
    await user.click(
      screen.getByRole('button', { name: /Generate Household/ }),
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Copy result as text' }).at(-1)!,
    );
    await waitFor(() => expect(write).toHaveBeenCalled());
    expect(write.mock.calls[0][0]).toContain('starter / roleplay concept');
    expect(screen.getByText('Copied to clipboard.')).toBeInTheDocument();
  });
});
