import { useState } from 'react';
import { SaveActions } from '../SaveActions';
import { MatureSettings } from '../SettingsPanel';
import { useStudio } from '../../hooks/StudioContext';
import { useSessionState } from '../../hooks/useSessionState';
import { useRoll } from '../../hooks/useRoll';
import { twists } from '../../data/library';
import { generateStoryline } from '../../generators/storylines';
import { eligibilityReasons } from '../../generators/eligibility';
import type { Storyline, LifeStage } from '../../types/models';
import type { EngineError } from '../../types/engine';
import { ageLabel } from '../../utils/resultText';
import { CopyButton, EmptyState, ErrorNotice, GeneratorFrame } from './Common';

export function MatureGenerator() {
  const { settings, concept, individual } = useStudio();
  const [participant, setParticipant] = useState('');
  const [manualAge, setManualAge] = useState<LifeStage>('adult');
  const [result, setResult] = useSessionState<{
    story: Storyline;
    name: string;
    age: LifeStage;
  } | null>('mature.result', null);
  const [error, setError] = useState<EngineError | null>(null);
  const { next, stamp } = useRoll('mature');
  const members = [
    ...(concept?.household.members ?? []),
    ...(individual ? [individual] : []),
  ];
  const generate = () => {
    if (
      !settings.preferences.allowAdultRomance &&
      !settings.preferences.allowCrime &&
      !settings.preferences.allowSubstanceUse
    ) {
      setError({
        code: 'CONTENT_RESTRICTED',
        message:
          'All mature themes are off. Enable a specific theme to generate a non-graphic narrative twist.',
        details: [],
      });
      return;
    }
    const person = participant
      ? members.find((member) => member.id === participant)
      : { id: 'manual:story', name: 'Your existing Sim', age: manualAge };
    if (!person) {
      setError({
        code: 'INVALID_CONFIG',
        message: 'That participant is no longer available. Choose another Sim.',
        details: [],
      });
      return;
    }
    const generated = generateStoryline(
      twists,
      [person],
      settings.preferences,
      next().random('twist'),
    );
    if (!generated.success) {
      setError({
        ...generated.error,
        message:
          'No enabled storyline is compatible with this participant. Mature prompts require an adult age.',
      });
      return;
    }
    setResult({ story: generated.value, name: person.name, age: person.age });
    setError(null);
  };
  const visible =
    result &&
    !eligibilityReasons(result.story, settings.preferences, [result.age])
      .length;
  return (
    <GeneratorFrame
      title="Mature stories · 18+"
      introduction="Optional, non-graphic narrative twists with separate controls and explicit participants."
    >
      <div className="control-card">
        <MatureSettings />
        <label>
          Storyline participant
          <select
            value={participant}
            onChange={(event) => setParticipant(event.target.value)}
          >
            <option value="">Use an existing Sim’s age manually</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {ageLabel(member.age)}
              </option>
            ))}
          </select>
        </label>
        {!participant && (
          <label>
            Storyline participant age
            <select
              value={manualAge}
              onChange={(event) =>
                setManualAge(event.target.value as LifeStage)
              }
            >
              {(['teen', 'young-adult', 'adult', 'elder'] as const).map(
                (stage) => (
                  <option key={stage} value={stage}>
                    {ageLabel(stage)}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
        <p className="helper-text">
          Only the selected Sim participates. Other household members, including
          minors, are never implicitly included.
        </p>
      </div>
      <button className="button primary generate-button" onClick={generate}>
        Generate narrative twist <span aria-hidden="true">☾</span>
      </button>
      <p className="roll-stamp" role="status">
        {stamp}
      </p>
      <ErrorNotice error={error} />
      {visible && result ? (
        <article className="result-card">
          <p className="eyebrow">OPTIONAL ROLEPLAY STORYLINE</p>
          <h3>{result.story.name}</h3>
          <p>{result.story.description}</p>
          <p>
            Participant: {result.name} · {ageLabel(result.age)}
          </p>
          <SaveActions
            type="storyline"
            title={result.story.name}
            snapshot={result}
            text={`${result.story.name}\n${result.story.description}\nParticipant: ${result.name} (${ageLabel(result.age)})`}
          />
          <CopyButton
            text={`${result.story.name}\n${result.story.description}\nParticipant: ${result.name} (${ageLabel(result.age)})`}
          />
        </article>
      ) : (
        <EmptyState>
          {result
            ? 'The previous storyline is hidden because its theme is now disabled.'
            : 'No mature themes are enabled by default. Choose a theme and an eligible participant to begin.'}
        </EmptyState>
      )}
    </GeneratorFrame>
  );
}
