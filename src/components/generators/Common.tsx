import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import type { EngineError } from '../../types/engine';
import type { Aesthetic, IndividualSim } from '../../types/models';
import { ageLabel, simText } from '../../utils/resultText';
import { useStudio } from '../../hooks/StudioContext';
import {
  rarityOf,
  styleTypeOf,
  styleTypes,
} from '../../data/aestheticTaxonomy';

export function ErrorNotice({ error }: { error: EngineError | null }) {
  return error ? (
    <div className="error-notice" role="alert">
      <strong>
        {error.code === 'LOCK_CONFLICT'
          ? 'A locked field needs your attention.'
          : 'We couldn’t complete this roll.'}
      </strong>
      <p>{error.message}</p>
      {error.details.length > 0 && (
        <details>
          <summary>Show details</summary>
          <ul>
            {error.details.slice(0, 6).map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </details>
      )}
      <p>
        Try broader filters, enable a required pack, or unlock the affected
        field.
      </p>
    </div>
  ) : null;
}
export function EmptyState({
  children = 'Your next story starts here. Choose your settings, then generate a result.',
}: {
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">✧</span>
      <p>{children}</p>
    </div>
  );
}
export function SampleNotice() {
  return (
    <p className="sample-notice">
      <strong>Curated library · coverage in progress.</strong> Official game
      fields are labeled individually. Household stories, backgrounds, and CAS
      styling are authored roleplay suggestions. The library is not exhaustive.
    </p>
  );
}
export function LockButton({
  label,
  locked,
  onClick,
  disabled = false,
}: {
  label: string;
  locked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`lock-button ${locked ? 'locked' : ''}`}
      aria-pressed={locked}
      aria-label={`${locked ? 'Unlock' : 'Lock'} ${label}`}
      disabled={disabled}
      onClick={onClick}
    >
      {locked ? 'Locked' : 'Lock'}{' '}
      <span aria-hidden="true">{locked ? '●' : '○'}</span>
    </button>
  );
}
export function CopyButton({ text }: { text: string }) {
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState(false);
  return (
    <div className="copy-control">
      <button
        className="secondary-button"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setMessage('Copied to clipboard.');
            setFallback(false);
          } catch {
            setMessage(
              'Clipboard unavailable. Select and copy the text below.',
            );
            setFallback(true);
          }
        }}
      >
        Copy result as text
      </button>
      <span role="status">{message}</span>
      {fallback && (
        <label>
          Result text
          <textarea
            readOnly
            rows={8}
            value={text}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="result-field">
      <span id={id} className="field-caption">
        {label}
      </span>
      <div aria-labelledby={id}>{children}</div>
    </div>
  );
}
export function SimProfile({
  sim,
  expanded = false,
}: {
  sim: IndividualSim;
  expanded?: boolean;
}) {
  return (
    <details className="sim-profile" open={expanded || undefined}>
      <summary>
        <span className="profile-avatar" aria-hidden="true">
          {sim.name.charAt(0)}
        </span>
        <span>
          <strong>{sim.name}</strong>
          <small>
            {ageLabel(sim.age)} · {sim.career.name}
          </small>
        </span>
        <span className="roleplay-badge">Roleplay</span>
      </summary>
      <div className="profile-body">
        <Field label="Personality">{sim.personality.profile.description}</Field>
        <Field
          label={
            sim.personality.traits.every((trait) => trait.origin === 'roleplay')
              ? 'Traits (roleplay suggestions)'
              : 'Traits (individually labeled)'
          }
        >
          {sim.personality.traits
            .map(
              (trait) =>
                `${trait.name}${trait.origin === 'official' ? ' (official)' : sim.personality.traits.some((item) => item.origin === 'official') ? ' (roleplay)' : ''}`,
            )
            .join(' · ')}
        </Field>
        <Field
          label={
            sim.aspiration.origin === 'official'
              ? 'Aspiration (official)'
              : 'Aspiration (roleplay goal)'
          }
        >
          {sim.aspiration.name}
        </Field>
        <Field
          label={
            sim.career.origin === 'official'
              ? 'Career (official)'
              : 'Occupation (roleplay)'
          }
        >
          {sim.career.name}
        </Field>
        <Field label="Hobbies">{sim.personality.hobbies.join(' · ')}</Field>
        <Field label="Likes / dislikes">
          {sim.personality.likes.join(', ')} /{' '}
          {sim.personality.dislikes.join(', ') || 'No stated dislikes'}
        </Field>
        <Field label="Personal goal">{sim.personality.personalGoal}</Field>
        <Field label="Optional character flaw">{sim.personality.flaw}</Field>
        {sim.personality.profile.personalitySuggestions?.length && (
          <Field label="Personality ideas (roleplay)">
            {sim.personality.profile.personalitySuggestions.join(' · ')}
          </Field>
        )}
        {sim.personality.profile.careerSuggestions?.length && (
          <Field label="Other career ideas (roleplay; optional)">
            {sim.personality.profile.careerSuggestions.join(' · ')}
          </Field>
        )}
        <CopyButton text={simText(sim)} />
      </div>
    </details>
  );
}
export function AestheticCard({
  aesthetic,
  controls,
}: {
  aesthetic: Aesthetic;
  controls?: ReactNode;
}) {
  const { catalog } = useStudio();
  return (
    <article
      className={`aesthetic-result style-${aesthetic.category.toLowerCase()}`}
    >
      <div className="result-heading">
        <p className="eyebrow">
          {aesthetic.category} · {styleTypes[styleTypeOf(aesthetic)]}
        </p>
        {controls}
      </div>
      <h3>{aesthetic.name}</h3>
      <p>{aesthetic.description}</p>
      <p className="helper-text">
        Editorial rarity: {rarityOf(aesthetic)} ·{' '}
        {aesthetic.verification.status === 'verified'
          ? 'Source-checked terminology or context; styling suggestions are authored.'
          : aesthetic.verification.status === 'not-applicable'
            ? 'Authored styling; factual verification does not apply.'
            : 'Source verification pending.'}
      </p>
      {aesthetic.aliases?.length ? (
        <p className="helper-text">
          Also known as: {aesthetic.aliases.join(' · ')}
        </p>
      ) : null}
      <Field label="CAS styling suggestions">
        <ul>
          {aesthetic.casSuggestions.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Field>
      {aesthetic.hairSuggestions && (
        <Field label="Hair suggestions">
          {aesthetic.hairSuggestions.join(' · ')}
        </Field>
      )}
      {aesthetic.makeupSuggestions && (
        <Field label="Optional makeup">
          {aesthetic.makeupSuggestions.join(' · ')}
        </Field>
      )}
      {aesthetic.accessories && (
        <Field label="Accessories">{aesthetic.accessories.join(' · ')}</Field>
      )}
      {aesthetic.culturalContext && (
        <p className="helper-text">{aesthetic.culturalContext}</p>
      )}
      <Field label="Suggested worlds (creative associations)">
        {aesthetic.worldAssociations
          .map((id) => catalog.worlds.find((world) => world.id === id)?.name)
          .filter(Boolean)
          .join(' · ') || 'An outsider style in any world'}
      </Field>
      {aesthetic.verification.sources.length > 0 && (
        <details>
          <summary>Source references</summary>
          <p>{aesthetic.verification.notes}</p>
          {aesthetic.verification.sources.map((source) => (
            <p key={source}>
              <a href={source} target="_blank" rel="noreferrer">
                Reference ({new URL(source).hostname})
              </a>
            </p>
          ))}
        </details>
      )}
    </article>
  );
}
export function GeneratorFrame({
  title,
  introduction,
  children,
}: {
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <section className="generator-page">
      <p className="eyebrow">YOUR NEXT STORY STARTS HERE</p>
      <h1 id="page-title" tabIndex={-1}>
        {title}
      </h1>
      <p className="page-introduction">{introduction}</p>
      <SampleNotice />
      {children}
    </section>
  );
}
