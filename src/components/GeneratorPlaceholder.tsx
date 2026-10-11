import type { GeneratorSection } from '../types/navigation';

export function GeneratorPlaceholder({
  section,
}: {
  section: GeneratorSection;
}) {
  return (
    <section className="placeholder-page" aria-labelledby="page-title">
      <a className="back-link" href="#/home">
        ← Back to the creative toolkit
      </a>
      <div className="placeholder-panel">
        <span className="placeholder-icon" aria-hidden="true">
          {section.icon}
        </span>
        <p className="eyebrow">
          GENERATOR {section.number} / 06 · IN DEVELOPMENT
        </p>
        <h1 id="page-title" tabIndex={-1}>
          {section.title}
          {section.adultOnly && <span className="age-badge">18+</span>}
        </h1>
        <p className="placeholder-description">{section.description}</p>
        <div className="coming-soon">
          <strong>Your next story is on its way.</strong>
          <p>This section is a preview. Generation isn’t available yet.</p>
        </div>
        <h2>Planned for this space</h2>
        <ul className="feature-list">
          {section.preview.map((feature) => (
            <li key={feature}>
              <span aria-hidden="true">✦</span>
              {feature}
            </li>
          ))}
        </ul>
        {section.adultOnly && (
          <p className="content-note">
            Mature content will be optional and off by default. Future romance
            and sexual themes will be limited to Young Adult, Adult, and Elder
            Sims, with separate controls for crime and substance themes.
          </p>
        )}
        <a className="button primary" href="#/home">
          Explore other sections <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
