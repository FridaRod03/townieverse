import { generatorSections } from '../data/navigation';
import { HouseholdGenerator } from './generators/HouseholdGenerator';

export function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true">✦</span> A little inspiration. A whole new
            save.
          </p>
          <h1 id="page-title" tabIndex={-1}>
            Create a world
            <br />
            full of{' '}
            <span className="story-word">
              stories<span aria-hidden="true">.</span>
            </span>
          </h1>
          <p className="hero-description">
            Meet your next favorite townie. Dream up households, discover a
            signature style, and connect the dots in your Sims 4 world.
          </p>
          <div className="home-entry-points">
            <a className="button primary" href="#/household">
              Create a Household <span aria-hidden="true">↗</span>
            </a>
            <a className="secondary-button" href="#/aesthetic">
              Style a Sim
            </a>
            <a className="secondary-button" href="#/world">
              Populate a World
            </a>
          </div>
          <p className="hero-note">
            Your imagination, with a little spark from us.
          </p>
        </div>
        <div
          className="scrapbook"
          aria-label="Decorative character inspiration board"
        >
          <span className="sticker sticker-top" aria-hidden="true">
            ★ new story energy ★
          </span>
          <div className="character-card">
            <div className="card-meta">
              <span>THE CASTING FILES</span>
              <span>NO. 001</span>
            </div>
            <div className="portrait-art" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="art-star star-one">✦</span>
              <span className="art-star star-two">✧</span>
              <span className="silhouette">
                <span className="hair" />
                <span className="face" />
                <span className="shirt" />
              </span>
              <span className="portrait-label">
                main character
                <br />
                in the making
              </span>
            </div>
            <div className="character-caption">
              <strong>Who lives here?</strong>
              <span>That’s where your story starts.</span>
            </div>
          </div>
          <div className="note-card">
            <span aria-hidden="true">♡</span>
            <p>
              A new neighbor.
              <br />
              An old secret.
              <br />
              <strong>A thousand possibilities.</strong>
            </p>
          </div>
          <span className="sticker sticker-bottom" aria-hidden="true">
            made for your imagination ↗
          </span>
        </div>
      </section>
      <HouseholdGenerator embedded />
      <div className="ticker" aria-hidden="true">
        <span>CREATE</span> ✦ <span>STYLE</span> ✦ <span>CONNECT</span> ✦{' '}
        <span>STORYTELL</span> ✦ <span>REPEAT</span>
      </div>
      <section
        id="generators"
        className="generator-section"
        aria-labelledby="generators-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE CREATIVE TOOLKIT</p>
            <h2 id="generators-title">Pick your starting point.</h2>
          </div>
          <p>
            Six ways to make your save
            <br />
            feel a little more alive.
          </p>
        </div>
        <div className="generator-grid">
          {generatorSections.map((section) => (
            <a
              className={`generator-card card-${section.id}`}
              key={section.id}
              href={`#/${section.id}`}
            >
              <div className="card-top">
                <span className="generator-icon" aria-hidden="true">
                  {section.icon}
                </span>
                <span className="card-number">{section.number} / 06</span>
              </div>
              <h3>
                {section.title}
                {section.adultOnly && <span className="age-badge">18+</span>}
              </h3>
              <p>{section.description}</p>
              <div className="card-bottom">
                <span className="status-label">
                  {section.adultOnly
                    ? 'Optional · off by default'
                    : 'Explore the generator'}
                </span>
                <span className="card-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <aside className="studio-note">
        <span className="note-star" aria-hidden="true">
          ✧
        </span>
        <div>
          <h2>A creative space, still taking shape.</h2>
          <p>
            Explore an expanded library of household stories, character
            backgrounds, and styling guides alongside individually labeled
            official game data. Coverage is still growing. Save your creations,
            favorite ideas, and track their progress on your{' '}
            <a href="#/casting">Casting Board</a>.
          </p>
        </div>
        <span className="phase-badge">PUBLIC BETA</span>
      </aside>
    </>
  );
}
