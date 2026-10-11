import { useState } from 'react';
import { SaveActions } from '../SaveActions';
import { useStudio } from '../../hooks/StudioContext';
import { useSessionState } from '../../hooks/useSessionState';
import { useRoll } from '../../hooks/useRoll';
import { simData } from '../../data/library';
import {
  generateSim,
  rerollSimFields,
  validateSim,
} from '../../generators/sims';
import { selectAesthetic } from '../../generators/aesthetics';
import { traitCountForAge } from '../../generators/concepts';
import type { Aesthetic, LifeStage, IndividualSim } from '../../types/models';
import type { EngineError } from '../../types/engine';
import { ageLabel, aestheticText, simText } from '../../utils/resultText';
import {
  AestheticCard,
  CopyButton,
  EmptyState,
  ErrorNotice,
  GeneratorFrame,
  LockButton,
  SimProfile,
} from './Common';

type SimField = 'age' | 'personality' | 'career' | 'aspiration' | 'aesthetic';
export function SimGenerator() {
  const { individual, setIndividual, settings, catalog } = useStudio();
  const [age, setAge] = useSessionState<LifeStage>('sim.age', 'young-adult');
  const [aesthetic, setAesthetic] = useSessionState<Aesthetic | null>(
    'sim.aesthetic',
    null,
  );
  const [locks, setLocks] = useSessionState<SimField[]>('sim.locks', []);
  const [error, setError] = useState<EngineError | null>(null);
  const { next, stamp } = useRoll('sim');
  const toggle = (field: SimField) =>
    setLocks((current) =>
      current.includes(field)
        ? current.filter((key) => key !== field)
        : [...current, field],
    );
  const roll = (
    fields: SimField[] = [
      'age',
      'aspiration',
      'personality',
      'career',
      'aesthetic',
    ],
  ) => {
    const context = next();
    const preferences = settings.preferences;
    if (
      individual &&
      individual.age !== age &&
      (!fields.includes('age') || locks.includes('age'))
    ) {
      setError({
        code: locks.includes('age') ? 'LOCK_CONFLICT' : 'INVALID_CONFIG',
        message:
          'The chosen age differs from the existing profile. Unlock age and use Generate Sim to create a profile for the new age.',
        details: [],
      });
      return;
    }
    let candidate: IndividualSim;
    if (!individual || individual.age !== age) {
      const generated = generateSim(
        simData,
        preferences,
        context.random('profile'),
        {
          id: 'studio:individual',
          name: 'Your next Sim',
          age,
          traitCount: traitCountForAge(age),
        },
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      candidate = { ...generated.value };
      if (individual)
        candidate = {
          ...candidate,
          personality: locks.includes('personality')
            ? individual.personality
            : candidate.personality,
          career: locks.includes('career')
            ? individual.career
            : candidate.career,
          aspiration: locks.includes('aspiration')
            ? individual.aspiration
            : candidate.aspiration,
        };
    } else {
      const generated = rerollSimFields(
        individual,
        simData,
        preferences,
        context.random('profile'),
        {
          fields: fields.filter(
            (field): field is 'personality' | 'career' | 'aspiration' =>
              ['personality', 'career', 'aspiration'].includes(field),
          ),
          locks: locks.filter(
            (field): field is 'personality' | 'career' | 'aspiration' =>
              ['personality', 'career', 'aspiration'].includes(field),
          ),
          traitCount: traitCountForAge(age),
        },
      );
      if (!generated.success) {
        setError(generated.error);
        return;
      }
      candidate = generated.value;
    }
    const valid = validateSim(candidate, simData, preferences);
    if (!valid.success) {
      setError(
        locks.length
          ? {
              ...valid.error,
              code: 'LOCK_CONFLICT',
              message:
                'A locked Sim detail is incompatible with the selected age or settings.',
            }
          : valid.error,
      );
      return;
    }
    const shouldKeepStyle =
      aesthetic &&
      (locks.includes('aesthetic') || !fields.includes('aesthetic'));
    const style = selectAesthetic(
      shouldKeepStyle ? [aesthetic] : catalog.aesthetics,
      preferences,
      context.random('style'),
      { age: candidate.age },
    );
    if (!style.success) {
      setError(
        shouldKeepStyle
          ? {
              ...style.error,
              code: 'LOCK_CONFLICT',
              message:
                'The retained aesthetic is incompatible with the current filters.',
            }
          : style.error,
      );
      return;
    }
    setIndividual(candidate);
    setAesthetic(style.value);
    setError(null);
  };
  return (
    <GeneratorFrame
      title="Individual Sims"
      introduction="Build a personality, find a purpose, and give your next Sim a signature style."
    >
      <div className="control-card">
        <label>
          Sim age
          <select
            value={age}
            onChange={(event) => setAge(event.target.value as LifeStage)}
          >
            {(['child', 'teen', 'young-adult', 'adult', 'elder'] as const).map(
              (value) => (
                <option value={value} key={value}>
                  {ageLabel(value)}
                </option>
              ),
            )}
          </select>
        </label>
        <p className="helper-text">
          This library supports Child through Elder. Official game fields and
          authored roleplay options are individually labeled.
        </p>
      </div>
      <button className="button primary generate-button" onClick={() => roll()}>
        Generate Sim <span aria-hidden="true">✦</span>
      </button>
      <p className="roll-stamp" role="status">
        {stamp}
      </p>
      <ErrorNotice error={error} />
      {individual ? (
        <div className="sim-result">
          <div className="field-controls">
            {(
              [
                'age',
                'aspiration',
                'personality',
                'career',
                'aesthetic',
              ] as const
            ).map((field) => (
              <div key={field}>
                <span>
                  {field === 'personality'
                    ? 'Personality & traits'
                    : ageLabel(field)}
                </span>
                <LockButton
                  label={`Sim ${field}`}
                  locked={locks.includes(field)}
                  onClick={() => toggle(field)}
                />
                {field !== 'age' && (
                  <button className="text-button" onClick={() => roll([field])}>
                    Reroll {field}
                  </button>
                )}
              </div>
            ))}
          </div>
          <SimProfile sim={individual} expanded />
          {aesthetic && <AestheticCard aesthetic={aesthetic} />}
          <SaveActions
            type="sim"
            title={individual.name}
            snapshot={{ sim: individual, aesthetic }}
            text={`${simText(individual)}\n\n${aesthetic ? aestheticText(aesthetic) : ''}`}
            members={[{ id: individual.id, name: individual.name }]}
          />
          <CopyButton
            text={`${simText(individual)}\n\n${aesthetic ? aestheticText(aesthetic) : ''}`}
          />
        </div>
      ) : (
        <EmptyState />
      )}
      <p className="helper-text">
        Personality locks preserve traits, hobbies, likes, goal, and flaw
        together. Rerolls preserve every other field.
      </p>
    </GeneratorFrame>
  );
}
