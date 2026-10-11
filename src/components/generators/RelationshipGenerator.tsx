import { useState } from 'react';
import { SaveActions } from '../SaveActions';
import { useStudio } from '../../hooks/StudioContext';
import { useSessionState } from '../../hooks/useSessionState';
import { useRoll } from '../../hooks/useRoll';
import { generateRelationship } from '../../generators/relationships';
import type {
  GeneratedRelationship,
  HouseholdMember,
  LifeStage,
  Relationship,
} from '../../types/models';
import type { EngineError } from '../../types/engine';
import { ageLabel } from '../../utils/resultText';
import { CopyButton, EmptyState, ErrorNotice, GeneratorFrame } from './Common';

export function RelationshipGenerator() {
  const { concept, individual, settings, catalog } = useStudio();
  const [fromId, setFromId] = useSessionState('relationship.from', '');
  const [toId, setToId] = useSessionState('relationship.to', '');
  const [fromName, setFromName] = useState('Sim A');
  const [toName, setToName] = useState('Sim B');
  const [fromAge, setFromAge] = useState<LifeStage>('adult');
  const [toAge, setToAge] = useState<LifeStage>('adult');
  const [kind, setKind] = useSessionState<Relationship['kind'] | ''>(
    'relationship.kind',
    '',
  );
  const [tone, setTone] = useSessionState<Relationship['tone'] | ''>(
    'relationship.tone',
    '',
  );
  const [drama, setDrama] = useSessionState('relationship.drama', false);
  const [result, setResult] = useSessionState<{
    relationship: GeneratedRelationship;
    from: string;
    to: string;
  } | null>('relationship.result', null);
  const [error, setError] = useState<EngineError | null>(null);
  const { next, stamp } = useRoll('relationship');
  const existing = [
    ...(concept?.household.members ?? []),
    ...(individual
      ? [
          {
            id: individual.id,
            name: individual.name,
            age: individual.age,
            slotId: individual.id,
            occult: 'human' as const,
            requiredPacks: [],
          },
        ]
      : []),
  ];
  const manual = (
    id: string,
    name: string,
    age: LifeStage,
  ): HouseholdMember => ({
    id,
    name: name.trim(),
    age,
    slotId: id,
    occult: 'human',
    requiredPacks: [],
  });
  const generate = () => {
    const context = next();
    const from = fromId
      ? existing.find((member) => member.id === fromId)
      : manual('manual:a', fromName, fromAge);
    const to = toId
      ? existing.find((member) => member.id === toId)
      : manual('manual:b', toName, toAge);
    if (!from || !to || !from.name || !to.name) {
      setError({
        code: 'INVALID_CONFIG',
        message:
          'Choose two available Sims or enter names and ages for both manual profiles.',
        details: [],
      });
      return;
    }
    const household =
      concept?.household.members.some((member) => member.id === from.id) &&
      concept.household.members.some((member) => member.id === to.id)
        ? concept.household
        : undefined;
    const prompts = catalog.relationships.filter(
      (entry) =>
        (!kind || entry.kind === kind) &&
        (!tone || entry.tone === tone) &&
        (drama || entry.tone !== 'negative'),
    );
    const generated = generateRelationship(
      prompts,
      from,
      to,
      settings.preferences,
      context.random('relationship'),
      household,
    );
    if (!generated.success) {
      setError(generated.error);
      return;
    }
    setResult({ relationship: generated.value, from: from.name, to: to.name });
    setError(null);
  };
  return (
    <GeneratorFrame
      title="Relationships"
      introduction="Make the connections matter. Use members of your generated household or describe two existing Sims."
    >
      <div className="control-card">
        <div className="form-grid">
          {(
            [
              [
                'First Sim',
                fromId,
                setFromId,
                fromName,
                setFromName,
                fromAge,
                setFromAge,
              ],
              ['Second Sim', toId, setToId, toName, setToName, toAge, setToAge],
            ] as const
          ).map(([label, id, setId, name, setName, age, setAge]) => (
            <div className="person-input" key={label}>
              <label>
                {label}
                <select
                  value={id}
                  onChange={(event) => setId(event.target.value)}
                >
                  <option value="">Enter an existing Sim manually</option>
                  {existing.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} · {ageLabel(member.age)}
                    </option>
                  ))}
                  {id && !existing.some((member) => member.id === id) && (
                    <option value={id}>
                      Previously selected Sim unavailable
                    </option>
                  )}
                </select>
              </label>
              {!id && (
                <>
                  <label>
                    {label} name
                    <input
                      maxLength={60}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <label>
                    {label} age
                    <select
                      value={age}
                      onChange={(event) =>
                        setAge(event.target.value as LifeStage)
                      }
                    >
                      {(
                        [
                          'child',
                          'teen',
                          'young-adult',
                          'adult',
                          'elder',
                        ] as const
                      ).map((stage) => (
                        <option key={stage} value={stage}>
                          {ageLabel(stage)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
          ))}
          <label>
            Relationship type
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as Relationship['kind'] | '')
              }
            >
              <option value="">Any relationship type</option>
              {[
                ...new Set(catalog.relationships.map((entry) => entry.kind)),
              ].map((value) => (
                <option key={value} value={value}>
                  {ageLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Relationship tone
            <select
              value={tone}
              onChange={(event) =>
                setTone(event.target.value as Relationship['tone'] | '')
              }
            >
              <option value="">Any tone</option>
              {['positive', 'neutral', 'negative'].map((value) => (
                <option key={value} value={value}>
                  {ageLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={drama}
            onChange={(event) => setDrama(event.target.checked)}
          />
          Include interpersonal drama (negative dynamics)
        </label>
        <p className="helper-text">
          Family ties are directed from the first Sim to the second where
          relevant. Household selections use known genealogy; manual profiles
          cannot reveal unseen family history. Enable interpersonal drama to
          include negative dynamics.
        </p>
      </div>
      <button className="button primary generate-button" onClick={generate}>
        Generate relationship <span aria-hidden="true">♡</span>
      </button>
      <p className="roll-stamp" role="status">
        {stamp}
      </p>
      <ErrorNotice error={error} />
      {result ? (
        <article className="result-card">
          <p className="eyebrow">
            {ageLabel(result.relationship.prompt.tone)} ·{' '}
            {ageLabel(result.relationship.prompt.kind)} · ROLEPLAY
          </p>
          <h3>{result.relationship.prompt.name}</h3>
          <p>
            <strong>
              {result.from} & {result.to}
            </strong>
          </p>
          <p>{result.relationship.prompt.description}</p>
          {result.relationship.prompt.familyTie && (
            <p>Family tie: {ageLabel(result.relationship.prompt.familyTie)}</p>
          )}
          <SaveActions
            type="relationship"
            title={result.relationship.prompt.name}
            snapshot={result}
            text={`${result.from} & ${result.to}\n${result.relationship.prompt.name}\n${result.relationship.prompt.description}`}
          />
          <CopyButton
            text={`${result.from} & ${result.to}\n${result.relationship.prompt.name}\n${result.relationship.prompt.description}`}
          />
        </article>
      ) : (
        <EmptyState>Pick two Sims and discover their shared story.</EmptyState>
      )}
    </GeneratorFrame>
  );
}
