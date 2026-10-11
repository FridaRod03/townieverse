import { defaultPreferences } from '../data/defaults';
import { catalog } from '../data/library';
import { LIFE_STAGES } from '../types/models';
import type { SharedSettings } from '../types/interface';
import { validatePreferences } from '../generators/eligibility';

export const SETTINGS_KEY = 'townieverse.settings.v1';
export function defaultSettings(): SharedSettings {
  return {
    version: 1,
    preferences: defaultPreferences(),
    minimumHouseholdSize: 1,
    seed: '',
  };
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
export function validStoredSettings(value: unknown): value is SharedSettings {
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.seed !== 'string' ||
    value.seed.length > 120 ||
    !Number.isInteger(value.minimumHouseholdSize) ||
    Number(value.minimumHouseholdSize) < 1 ||
    Number(value.minimumHouseholdSize) > 8 ||
    !record(value.preferences)
  )
    return false;
  const p = value.preferences;
  if (
    !strings(p.ownedPacks) ||
    !strings(p.allowedAges) ||
    !strings(p.aestheticCategories) ||
    p.allowedAges.some((age) => !LIFE_STAGES.includes(age as never)) ||
    p.ownedPacks.some((id) => !catalog.packs.some((pack) => pack.id === id)) ||
    p.aestheticCategories.some(
      (category) =>
        !catalog.aesthetics.some((entry) => entry.category === category),
    ) ||
    typeof p.aestheticSearch !== 'string' ||
    p.aestheticSearch.length > 200
  )
    return false;
  if (
    ![
      'allowAdultRomance',
      'allowCrime',
      'allowSubstanceUse',
      'allowCustomContent',
      'allowRoleplayContent',
    ].every((key) => typeof p[key] === 'boolean') ||
    typeof p.mode !== 'string' ||
    typeof p.maximumHouseholdSize !== 'number'
  )
    return false;
  return (
    validatePreferences(p as unknown as SharedSettings['preferences'])
      .success && Number(value.minimumHouseholdSize) <= p.maximumHouseholdSize
  );
}
export function readSettings(storage: Pick<Storage, 'getItem'>): {
  settings: SharedSettings;
  notice: string;
} {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { settings: defaultSettings(), notice: '' };
    const parsed: unknown = JSON.parse(raw);
    if (validStoredSettings(parsed)) return { settings: parsed, notice: '' };
    return {
      settings: defaultSettings(),
      notice: 'Stored settings were invalid. Safe defaults have been restored.',
    };
  } catch {
    return {
      settings: defaultSettings(),
      notice: 'Settings could not be loaded. This session uses safe defaults.',
    };
  }
}
