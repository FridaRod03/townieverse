import { useState } from 'react';
import { generatorSections } from '../data/navigation';
import type { PageId } from '../types/navigation';

interface HeaderProps {
  page: PageId;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Header({ page, theme, toggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
          document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus();
        }
      }}
    >
      <div className="nav-shell">
        <a
          className="wordmark"
          href="#/home"
          onClick={() => setMenuOpen(false)}
          aria-label="Townieverse home"
        >
          <span className="brand-mark" aria-hidden="true">
            t.
          </span>
          townieverse
          <span className="brand-star" aria-hidden="true">
            ✦
          </span>
        </a>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
            <span className="theme-label">
              {theme === 'light' ? 'Dark' : 'Light'} mode
            </span>
          </button>
          <button
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}{' '}
            <span aria-hidden="true">{menuOpen ? '×' : '+'}</span>
          </button>
        </div>
      </div>
      <nav
        id="main-navigation"
        className={`main-navigation ${menuOpen ? 'is-open' : ''}`}
        aria-label="Main navigation"
      >
        <a
          href="#/home"
          aria-current={page === 'home' ? 'page' : undefined}
          onClick={() => setMenuOpen(false)}
        >
          Home
        </a>
        {generatorSections.map((section) => (
          <a
            key={section.id}
            href={`#/${section.id}`}
            aria-current={page === section.id ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {section.title}
            {section.adultOnly && <span className="nav-age">18+</span>}
          </a>
        ))}
        <a
          href="#/casting"
          aria-current={page === 'casting' ? 'page' : undefined}
          onClick={() => setMenuOpen(false)}
        >
          Casting Board
        </a>
        <a
          href="#/population"
          aria-current={page === 'population' ? 'page' : undefined}
          onClick={() => setMenuOpen(false)}
        >
          World Population
        </a>
        <a
          href="#/web"
          aria-current={page === 'web' ? 'page' : undefined}
          onClick={() => setMenuOpen(false)}
        >
          Relationship Web
        </a>
      </nav>
    </header>
  );
}
