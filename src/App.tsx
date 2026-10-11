import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { PrivacyNotice } from './components/PrivacyNotice';
import { StudioProvider } from './components/StudioProvider';
import { CastingProvider } from './components/CastingProvider';
import { CastingBoard } from './components/CastingBoard';
import { PlanningProvider } from './components/PlanningProvider';
import { WorldPopulation } from './components/WorldPopulation';
import { RelationshipWeb } from './components/RelationshipWeb';
import { SharedSettingsPanel } from './components/SettingsPanel';
import { HouseholdGenerator } from './components/generators/HouseholdGenerator';
import { SimGenerator } from './components/generators/SimGenerator';
import { AestheticGenerator } from './components/generators/AestheticGenerator';
import { WorldGenerator } from './components/generators/WorldGenerator';
import { RelationshipGenerator } from './components/generators/RelationshipGenerator';
import { MatureGenerator } from './components/generators/MatureGenerator';
import { generatorSections, pageFromHash } from './data/navigation';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const [page, setPage] = useState(() => pageFromHash(window.location.hash));
  const { theme, toggleTheme } = useTheme();
  const initialPage = useRef(true);
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    document.title = `${page === 'home' ? 'Create a world full of stories.' : page === 'casting' ? 'Casting Board' : page === 'population' ? 'World Population' : page === 'web' ? 'Relationship Web' : generatorSections.find((section) => section.id === page)?.title} | Townieverse`;
    if (initialPage.current) {
      initialPage.current = false;
      return;
    }
    if (
      window.location.hash !== '#generators' &&
      window.location.hash !== '#main-content'
    ) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('page-title')?.focus({ preventScroll: true });
    }
  }, [page]);
  const pages = {
    home: <Home />,
    household: <HouseholdGenerator />,
    sim: <SimGenerator />,
    aesthetic: <AestheticGenerator />,
    world: <WorldGenerator />,
    relationship: <RelationshipGenerator />,
    mature: <MatureGenerator />,
    casting: <CastingBoard />,
    population: <WorldPopulation />,
    web: <RelationshipWeb />,
  };
  return (
    <StudioProvider>
      <CastingProvider>
        <PlanningProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Header page={page} theme={theme} toggleTheme={toggleTheme} />
          <main id="main-content" tabIndex={-1}>
            <SharedSettingsPanel />
            {pages[page]}
          </main>
          <footer className="site-footer">
            <a className="footer-brand" href="#/home">
              townieverse<span aria-hidden="true"> ✦</span>
            </a>
            <p>
              An unofficial, fan-made tool for The Sims 4.
              <br />
              Not affiliated with or endorsed by Electronic Arts or Maxis.
            </p>
            <span className="footer-tagline">A world of your own.</span>
            <PrivacyNotice />
          </footer>
        </PlanningProvider>
      </CastingProvider>
    </StudioProvider>
  );
}
