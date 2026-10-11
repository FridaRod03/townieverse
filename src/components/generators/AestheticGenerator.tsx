import { useState } from 'react';
import { SaveActions } from '../SaveActions';
import { useStudio } from '../../hooks/StudioContext';
import { useSessionState } from '../../hooks/useSessionState';
import { useRoll } from '../../hooks/useRoll';
import { blendAesthetics, selectAesthetic } from '../../generators/aesthetics';
import { validateWorld } from '../../generators/worlds';
import { eligibilityReasons } from '../../generators/eligibility';
import type { Aesthetic, RandomizationMode } from '../../types/models';
import type { EngineError } from '../../types/engine';
import { modeNames } from '../../data/ui';
import { aestheticText } from '../../utils/resultText';
import { matchesDiscovery } from '../../utils/aestheticDiscovery';
import {
  rarityNames,
  rarityOf,
  styleTypes,
  styleTypeOf,
} from '../../data/aestheticTaxonomy';
import {
  AestheticCard,
  CopyButton,
  EmptyState,
  ErrorNotice,
  GeneratorFrame,
  LockButton,
} from './Common';

export function AestheticGenerator() {
  const { settings, setSettings, catalog } = useStudio();
  const [blend, setBlend] = useSessionState('style.blend', false);
  const [worldId, setWorldId] = useSessionState('style.world', '');
  const [styles, setStyles] = useSessionState<Aesthetic[]>('style.results', []);
  const [locks, setLocks] = useSessionState<number[]>('style.locks', []);
  const [error, setError] = useState<EngineError | null>(null);
  const [styleType, setStyleType] = useSessionState<
    Aesthetic['styleType'] | ''
  >('style.type', '');
  const [rarity, setRarity] = useSessionState<Aesthetic['rarity'] | ''>(
    'style.rarity',
    '',
  );
  const [filterWorldId, setFilterWorldId] = useSessionState(
    'style.filterWorld',
    '',
  );
  const [page, setPage] = useState({ key: '', count: 24 });
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [tipIds, setTipIds] = useState<string[]>([]);
  const discovery = {
    styleType,
    rarity,
    worldFilter: catalog.worlds.find((world) => world.id === filterWorldId),
  };
  const { next, stamp } = useRoll('style');
  const eligibleWorlds = catalog.worlds.filter(
    (world) => !eligibilityReasons(world, settings.preferences).length,
  );
  const choose = (only?: number) => {
    const context = next();
    const world = catalog.worlds.find((entry) => entry.id === worldId);
    if (discovery.worldFilter) {
      const valid = validateWorld(discovery.worldFilter, settings.preferences);
      if (!valid.success) {
        setError(valid.error);
        return;
      }
    }
    if (world) {
      const valid = validateWorld(world, settings.preferences);
      if (!valid.success) {
        setError(valid.error);
        return;
      }
    }
    const retain = (index: number) =>
      !!styles[index] &&
      (locks.includes(index) || (only !== undefined && only !== index));
    if (blend) {
      const generated = blendAesthetics(
        catalog.aesthetics,
        settings.preferences,
        context.random('blend'),
        { world, ...discovery },
        {
          first: retain(0) ? styles[0] : undefined,
          second: retain(1) ? styles[1] : undefined,
        },
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      setStyles([generated.value.first, generated.value.second]);
    } else {
      const generated = selectAesthetic(
        retain(0) ? [styles[0]] : catalog.aesthetics,
        settings.preferences,
        context.random('single'),
        { world, ...discovery },
      );
      if (!generated.success) {
        setError(
          retain(0)
            ? {
                ...generated.error,
                code: 'LOCK_CONFLICT',
                message:
                  'Your locked aesthetic conflicts with the current search or categories.',
              }
            : generated.error,
        );
        return;
      }
      // Retain the hidden second half while in single mode so its locks are not discarded.
      setStyles([generated.value, ...styles.slice(1)]);
    }
    setError(null);
  };
  const query = settings.preferences.aestheticSearch.trim().toLowerCase();
  const pageKey = JSON.stringify([
    query,
    settings.preferences.aestheticCategories,
    styleType,
    rarity,
    filterWorldId,
    settings.preferences.ownedPacks,
    settings.preferences.allowRoleplayContent,
    settings.preferences.allowCustomContent,
  ]);
  const visibleCount = page.key === pageKey ? page.count : 24;
  const browsing = catalog.aesthetics.filter(
    (entry) =>
      !eligibilityReasons(entry, settings.preferences).length &&
      matchesDiscovery(entry, settings.preferences, discovery),
  );
  return (
    <GeneratorFrame
      title="Aesthetics"
      introduction="A little texture, a little attitude. Find one style or blend two into something of your own."
    >
      <div className="control-card">
        <div className="form-grid">
          <label>
            Style classification
            <select
              value={styleType ?? ''}
              onChange={(event) =>
                setStyleType(event.target.value as Aesthetic['styleType'] | '')
              }
            >
              <option value="">All classifications</option>
              {Object.entries(styleTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Style rarity
            <select
              value={rarity ?? ''}
              onChange={(event) =>
                setRarity(event.target.value as Aesthetic['rarity'] | '')
              }
            >
              <option value="">All rarities</option>
              {rarityNames.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filter by associated world
            <select
              value={filterWorldId}
              onChange={(event) => setFilterWorldId(event.target.value)}
            >
              <option value="">All worlds · include outsiders</option>
              {eligibleWorlds.map((world) => (
                <option key={world.id} value={world.id}>
                  {world.name}
                </option>
              ))}
              {filterWorldId &&
                !eligibleWorlds.some((world) => world.id === filterWorldId) && (
                  <option value={filterWorldId}>
                    Selected filter world is disabled
                  </option>
                )}
            </select>
          </label>
          <label>
            Aesthetic randomization mode
            <select
              value={settings.preferences.mode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  preferences: {
                    ...current.preferences,
                    mode: event.target.value as RandomizationMode,
                  },
                }))
              }
            >
              {modeNames.map(([value, name]) => (
                <option value={value} key={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Inspiration world
            <select
              value={worldId}
              onChange={(event) => setWorldId(event.target.value)}
            >
              <option value="">No world · outsider inspiration</option>
              {eligibleWorlds.map((world) => (
                <option key={world.id} value={world.id}>
                  {world.name} ·{' '}
                  {world.origin === 'official' ? 'official' : 'fictional'}
                </option>
              ))}
              {worldId &&
                !eligibleWorlds.some((world) => world.id === worldId) && (
                  <option value={worldId}>Selected world is disabled</option>
                )}
            </select>
          </label>
          <label>
            Search aesthetics
            <input
              type="search"
              maxLength={200}
              value={settings.preferences.aestheticSearch}
              placeholder="Try velvet, denim, or silver"
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  preferences: {
                    ...current.preferences,
                    aestheticSearch: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            Style category
            <select
              value={settings.preferences.aestheticCategories[0] ?? ''}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  preferences: {
                    ...current.preferences,
                    aestheticCategories: event.target.value
                      ? [event.target.value]
                      : [],
                  },
                }))
              }
            >
              <option value="">All style categories</option>
              {[
                ...new Set(catalog.aesthetics.map((entry) => entry.category)),
              ].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={blend}
            onChange={(event) => setBlend(event.target.checked)}
          />
          Blend two aesthetics
        </label>
        <p className="helper-text">
          Search and style filters are shared with other generators. Balanced
          mode selects inspired / outsider / wildcard categories before
          selecting a style. Classification, rarity, and associated-world
          filters apply here to both browsing and rolls. The associated-world
          filter is optional; leave it on all worlds for outsider and wildcard
          rolls. Rarity is an editorial selection weight, not a population
          statistic.
        </p>
      </div>
      <button
        className="button primary generate-button"
        onClick={() => choose()}
      >
        {blend ? 'Generate aesthetic blend' : 'Generate aesthetic'}{' '}
        <span aria-hidden="true">✦</span>
      </button>
      <p className="roll-stamp" role="status">
        {stamp}
      </p>
      <ErrorNotice error={error} />
      {styles.length ? (
        <>
          <div className="style-results">
            {styles.slice(0, blend ? 2 : 1).map((style, index) => (
              <AestheticCard
                key={`${index}:${style.id}`}
                aesthetic={style}
                controls={
                  <div className="inline-actions">
                    <LockButton
                      label={`aesthetic ${index + 1}`}
                      locked={locks.includes(index)}
                      onClick={() =>
                        setLocks((current) =>
                          current.includes(index)
                            ? current.filter((value) => value !== index)
                            : [...current, index],
                        )
                      }
                    />
                    <button
                      className="text-button"
                      onClick={() => choose(index)}
                    >
                      Reroll style {index + 1}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
          {blend && styles.length > 1 && (
            <div className="blend-note">
              <strong>The blend idea</strong>
              <p>
                Use the silhouette of {styles[0].name} with the textures and
                accessories of {styles[1].name}. Keep one shared color to
                connect the look.
              </p>
            </div>
          )}
          <SaveActions
            type="aesthetic"
            title={styles
              .slice(0, blend ? 2 : 1)
              .map((style) => style.name)
              .join(' + ')}
            snapshot={{ styles: styles.slice(0, blend ? 2 : 1) }}
            text={styles
              .slice(0, blend ? 2 : 1)
              .map(aestheticText)
              .join('\n\n')}
            world={catalog.worlds.find((w) => w.id === worldId)?.name ?? ''}
          />
          <CopyButton
            text={styles
              .slice(0, blend ? 2 : 1)
              .map(aestheticText)
              .join('\n\n')}
          />
        </>
      ) : (
        <EmptyState>
          Ready for a new signature look? Roll a style or turn on blending.
        </EmptyState>
      )}
      <details
        className="style-library"
        onToggle={(event) => setLibraryOpen(event.currentTarget.open)}
      >
        <summary>
          Browse the styling library · {browsing.length} of{' '}
          {catalog.aesthetics.length} styles
        </summary>
        {libraryOpen && (
          <div className="library-grid">
            {browsing.slice(0, visibleCount).map((style) => (
              <article key={style.id}>
                <strong>{style.name}</strong>
                <small>
                  {style.category} · {styleTypes[styleTypeOf(style)]} ·{' '}
                  {rarityOf(style)}
                </small>
                <p>{style.description}</p>
                {!!style.aliases?.length && (
                  <p className="helper-text">
                    Aliases: {style.aliases.join(' · ')}
                  </p>
                )}
                <details
                  onToggle={(event) => {
                    const open = event.currentTarget.open;
                    setTipIds((current) =>
                      open
                        ? [...new Set([...current, style.id])]
                        : current.filter((id) => id !== style.id),
                    );
                  }}
                >
                  <summary>Styling tips for {style.name}</summary>
                  {tipIds.includes(style.id) && (
                    <AestheticCard aesthetic={style} />
                  )}
                </details>
                <SaveActions
                  type="aesthetic"
                  title={style.name}
                  snapshot={{ styles: [style] }}
                  text={aestheticText(style)}
                  labelSuffix={style.name}
                />
              </article>
            ))}
          </div>
        )}
        {libraryOpen && browsing.length > visibleCount && (
          <button
            className="button secondary"
            onClick={() => setPage({ key: pageKey, count: visibleCount + 24 })}
          >
            Show 24 more styles
          </button>
        )}
        {!browsing.length && (
          <p>No styles match. Clear the search or choose all categories.</p>
        )}
      </details>
    </GeneratorFrame>
  );
}
