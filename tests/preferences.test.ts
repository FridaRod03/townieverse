import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  readSettings,
  validStoredSettings,
} from '../src/utils/preferences';

describe('stored UI preferences', () => {
  it('accepts valid settings and preserves independent toggles', () => {
    const settings = defaultSettings();
    settings.preferences.allowCrime = true;
    expect(validStoredSettings(settings)).toBe(true);
    expect(
      readSettings({ getItem: () => JSON.stringify(settings) }).settings,
    ).toEqual(settings);
    expect(settings.preferences.allowAdultRomance).toBe(false);
  });
  it.each([
    null,
    [],
    {},
    { version: 99 },
    { ...defaultSettings(), preferences: null },
    { ...defaultSettings(), seed: 12 },
    { ...defaultSettings(), minimumHouseholdSize: 9 },
  ])('rejects malformed stored values %j', (value) => {
    expect(validStoredSettings(value)).toBe(false);
  });
  it('rejects invalid preference arrays, unknown packs, and invalid ranges', () => {
    const settings = defaultSettings();
    expect(
      validStoredSettings({
        ...settings,
        preferences: { ...settings.preferences, ownedPacks: ['invented'] },
      }),
    ).toBe(false);
    expect(
      validStoredSettings({
        ...settings,
        preferences: { ...settings.preferences, allowedAges: ['unknown'] },
      }),
    ).toBe(false);
    expect(
      validStoredSettings({
        ...settings,
        preferences: { ...settings.preferences, aestheticCategories: [123] },
      }),
    ).toBe(false);
    expect(
      validStoredSettings({
        ...settings,
        minimumHouseholdSize: 3,
        preferences: { ...settings.preferences, maximumHouseholdSize: 2 },
      }),
    ).toBe(false);
  });
  it('falls back safely for invalid JSON and storage exceptions', () => {
    expect(readSettings({ getItem: () => '{invalid' }).settings).toEqual(
      defaultSettings(),
    );
    expect(
      readSettings({
        getItem: () => {
          throw new Error('blocked');
        },
      }).notice,
    ).not.toBe('');
  });
});
