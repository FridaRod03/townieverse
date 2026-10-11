import { useState } from 'react';
import { SaveActions } from '../SaveActions';
import { useStudio } from '../../hooks/StudioContext';
import { useSessionState } from '../../hooks/useSessionState';
import { useRoll } from '../../hooks/useRoll';
import {
  selectWorld,
  selectNeighborhood,
  selectLot,
  validateWorld,
} from '../../generators/worlds';
import { selectAesthetic } from '../../generators/aesthetics';
import { eligibilityReasons } from '../../generators/eligibility';
import type { GeneratedResult, Lot } from '../../types/models';
import type { EngineError } from '../../types/engine';
import {
  AestheticCard,
  CopyButton,
  EmptyState,
  ErrorNotice,
  Field,
  GeneratorFrame,
  LockButton,
} from './Common';

export function WorldGenerator() {
  const { catalog, settings, setSettings, addLot, customLots } = useStudio();
  const [result, setResult] = useSessionState<GeneratedResult | null>(
    'world.result',
    null,
  );
  const [locked, setLocked] = useSessionState('world.lock', false);
  const [avoid, setAvoid] = useSessionState('world.avoid', true);
  const [history, setHistory] = useSessionState<string[]>('world.history', []);
  const [error, setError] = useState<EngineError | null>(null);
  const [notice, setNotice] = useState('');
  const [customWorld, setCustomWorld] = useState(catalog.worlds[0]?.id ?? '');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [lotName, setLotName] = useState('');
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(30);
  const { next, stamp } = useRoll('world');
  const eligibleWorlds = catalog.worlds.filter(
    (world) => !eligibilityReasons(world, settings.preferences).length,
  );
  const generate = (field: 'world' | 'neighborhood' | 'lot' | 'aesthetic') => {
    const roll = next();
    let selected = result?.world;
    if (field === 'world' && !locked) {
      const generated = selectWorld(
        catalog.worlds,
        settings.preferences,
        roll.random('world'),
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      selected = generated.value;
    }
    if (!selected) {
      setError({
        code: 'INVALID_CONFIG',
        message:
          'Generate a world first, then choose a neighborhood, lot, or inspired aesthetic.',
        details: [],
      });
      return;
    }
    const activeWorld = catalog.worlds.find(
      (world) => world.id === selected.id,
    );
    if (!activeWorld) {
      setError({
        code: 'LOCK_CONFLICT',
        message: 'The selected world is no longer available.',
        details: [],
      });
      return;
    }
    const valid = validateWorld(activeWorld, settings.preferences);
    if (!valid.success) {
      setError(
        locked
          ? {
              ...valid.error,
              code: 'LOCK_CONFLICT',
              message:
                'The locked world requires a disabled pack or content setting. Unlock it or restore that setting.',
            }
          : valid.error,
      );
      return;
    }
    const draft: GeneratedResult =
      field === 'world'
        ? { id: 'studio:world', seed: roll.seed, world: selected }
        : { ...result!, seed: roll.seed };
    if (field === 'neighborhood') {
      const generated = selectNeighborhood(
        activeWorld,
        settings.preferences,
        roll.random('neighborhood'),
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      draft.neighborhood = generated.value;
      delete draft.lot;
    }
    if (field === 'lot') {
      const generated = selectLot(
        activeWorld,
        settings.preferences,
        roll.random('lot'),
        {
          neighborhoodId: result?.neighborhood?.id,
          previouslyRolledIds: avoid ? history : [],
        },
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      draft.lot = generated.value;
      draft.neighborhood = activeWorld.neighborhoods.find(
        (entry) => entry.id === generated.value.neighborhoodId,
      );
      setHistory((current) => [...new Set([...current, generated.value.id])]);
    }
    if (field === 'aesthetic') {
      const generated = selectAesthetic(
        catalog.aesthetics,
        { ...settings.preferences, mode: 'world-inspired' },
        roll.random('style'),
        { world: activeWorld },
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      draft.aesthetic = generated.value;
    }
    setResult(draft);
    setError(null);
  };
  const worldForCustom = catalog.worlds.find(
    (world) => world.id === customWorld,
  );
  const createLot = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const neighborhoodId =
      customNeighborhood || worldForCustom?.neighborhoods[0]?.id;
    if (
      !lotName.trim() ||
      !worldForCustom ||
      !neighborhoodId ||
      !worldForCustom.neighborhoods.some(
        (entry) => entry.id === neighborhoodId,
      ) ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > 1000 ||
      height > 1000 ||
      eligibilityReasons(worldForCustom, settings.preferences).length
    ) {
      setNotice(
        'Enter a name, an enabled world/neighborhood, and whole-number dimensions from 1 to 1000.',
      );
      return;
    }
    const lot: Lot = {
      id: `custom:lot:${crypto.randomUUID()}`,
      name: lotName.trim(),
      description:
        'User-created lot from your own save. Dimensions are supplied by you.',
      origin: 'custom',
      requiredPacks: [...worldForCustom.requiredPacks],
      verification: {
        status: 'not-applicable',
        sources: [],
        notes: 'User-supplied, not an official lot.',
      },
      categories: ['custom'],
      tags: [...worldForCustom.tags],
      weight: 1,
      commonness: 1,
      adultOnly: false,
      themes: [],
      worldId: worldForCustom.id,
      neighborhoodId,
      size: { width, height },
      lotType: 'residential',
    };
    addLot(lot);
    setSettings((current) => ({
      ...current,
      preferences: { ...current.preferences, allowCustomContent: true },
    }));
    setLotName('');
    setNotice(
      `${lot.name} added. Custom lots are enabled. Generate its world and choose a lot.`,
    );
  };
  return (
    <GeneratorFrame
      title="Worlds & lots"
      introduction="Find a setting, explore a neighborhood, or add a real lot from your own save."
    >
      <p className="helper-text">
        Choose owned packs in shared settings above. Official game worlds and
        fictional save concepts are labeled separately. Neighborhood coverage is
        incomplete; a small verified lot subset is available, with more research
        needed.
      </p>
      <div className="generate-actions">
        <button
          className="button primary generate-button"
          onClick={() => generate('world')}
        >
          Generate world <span aria-hidden="true">✦</span>
        </button>
        <button
          className="secondary-button"
          onClick={() => generate('neighborhood')}
        >
          Generate neighborhood
        </button>
        <button className="secondary-button" onClick={() => generate('lot')}>
          Generate eligible lot
        </button>
        <button
          className="secondary-button"
          onClick={() => generate('aesthetic')}
        >
          Generate world-inspired style
        </button>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={avoid}
          onChange={(event) => setAvoid(event.target.checked)}
        />
        Avoid previously rolled lots
      </label>
      <button
        className="text-button"
        onClick={() => {
          setHistory([]);
          setNotice('Rolled-lot history cleared.');
        }}
      >
        Clear rolled-lot history ({history.length})
      </button>
      <p className="roll-stamp" role="status">
        {stamp}
      </p>
      <ErrorNotice error={error} />
      {result?.world ? (
        <>
          <article className="result-card">
            <div className="result-heading">
              <p className="eyebrow">
                {result.world.origin === 'official'
                  ? `OFFICIAL ${result.world.worldType.toUpperCase()} WORLD`
                  : 'FICTIONAL SAVE CONCEPT'}
              </p>
              <LockButton
                label="selected world"
                locked={locked}
                onClick={() => setLocked((current) => !current)}
              />
            </div>
            <h3>{result.world.name}</h3>
            <p>{result.world.description}</p>
            <Field label="Required packs">
              {result.world.requiredPacks
                .map(
                  (id) =>
                    catalog.packs.find((pack) => pack.id === id)?.name ?? id,
                )
                .join(' · ') || 'Base game'}
            </Field>
            {result.world.origin === 'official' && (
              <details>
                <summary>World sources</summary>
                {result.world.verification.sources.map((source) => (
                  <p key={source}>
                    <a href={source} target="_blank" rel="noreferrer">
                      Reference ({new URL(source).hostname})
                    </a>
                  </p>
                ))}
              </details>
            )}
            <Field label="Neighborhood">
              {result.neighborhood?.name ??
                'Choose Generate neighborhood to explore.'}
            </Field>
            <Field label="Exact lot">
              {result.lot
                ? `${result.lot.name} · ${result.lot.size?.width} × ${result.lot.size?.height} · ${result.lot.origin === 'custom' ? 'User-created custom lot' : 'Verified official lot'}`
                : 'No verified or custom lot selected. World and neighborhood rolls still work.'}
            </Field>
          </article>
          {result.aesthetic && <AestheticCard aesthetic={result.aesthetic} />}
          <SaveActions
            type="world"
            title={
              result.lot
                ? `${result.world?.name} · ${result.lot.name}`
                : (result.world?.name ?? 'World concept')
            }
            snapshot={result}
            world={result.world?.name}
            text={[
              result.world?.name,
              result.world?.description,
              result.neighborhood?.name ?? 'No neighborhood selected',
              result.lot
                ? `${result.lot.name} (${result.lot.origin}): ${result.lot.size?.width} × ${result.lot.size?.height}`
                : 'No exact lot selected',
              result.aesthetic?.name ?? '',
            ]
              .filter(Boolean)
              .join('\n')}
          />
          <CopyButton
            text={[
              `${result.world.name} (${result.world.origin === 'official' ? 'official game world' : 'fictional save concept'})`,
              result.world.description,
              result.neighborhood?.name ?? '',
              result.lot
                ? `${result.lot.name} (${result.lot.origin === 'official' ? 'verified official' : 'user-created'}): ${result.lot.size?.width} × ${result.lot.size?.height}`
                : 'No exact lot selected',
              result.aesthetic?.name ?? '',
            ]
              .filter(Boolean)
              .join('\n')}
          />
        </>
      ) : (
        <EmptyState />
      )}
      <details className="custom-lot-editor">
        <summary>Add custom lots · {customLots.length} in this session</summary>
        <p className="helper-text">
          These are your own lots, not official data. Adding a lot enables
          custom-lot selection. Custom lots and rolled-lot history last for this
          browser session and are cleared by a page reload.
        </p>
        <form onSubmit={createLot}>
          <div className="form-grid">
            <label>
              Custom lot name
              <input
                required
                maxLength={80}
                value={lotName}
                onChange={(event) => setLotName(event.target.value)}
              />
            </label>
            <label>
              Custom lot world
              <select
                value={customWorld}
                onChange={(event) => {
                  setCustomWorld(event.target.value);
                  setCustomNeighborhood('');
                }}
              >
                {eligibleWorlds.map((world) => (
                  <option key={world.id} value={world.id}>
                    {world.name}
                  </option>
                ))}
                {!eligibleWorlds.length && (
                  <option value="">No enabled worlds</option>
                )}
              </select>
            </label>
            <label>
              Custom lot neighborhood
              <select
                value={
                  customNeighborhood ||
                  worldForCustom?.neighborhoods[0]?.id ||
                  ''
                }
                onChange={(event) => setCustomNeighborhood(event.target.value)}
              >
                {worldForCustom?.neighborhoods.map((neighborhood) => (
                  <option key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lot width
              <input
                required
                type="number"
                min={1}
                max={1000}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
              />
            </label>
            <label>
              Lot height
              <input
                required
                type="number"
                min={1}
                max={1000}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
              />
            </label>
          </div>
          <button className="secondary-button" type="submit">
            Add custom lot
          </button>
        </form>
        {customLots.map((lot) => (
          <p key={lot.id}>
            {lot.name} · user-created · {lot.size?.width} × {lot.size?.height}
          </p>
        ))}
      </details>
      <p role="status">{notice}</p>
    </GeneratorFrame>
  );
}
