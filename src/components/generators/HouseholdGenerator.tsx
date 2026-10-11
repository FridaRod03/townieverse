import { useState } from 'react';
import { SaveActions } from '../SaveActions';
import { useStudio } from '../../hooks/StudioContext';
import { useSessionState } from '../../hooks/useSessionState';
import { useRoll } from '../../hooks/useRoll';
import { simData, twists } from '../../data/library';
import { generateConcept } from '../../generators/concepts';
import { eligibilityReasons } from '../../generators/eligibility';
import type { EngineError } from '../../types/engine';
import type { HouseholdFilters } from '../../types/interface';
import {
  ageLabel,
  conceptText,
  simText,
  aestheticText,
} from '../../utils/resultText';
import {
  AestheticCard,
  CopyButton,
  EmptyState,
  ErrorNotice,
  Field,
  GeneratorFrame,
  LockButton,
  SampleNotice,
  SimProfile,
} from './Common';

export function HouseholdGenerator({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { settings, catalog, concept, setConcept } = useStudio();
  const [filters, setFilters] = useSessionState<HouseholdFilters>(
    'household.filters',
    { categories: [], finance: '', living: '' },
  );
  const [locks, setLocks] = useSessionState<
    ('world' | 'household' | 'aesthetic')[]
  >('household.locks', []);
  const [error, setError] = useState<EngineError | null>(null);
  const { next, stamp } = useRoll('household');
  const toggle = (key: (typeof locks)[number]) =>
    setLocks((current) =>
      current.includes(key)
        ? current.filter((field) => field !== key)
        : [...current, key],
    );
  const generate = () => {
    const result = generateConcept(
      catalog,
      simData,
      twists,
      settings,
      filters,
      next(),
      concept ?? undefined,
      locks,
    );
    if (result.success) {
      setConcept(result.value);
      setError(null);
    } else setError(result.error);
  };
  const prompt = catalog.households.find(
    (entry) => entry.id === concept?.household.promptId,
  );
  const visible =
    !concept ||
    !prompt ||
    eligibilityReasons(
      prompt,
      settings.preferences,
      concept.household.members.map((member) => member.age),
    ).length === 0;
  const twistVisible =
    concept?.twist &&
    eligibilityReasons(
      concept.twist,
      settings.preferences,
      concept.household.members
        .filter((member) => concept.twist?.participantIds.includes(member.id))
        .map((member) => member.age),
    ).length === 0;
  const body = (
    <>
      {embedded && <SampleNotice />}
      <details className="advanced-settings household-filters">
        <summary>
          Shape your household <span>categories, finances & home</span>
        </summary>
        <div className="settings-body">
          <fieldset>
            <legend>Household categories · no selection means all</legend>
            <div className="checkbox-grid">
              {[
                ...new Set(catalog.households.map((entry) => entry.category)),
              ].map((category) => (
                <label className="checkbox-label" key={category}>
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        categories: event.target.checked
                          ? [...current.categories, category]
                          : current.categories.filter((id) => id !== category),
                      }))
                    }
                  />
                  {ageLabel(category)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-grid">
            <label>
              Financial situation
              <select
                value={filters.finance}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    finance: event.target.value,
                  }))
                }
              >
                <option value="">Any financial situation</option>
                {[
                  ...new Set(
                    catalog.households.map((entry) => entry.financialSituation),
                  ),
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Living arrangement
              <select
                value={filters.living}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    living: event.target.value,
                  }))
                }
              >
                <option value="">Any living arrangement</option>
                {[
                  ...new Set(
                    catalog.households.map((entry) => entry.livingArrangement),
                  ),
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="helper-text">
            Size limits are in shared settings. Filters select matching
            templates; they never rewrite a locked concept.
          </p>
        </div>
      </details>
      <div className="generate-actions">
        <button
          type="button"
          className="button primary generate-button"
          onClick={generate}
        >
          Generate Household <span aria-hidden="true">✦</span>
        </button>
        <p className="roll-stamp" role="status">
          {stamp}
        </p>
      </div>
      <ErrorNotice error={error} />
      {!concept ? (
        <EmptyState />
      ) : !visible ? (
        <p role="status" className="error-notice">
          This previous household contains content now disabled by your
          settings. Its values and locks are retained; unlock the household and
          generate again, or restore its settings.
        </p>
      ) : (
        <div
          className="concept-result"
          aria-label="Generated household concept"
        >
          <article className="result-card">
            <div className="result-heading">
              <p className="eyebrow">
                THE SETTING ·{' '}
                {concept.world.origin === 'official'
                  ? 'OFFICIAL GAME WORLD'
                  : 'FICTIONAL SAVE CONCEPT'}
              </p>
              <LockButton
                label="world"
                locked={locks.includes('world')}
                onClick={() => toggle('world')}
              />
            </div>
            <h3>{concept.world.name}</h3>
            <p>{concept.world.description}</p>
            <Field label="Neighborhood / lot">
              {concept.neighborhood?.name ?? 'No neighborhood available'} ·{' '}
              {concept.lot?.name ?? 'No verified or custom lot selected'}
            </Field>
            {!concept.lot && (
              <p className="helper-text">
                No exact lot has been invented. Add a custom lot on the Worlds &
                lots page.
              </p>
            )}
          </article>
          <article className="result-card">
            <div className="result-heading">
              <p className="eyebrow">
                {concept.household.members.length} SIMS ·{' '}
                {ageLabel(concept.household.category)}
              </p>
              <LockButton
                label="household"
                locked={locks.includes('household')}
                onClick={() => toggle('household')}
              />
            </div>
            <h3>{prompt?.name ?? 'Household concept'}</h3>
            <p>{concept.household.backstory}</p>
            <div className="form-grid">
              <Field label="Financial situation">
                {concept.household.financialSituation}
              </Field>
              <Field label="Living arrangement">
                {concept.household.livingArrangement}
              </Field>
            </div>
            <details className="requirements">
              <summary>Household member requirements</summary>
              <ul>
                {concept.household.members.map((member) => (
                  <li key={member.id}>
                    {member.name}: {ageLabel(member.age)} ·{' '}
                    {ageLabel(member.occult)}
                  </li>
                ))}
              </ul>
            </details>
          </article>
          <section className="cast-section">
            <h3>Meet the household</h3>
            <p className="helper-text">
              Expand a profile for details. Traits, aspirations, and occupations
              are individually labeled as official game fields or roleplay
              suggestions.
            </p>
            {concept.sims.map((sim) => (
              <div key={sim.id}>
                <SimProfile sim={sim} />
                <SaveActions
                  type="sim"
                  title={sim.name}
                  snapshot={{ sim, aesthetic: concept.aesthetic }}
                  text={`${simText(sim)}\n\n${aestheticText(concept.aesthetic)}`}
                  members={[{ id: sim.id, name: sim.name }]}
                  world={concept.world.name}
                />
              </div>
            ))}
          </section>
          <article className="result-card">
            <h3>The connections</h3>
            {concept.household.dynamics.length ? (
              <ul className="relationship-list">
                {concept.household.dynamics.map((dynamic) => (
                  <li key={dynamic.id}>
                    <strong>
                      {
                        concept.household.members.find(
                          (member) => member.id === dynamic.fromId,
                        )?.name
                      }{' '}
                      →{' '}
                      {
                        concept.household.members.find(
                          (member) => member.id === dynamic.toId,
                        )?.name
                      }
                    </strong>
                    <span>{ageLabel(dynamic.kind)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>A solo household, ready to meet its neighbors.</p>
            )}
          </article>
          <AestheticCard
            aesthetic={concept.aesthetic}
            controls={
              <LockButton
                label="household aesthetic"
                locked={locks.includes('aesthetic')}
                onClick={() => toggle('aesthetic')}
              />
            }
          />
          {twistVisible && concept.twist && (
            <article className="result-card">
              <p className="eyebrow">
                OPTIONAL PRIVATE STORYLINE · ADULT PARTICIPANT ONLY
              </p>
              <h3>{concept.twist.name}</h3>
              <p>{concept.twist.description}</p>
              <p className="helper-text">
                Participant:{' '}
                {
                  concept.household.members.find(
                    (member) => member.id === concept.twist?.participantIds[0],
                  )?.name
                }
                . Other household members are not participants.
              </p>
            </article>
          )}
          <SaveActions
            type="household"
            title={prompt?.name ?? 'Household concept'}
            snapshot={{
              ...concept,
              generatedTitle: prompt?.name ?? 'Household concept',
            }}
            text={`${prompt?.name ?? 'Household concept'}\n\n${conceptText(concept)}`}
            world={concept.world.name}
            members={concept.sims.map((sim) => ({
              id: sim.id,
              name: sim.name,
            }))}
          />
          <CopyButton
            text={conceptText({
              ...concept,
              twist: twistVisible ? concept.twist : undefined,
            })}
          />
        </div>
      )}
      <div className="lock-help">
        <p>
          Lock world, household, or style on a result card, then generate again
          to reroll the unlocked fields. Household locks preserve the roster and
          backstory; member profiles are refreshed.
        </p>
        {locks.length > 0 && (
          <button className="secondary-button" onClick={() => setLocks([])}>
            Unlock household fields
          </button>
        )}
      </div>
    </>
  );
  return embedded ? (
    <section
      id="surprise-me"
      className="surprise-generator"
      aria-labelledby="surprise-title"
    >
      <p className="eyebrow">SURPRISE ME!</p>
      <h2 id="surprise-title">A whole household. A brand-new story.</h2>
      <p>Start with one click, then make the details your own.</p>
      {body}
    </section>
  ) : (
    <GeneratorFrame
      title="Households"
      introduction="Create a coherent household, from the front door to each member’s dreams."
    >
      {body}
    </GeneratorFrame>
  );
}
