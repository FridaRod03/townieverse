import { useStudio } from '../hooks/StudioContext';
import { defaultSettings } from '../utils/preferences';
import type { GeneratorPreferences, RandomizationMode } from '../types/models';
import { modeNames } from '../data/ui';
export function MatureSettings() {
  const { settings, setSettings } = useStudio();
  return (
    <fieldset className="mature-settings">
      <legend>Optional mature themes · 18+</legend>
      <p>
        Off by default. Non-graphic narrative prompts only. All mature content
        is restricted to Young Adult, Adult, and Elder participants.
      </p>
      {(
        [
          ['allowAdultRomance', 'Adult romantic / sexual storylines'],
          ['allowCrime', 'Crime storylines'],
          ['allowSubstanceUse', 'Substance-use storylines'],
        ] as const
      ).map(([key, label]) => (
        <label className="checkbox-label" key={key}>
          <input
            type="checkbox"
            checked={settings.preferences[key]}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                preferences: {
                  ...current.preferences,
                  [key]: event.target.checked,
                },
              }))
            }
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
export function SharedSettingsPanel() {
  const { settings, setSettings, catalog, notice } = useStudio();
  const update = <K extends keyof GeneratorPreferences>(
    key: K,
    value: GeneratorPreferences[K],
  ) =>
    setSettings((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  return (
    <details className="shared-settings">
      <summary>
        Shared settings <span>packs, mode, sizes & seed</span>
      </summary>
      <div className="settings-body">
        {notice && <p role="status">{notice}</p>}
        <div className="form-grid">
          <label>
            Randomization mode
            <select
              value={settings.preferences.mode}
              onChange={(event) =>
                update('mode', event.target.value as RandomizationMode)
              }
            >
              {modeNames.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Optional random seed
            <input
              maxLength={120}
              value={settings.seed}
              placeholder="e.g. my-autumn-save"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  seed: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Minimum household size
            <input
              type="number"
              min={1}
              max={8}
              value={settings.minimumHouseholdSize}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  minimumHouseholdSize: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Maximum household size
            <input
              type="number"
              min={1}
              max={8}
              value={settings.preferences.maximumHouseholdSize}
              onChange={(event) =>
                update('maximumHouseholdSize', Number(event.target.value))
              }
            />
          </label>
        </div>
        <p className="helper-text">
          A fixed seed repeats the same first roll after reloading. Each
          subsequent click advances its roll number. Invalid size ranges are not
          saved.
        </p>
        <fieldset>
          <legend>Owned packs</legend>
          <p>
            Base game is always available. Enable only packs you own; many packs
            are cataloged while their individual gameplay fields remain
            incomplete.
          </p>
          {(['expansion', 'game', 'stuff', 'kit'] as const).map((type) => (
            <details key={type} className="advanced-settings">
              <summary>
                {type === 'expansion'
                  ? 'Expansion packs'
                  : type === 'game'
                    ? 'Game packs'
                    : type === 'stuff'
                      ? 'Stuff packs'
                      : 'Kits'}{' '}
                · {catalog.packs.filter((pack) => pack.type === type).length}
              </summary>
              {catalog.packs
                .filter((pack) => pack.type === type)
                .map((pack) => (
                  <label key={pack.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.preferences.ownedPacks.includes(
                        pack.id,
                      )}
                      onChange={(event) =>
                        update(
                          'ownedPacks',
                          event.target.checked
                            ? [...settings.preferences.ownedPacks, pack.id]
                            : settings.preferences.ownedPacks.filter(
                                (id) => id !== pack.id,
                              ),
                        )
                      }
                    />
                    {pack.name}
                  </label>
                ))}
            </details>
          ))}
        </fieldset>
        <MatureSettings />
        <details className="advanced-settings">
          <summary>Content options</summary>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.preferences.allowRoleplayContent}
              onChange={(event) =>
                update('allowRoleplayContent', event.target.checked)
              }
            />
            Include fictional roleplay samples
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.preferences.allowCustomContent}
              onChange={(event) =>
                update('allowCustomContent', event.target.checked)
              }
            />
            Include user-created custom lots
          </label>
          <p className="helper-text">
            Disabling roleplay removes authored household stories, styling
            guides, backgrounds, and fictional save concepts. Verified official
            world fields remain available.
          </p>
        </details>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setSettings(defaultSettings())}
        >
          Reset generator preferences
        </button>
      </div>
    </details>
  );
}
