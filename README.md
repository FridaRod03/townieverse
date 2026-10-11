# Townieverse

**Create a world full of stories.**

**Public beta: [townieverse.vercel.app](https://townieverse.vercel.app).** Source: [FridaRod03/townieverse](https://github.com/FridaRod03/townieverse). See [the publication record](docs/PUBLIC_BETA.md) for deployment status and live verification, and [the deployment guide](docs/DEPLOYMENT.md) for commands, hosting settings and backup transfer instructions.

A personal React + TypeScript project for an unofficial Sims 4 storytelling tool. Phase 9 adds a profile-scoped Character Relationship Web with an interactive board, accessible list and relationship backups. Phase 8 added a World Population Tracker with local save-file planning profiles and household assignments. Phase 7 expanded the curated content and searchable aesthetic directory. The six generators retain the local Casting Board, creation tracking, and JSON/TXT backups. Official game fields, original stories, and fashion guidance are individually classified. See [CONTENT_STATUS.md](CONTENT_STATUS.md) for exact library counts and gaps, and [Casting Board documentation](docs/CASTING_BOARD.md) for saving and recovery.

## Requirements and setup

Use Node.js 24.x and npm; `package.json` pins the Node major version used for Vercel builds. Development and beta verification use Node.js 24.11.0 and npm 11.6.1.

```powershell
cd '<your-projects-folder>\townieverse'
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with Ctrl+C.

## Commands

| Command                                | Purpose                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                          | Start local Vite development server                                  |
| `npm run typecheck`                    | Check application, tests, and Vite configuration                     |
| `npm run lint`                         | Run ESLint with zero warnings allowed                                |
| `npm test`                             | Run Vitest navigation and engine tests                               |
| `npm run test:watch`                   | Run Vitest in watch mode                                             |
| `npm run format`                       | Format source and documentation with Prettier                        |
| `npm run format:check`                 | Verify formatting                                                    |
| `npm run build`                        | Check TypeScript and create production files in `dist/`              |
| `npm run preview`                      | Serve the production build locally                                   |
| `npm run validate:content`             | Audit content, references, classifications, and duplicate candidates |
| `npm run validate:content -- --report` | Also save counts and coverage to `docs/content-validation.json`      |

## Production and public beta

Build with `npm run build`, then run `npm run preview` and open its printed URL. The static output is `dist/`; a backend is unnecessary. Routes such as `/#/casting`, `/#/population` and `/#/web` work directly and on refresh. Hash routing requires no Vercel SPA rewrite. There is no service worker; the HTML shell revalidates and Vite uses hashed asset filenames.

After publishing approval, create an empty GitHub `townieverse` repository, review/stage the project, make the first local commit, add its URL as `origin` (only if none exists), and push `main`. The local repository is isolated inside Townieverse. Follow [the exact GitHub commands](docs/DEPLOYMENT.md#github-publishing--execute-only-after-approval); nothing has been committed or pushed during preparation.

Then import the GitHub repository into Vercel with **Vite**, root `./`, **Node 24.x**, install **`npm install`**, build **`npm run build`**, output **`dist`** and production branch **`main`**. No environment variables or add-on services are required. `vercel.json` records the build settings. [The deployment guide](docs/DEPLOYMENT.md#vercel-deployment--execute-only-after-approval) includes public-access and post-deployment checks.

**Move your saves explicitly:** on the original localhost address, export the complete **Casting Board → Export Backup** JSON and **World Population → Planning backups and recovery → all profiles** JSON. Planning backups include Relationship Web data. On the deployed site, import **Board first, planning second**, review each preview and use Merge. Re-select pack preferences and theme. TXT summaries cannot restore data. Keep the local copies until restored saves survive refresh.

Browser storage is specific to the browser and website origin; localhost data never transfers automatically. Clearing site data, private browsing, device/domain changes and storage quotas can affect saves. Keep JSON backups private and export regularly, including before updates. App updates preserve the existing storage keys. Townieverse has no accounts, cloud synchronization or built-in analytics; hosting handles normal file requests. The in-app footer explains privacy and recovery.

Known beta limitations: incomplete curated fashion/official-lot coverage, overlapping dense graphs, browser storage quotas and simultaneous-tab limits, session-only unsaved generator rolls/custom generator lots, no offline PWA, no real Sims save-file editing, and no physical-device certification. See [CONTENT_STATUS.md](CONTENT_STATUS.md) and [the verification record](docs/BETA_CHECKS.md). Mature themes stay off by default; production contains no preloaded demo saves or EA artwork. Synthetic documentation backups remain only as compatibility fixtures.

## Structure

```text
public/                  Original favicon
src/
  App.tsx                Application shell and hash navigation
  main.tsx               React entry point
  components/            Shell, settings, provider, six generator interfaces
  data/                  Defaults, retained test fixtures, active content library, validator
    library/             Modular household, fashion, world, Sim, relationship, and mature data
  generators/            Reusable engine; public API in index.ts
  hooks/                 Theme, studio context, session state, seeded roll hooks
  types/                 Content models, preferences, typed results, navigation
  utils/                 Random selection, stored-settings validation, text sharing
  styles/                Responsive CSS and theme tokens
tests/                   Engine, navigation, preferences, and React interaction tests
docs/ENGINE.md           Engine behavior and content-authoring guide
docs/SOURCES.md          Dated source scope and verification methodology
docs/CONTENT_REVIEW.md   Editorial decisions, exclusions, and limitations
CONTENT_STATUS.md        Exact active counts and remaining quality/coverage gaps
scripts/                 Content audit CLI
```

## Implemented in Phase 2

- Responsive homepage with original CSS illustration and six generator cards.
- Six deep-linkable placeholder pages, with browser back/forward navigation through hash routes.
- Desktop navigation and collapsible mobile menu, including Escape-to-close behavior.
- Light and dark modes; the first visit uses the operating system preference. The selected theme persists in LocalStorage, with graceful fallback when storage is unavailable.
- Skip link, semantic landmarks, visible keyboard focus, accessible button names, and reduced-motion support.
- Modular React components, strict TypeScript, Vite, Vitest, ESLint, and Prettier.
- Unofficial fan-made notice. No Sims artwork or logos, external fonts, backend, or database.

## Not implemented yet

Exhaustive fashion/game/location coverage and offline installation remain future work. The app has no service worker and is not an installable offline PWA. There is no backend, cloud synchronization or account requirement. Publishing is approved; current hosting status is recorded in [the publication record](docs/PUBLIC_BETA.md).

Phases 6–10 and public beta publishing were approved.

## Implemented in Phase 3

- Shared typed data models and success/error results for all generator domains.
- Seeded randomness, uniform and weighted selection, and all five randomization modes.
- Correct category-first 75/20/5 balanced aesthetic selection, missing-bucket redistribution, world matching, search/category filters, and distinct two-style blends.
- Pack, age, verification, custom/roleplay, and independent mature-theme filtering.
- Household composition search and validation, directed biological/adoptive/step ties, and category-specific requirements.
- Sim trait/aspiration/career/personality generation, relationship generation, exact world/neighborhood/lot selection, and explicitly assigned private storylines.
- Atomic field rerolls, locked-field validation, and independent seeded streams for core results.

Read [docs/ENGINE.md](docs/ENGINE.md) for APIs, data authoring, seed semantics, and limitations. Test fixtures are fictional roleplay content, not official game datasets.

## Verification

Historical Phase 2 and Phase 3 checks are recorded below; see Phase 4 verification for the current application.

Verified on October 10, 2026:

- Dependency installation completed; `package-lock.json` records resolved versions.
- TypeScript check passed.
- ESLint passed with zero warnings.
- Vitest passed: 2 tests covering all six generator routes and fallback for unknown routes and home-page anchors.
- Production build passed: 34 modules transformed, output in `dist/`.
- Prettier formatting check passed.
- Local development server returned HTTP 200.
- Browser checks passed for all six placeholders, light/dark theme persistence after reload, mobile menu opening and automatic closure after navigation, and Escape closing the menu and restoring button focus.
- Homepage overflow checks passed at viewport widths of 320, 390, 768, and 1280 pixels. No browser warning/error logs were observed during verification.

Windows sandbox restrictions initially prevented npm network access and Vite/Vitest file resolution. Installation, affected checks, and the preview were rerun successfully with approved permissions. Phase 3 verification is recorded below.

### Phase 3 verification

Verified on October 10, 2026:

- TypeScript check passed.
- ESLint passed with zero warnings.
- Prettier formatting and formatting check passed.
- Vitest passed: **110 tests across 8 files**, including the existing 2 navigation tests.
- Production build passed with 34 modules transformed. The existing interface remains unchanged; engine modules are not yet imported by the UI.

The deterministic test suite covers seeds, uniform/weighted selection, 20,000-draw balanced-mode bucket probabilities, missing-bucket redistribution, pack/world/lot filtering, content and age safety, household categories and genealogy, Sim trait compatibility, field locks, unlocked-field recovery, blending, empty pools, and invalid configurations. Probability checks use fixed seeds and tolerances rather than nondeterministic draws.

## Implemented in Phase 4

- **Surprise Me / Households:** compatible setting, neighborhood or eligible custom lot, roster, backstory, family ties, shared aesthetic, and expandable Sim profiles. The combined generator calls the existing core engine and validates matching roster identities, ages, traits, careers, and aspirations. Household filters include category, finance, living arrangement, and shared minimum/maximum size.
- **Individual Sims:** age selection, personality, traits, aspiration, occupation, hobbies, likes/dislikes, goal, flaw, and styling. Career, aspiration, personality, and aesthetic can be rerolled separately.
- **Aesthetics:** searchable starter library, category filtering, all five engine modes, world inspiration, distinct two-style blends, CAS suggestions, and independent rerolls.
- **Worlds & lots:** world and neighborhood rolls, world-inspired styling, custom lot entry, and repeat avoidance. No official exact lot data is supplied, so missing lots produce an explanation rather than a fabricated address.
- **Relationships:** generated or manually entered Sims; friendship, family, romance, rivalry, work, and neighbors; tone filters and optional interpersonal drama. Known household genealogy and age compatibility are checked. Manual entries cannot expose unknown family history.
- **Mature stories:** three independent controls for adult romance, crime, and substance use, all off initially. Prompts are non-graphic and explicitly assigned to eligible participants. The starter mature prompts all require adult ages; turning a theme off hides its previous result and excludes it from copying.
- Copy results as plain text, with a selectable text fallback if clipboard access fails. Light/dark themes, hash navigation, skip link, keyboard focus, labeled controls, error alerts, and reduced-motion support are retained.

### Phase 4 starter library and pack limitations (historical)

This subsection records the earlier preview. The live Phase 5 catalog and selector are described below.

`src/data/starter.ts` contains **3 fictional worlds, 6 fictional neighborhoods, 10 household templates, 12 aesthetics, 6 trait suggestions, 3 aspirations, 5 occupations, 3 personality profiles, 13 relationship prompts, and 3 optional mature prompts**. These are authored roleplay ideas, not official game traits, careers, aspirations, worlds, or lots. The library is deliberately small and repeated outcomes are expected. Fixed template rosters mean not every requested category/size/finance combination has a match; broaden filters when the engine explains that no result is eligible.

The owned-pack UI currently supports only **Get to Work** and **Vampires**, because these are the only sample dependencies. It is not a complete Sims 4 pack selector. Pack names/types were checked against EA’s [Get to Work announcement](https://news.ea.com/press-releases/press-releases-details/2015/The-Sims-4-Get-to-Work-is-Now-Available/default.aspx) and [Vampires page](https://www.ea.com/games/the-sims/the-sims-4/buy/addon/the-sims-4-vampires). Pack-dependent sample worlds and households are still fictional. Sim profile generation supports Child through Elder in this preview; younger ages remain engine model types without populated UI profiles.

### Preferences, seeds, and locks

Shared settings persist under `townieverse.settings.v1`. Runtime validation checks the version, types, supported packs, modes, categories, ages, booleans, seed length, and size range before loading. Corrupt or unavailable storage falls back safely with a notice. Invalid size ranges remain editable but are not saved. Reset restores generator defaults. Theme continues to use the separate `townieverse.theme` key.

A fixed optional seed reproduces the first roll after reload with the same filters and data. Each page maintains its own advancing roll counter; rerolls consume another roll, including failed attempts. Blank seeds use a new random seed for each click. Results, locks, page selections, counters, custom lots, and lot history live in React memory and survive navigation, but reload clears them. Custom lots are explicitly user-created; their names and dimensions are user supplied and not verified official game data. Adding one enables custom selection. Exact lot selection must also match the selected neighborhood.

Visible lock buttons preserve worlds, household templates, Sim age/personality/aspiration/career/style, and individual aesthetic halves. Household locks retain the roster and backstory while rebuilding member profiles; use the Sim page’s locks for individual profile rerolls. Personality locks preserve traits, hobbies, likes/dislikes, goal, and flaw together. A reroll validates retained values against current filters. Incompatible locks remain selected and produce an explanation; they are not silently dropped. If a mature household is hidden after its setting is disabled, its locks can still be explicitly cleared.

The provider (`src/components/StudioProvider.tsx`) owns shared state. Page components in `src/components/generators/` handle controls and rendering; `src/generators/concepts.ts` composes the existing pure engine. Preference validation and text formatting live in `src/utils/`. No engine fixture was turned into official game data.

### Phase 4 verification

Verified on October 10, 2026:

- TypeScript, ESLint (zero warnings), Prettier formatting check, Vitest, and production build passed.
- **141 tests across 11 files**, preserving the original 110 engine/navigation tests and adding combined-concept, saved-settings, and React Testing Library interaction coverage.
- Browser checks covered all six pages, generated results, expandable profiles, world/career/aesthetic locks, custom lots, missing-lot feedback, relationships, disabled mature controls, teen rejection, settings and theme persistence after reload, and mobile navigation.
- Generated household layouts had no horizontal overflow at 320 and 390 pixels; desktop checks used 1280 pixels. Keyboard Escape closes the mobile menu and restores toggle focus. Route changes focus the page heading; forms and disclosures expose accessible names. This is functional accessibility verification, not a comprehensive assistive-technology audit.

Phase 4 was approved before Phase 5 began.

## Implemented in Phase 5

- Modular live catalog in `src/data/library/`: **300 household stories, 150 relationships, 150 backgrounds, 78 mature prompts, and 100 styling entries**. Original fixtures and IDs remain available for regression testing.
- Individually labeled official fields: **31 official map worlds, 37 official neighborhoods, 4 exact lots, 7 traits, 7 aspirations, 38 careers/jobs**, and **116 pack records**. Three fictional worlds remain separate from official worlds. Pack requirements filter generation.
- Source-checked fashion terminology, aliases, clothing/hair/makeup/accessory suggestions, cultural context, and non-exclusive world associations. Alias search works across browsing, selection, blends, locks, and core-result validation.
- Pack controls grouped into expansion/game/stuff/kit disclosures. Safe mature defaults, theme settings, navigation, copying, and lock behavior are preserved. Combined household generation uses residential worlds.
- `src/data/validation.ts` checks IDs, normalized names, alias collisions, description similarity candidates, required fields, categories, weights, pack/world/trait references, official verification, mature classification, exact-lot dimensions, and every household's composed roster/genealogy. Review candidates are reported, never deleted automatically.
- `CONTENT_STATUS.md`, `docs/SOURCES.md`, `docs/CONTENT_REVIEW.md`, and `docs/content-validation.json` record exact coverage and decisions.

**Limits:** The 400-established-aesthetic goal is not met: 48 entries have checked named-fashion terminology, 40 are ordinary descriptive styling guides, and 12 are original examples. Nineteen official worlds lack neighborhood records and all worlds except Willow Creek lack exact lots. Official traits/aspirations/careers are a verified subset. Child profiles still need roleplay fields; foster/guardian narratives disclose limitations of the current relationship model. See the status report for the full list. No missing official data has been replaced by invented names or dimensions.

### Phase 5 verification

Verified October 10, 2026:

- Dependency installation completed, including a direct `vite-node` development dependency for the audit CLI.
- TypeScript, ESLint with zero warnings, Prettier, content validation, Vitest, and production build passed.
- **170 tests across 13 files**, retaining all 141 prior tests. Added real-library integrity/filter/randomization/performance coverage and real-catalog interface tests. The existing Phase 4 interface suite uses its original small fixture explicitly.
- Every household template composes successfully. Tests check deterministic results in all five modes, real-catalog balanced proportions across 10,000 selections, separate mature toggles, minor rejection, pack exclusions, immutable data, and newly supported saved pack preferences.
- Browser checks use the production preview and cover all six generator routes, generated results, fashion aliases, full CAS guidance, mixed official/roleplay fields, business-partner relationships, separate crime generation, teen rejection, and responsive light/dark layouts.
- Build output is local in `dist/`; no deployment or backend was added.

Phase 5 was approved with its documented coverage limitations before Phase 6 began.

## Implemented in Phase 6

- **Casting Board** navigation and scrapbook cards for complete households, individual Sims (including household members), aesthetic singles/blends, relationships, mature storylines, and world/lot results. Saved snapshots retain original generated content, including custom lot details, without depending on future library changes or regenerating IDs.
- **Save to Casting Board** and **Favorite** on all six generators and the homepage household result. Repeated saving of an identical snapshot selects the existing entry. Favoriting an unsaved result saves it; unfavoriting keeps it on the board.
- Editable titles, notes, comma-separated tags, optional world associations, and six manual progress states: Idea, Planning, Creating in CAS, Created in CAS, Placed in World, Playing. Household members and individual Sims have separate statuses. Idea means not started; no completion is inferred.
- Search original text and metadata, filter by type/world/status/tag/favorites, and sort newest/oldest/alphabetically/last modified. Duplicate a snapshot to make an independent alternate with its own ID and metadata.
- **Export Backup** downloads the full board as versioned JSON. Each entry and the full board can also be exported as readable TXT. Filenames contain UTC timestamps. TXT is a reading format, not a restorable import format.
- JSON import validates the entire file before offering an entry/type/duplicate preview. Merge preserves current entries, skips identical ID duplicates, and assigns new IDs to different entries sharing an ID. Replace requires a separate confirmation. Failed validation or persistence leaves the current saved board unchanged.
- Storage uses `townieverse.casting-board.v1`, separate from preferences and theme. Corrupt or future-version data blocks writes and offers raw recovery export. Confirmed recovery can start a new board or replace it with a validated backup. Quota failures preserve the previous board and explain the failure. Changes detected from another tab require reload before editing.

### Backing up and restoring

1. Open **Casting Board** and choose **Export Backup** regularly, especially before clearing browser data, changing browser/origin, replacing the board, or moving devices.
2. Keep the downloaded JSON somewhere safe. It includes original content, titles, notes, tags, favorites, member progress, and dates.
3. On another browser or after a reset, expand **Import JSON backup**, choose the JSON file, review the preview, and choose Merge or Replace. Replace asks for explicit confirmation.

Your creations are saved in this browser. Export a backup to keep them safe. Browser storage is specific to the browser profile and website origin (including port); it does not synchronize across devices. Development and production-preview URLs can have different boards. Clearing site data or using private browsing can remove saves. A JSON backup is the recovery mechanism; there is no server copy or undo history.

The MVP validates imports up to **10 MB and 2,000 entries**; the actual browser quota can be reached sooner. Generated content is read-only after saving; edits change metadata. Unsaved generator results and the custom-lot working pool still last only for the current session, but saved snapshots retain their custom lots. Saved mature storylines are explicitly chosen snapshots and remain accessible on the board; generator toggles do not remove them from backups. Current coverage limitations are documented in CONTENT_STATUS.md.

See [docs/CASTING_BOARD.md](docs/CASTING_BOARD.md) for the storage schema, migration, import rules, and failure/recovery behavior. Phase 7 is implemented; see the audit below.

### Phase 6 verification

Verified October 10, 2026:

- **219 tests across 15 files passed**, preserving all 170 prior tests and adding 49 persistence, import/export, organization, and interface tests.
- TypeScript, ESLint with zero warnings, Prettier, and the production build passed. The catalog is bundled separately from application code, with no build size warnings.
- Production-browser checks saved a complete household, reloaded it, edited notes/title/tags/status, favorited it, and tracked two same-name members independently. A separate Sim was also saved and survived reload.
- The actual downloaded JSON backup was inspected, imported through the file picker, validated and previewed, and merged without duplicating its existing entry. It retained the household snapshot, tags, favorite, notes, and individual member progress. JSON/TXT single-entry and full-board exports and timestamped filenames also have automated coverage.
- Casting Board and metadata editing had no horizontal overflow at 320 and 390 pixels; desktop checks used 1280 pixels. Light/dark modes, mobile navigation, keyboard form navigation, confirmation focus trapping, Escape cancellation, and focus restoration worked. No browser console errors or warnings were reported.
- `docs/phase-6-preview.png` shows the verified board; `docs/phase-6-backup-check.json` contains the generated demonstration household used for the backup round trip. Both are review artifacts, not additions to the content library.

Phase 6 was approved before Phase 7 began.

## Implemented in Phase 7

- Expanded to **200 meaningful styling entries**: 57 established styles/subcultures, 17 internet aesthetics, 19 historical styles, 75 practical guides and 32 original concepts. The 400+ target remains unfinished.
- Added 29 official traits, 26 aspirations, 6 careers, 55 neighborhoods and 10 exact lots. Totals and remaining gaps are in [CONTENT_STATUS.md](CONTENT_STATUS.md); sources, pack reconciliation and modified files are in [docs/PHASE_7_AUDIT.md](docs/PHASE_7_AUDIT.md).
- Search names/aliases with accent-insensitive matching. Filter by category, classification, editorial rarity or associated world; browse descriptions/tips in a paginated directory and favorite canonical aesthetics. Shared discovery rules also apply to selection, blends and locks.
- Balanced Mode retains the 75/20/5 behavior and outsider/wildcard options. Ordinary styling does not require DLC. Every official world has multiple aesthetic matches.
- Expanded integrity checks flag collisions, near duplicates, invalid references/classifications/ages/weights, missing sources and inconsistent trait conflicts. No existing IDs were changed or entries deleted.
- Sim generation now constructs only the selected personality, improving performance as aspirations expand. Old saved snapshots, six legacy entry types and Phase 6 JSON backups remain compatible without a schema migration.

### Phase 7 verification

Verified October 10, 2026:

- **260 tests across 17 files pass**: all 219 existing tests retained plus 41 new content, pack, world, discovery, blending, persistence/import and performance tests. Two old count expectations were updated for the expanded catalog.
- TypeScript, ESLint with zero warnings, Prettier and production build pass. Build transforms 90 modules; content remains in its own chunk. No dependencies were added.
- Content validator reports **zero errors/review flags** and produces the exact-count report. Review heuristics do not prove exhaustive cultural or semantic coverage.
- Production browser checks cover desktop/mobile results for all six generators, aesthetic blending, alias search, expanded styling tips and canonical favorites surviving reload on Casting Board. Light/dark themes and mobile navigation remain usable; expanded directory has no horizontal overflow at 320 pixels.
- Preview checks use a separate port/origin to preserve prior browser saves. No backend/deployment or Phase 8 work was added.

Phase 7 is ready for review with the documented 200-style and official-data coverage gaps. Phase 8 was subsequently approved.

## Implemented in Phase 8

- World Population Tracker with independent save-file profiles, create/edit/switch/duplicate and confirmed deletion.
- Dashboard for all 31 recorded official worlds, pack/search/population filters, neighborhood coverage and placement progress. Disabled-pack assignments remain available.
- Casting Board household assignments with optional neighborhoods/lots, arrangements, notes, custom lots and existing individual Sim progress. Generated content remains unchanged.
- Versioned selected/all-profile backups, validated import previews, additive merge, confirmed replacement, recovery snapshots and corruption/quota/stale-tab protections. Older Casting Board JSON remains compatible through its existing importer.

See [World Population documentation](docs/WORLD_POPULATION.md) for usage, progress calculations, storage limits, known content gaps and the complete file manifest. This is a local planning notebook; it does not read or modify Sims 4 save files. No backend or dependencies were added.

### Phase 8 verification

All **310 tests across 19 files pass**: the 260 existing tests plus 50 planning tests. TypeScript, ESLint with zero warnings, Prettier, content validation and the production build pass. Content validation reports zero issues; catalog counts are unchanged.

Desktop and mobile production-browser checks covered profile persistence, assignments, custom lots without dimensions, world notes, separate same-name Sim progress, pack-disabled plans, duplication, confirmation cancellation, light/dark themes, keyboard focus and JSON export/import. Layouts were checked at 1280, 390 and 320 pixels without horizontal overflow. Original household snapshots stayed unchanged.

The browser export test saved one JSON file to its configured Downloads folder outside the project. A copy is retained as [the checked planning backup](docs/phase-8-backup-check.json). Other implementation and proof artifacts are inside Townieverse.

Phase 9 was subsequently approved.

## Implemented in Phase 9

- Dedicated Relationship Web scoped to each existing save-file profile, with assigned household members and optional standalone characters.
- Pointer/touch dragging, keyboard/numeric positioning, pan, zoom, fit and confirmed layout reset. Selection, distinctive line styles, legend, light/dark themes and simplified large-graph views.
- Accessible character and relationship lists with complete create/edit/delete controls, custom labels, notes, dates, tags, status, planning strength and optional local favorites/icons/colors.
- Stable household/member identifiers, world reassignment continuity, explicit orphan handling and Casting Board **View in Relationship Web** links. Original generated snapshots remain unchanged.
- Duplicate, known-age, ancestry, family-romance and contradictory-state validation; explicit adult consent for romance. Family ties never generate romance automatically.
- Persisted per-profile filters/view preferences, versioned web-only backups and relationship data in population backups. Validated preview/merge, confirmed replacement and existing corruption/quota/stale-tab protections.

See [Relationship Web documentation](docs/RELATIONSHIP_WEB.md) for controls, data model, validation, migration, backup compatibility, performance limits and the complete file manifest. No dependency or backend was added. Phase 10 and public beta publishing were subsequently approved.

### Phase 9 verification

All **394 tests across 21 files pass**, retaining all 310 prior tests and adding 84 relationship tests. TypeScript, ESLint with zero warnings, Prettier, content validation and production build pass. Content validation reports zero issues with unchanged catalog counts.

Desktop/mobile checks cover pointer dragging/panning, keyboard movement/connection selection, persistence, themes, list editing, focus and validated JSON import into a separate profile. Layouts at 1280, 390 and 320 pixels have no horizontal page overflow. Download actions are tested without creating out-of-project browser files. Legacy Phase 6 Casting Board and Phase 8 population backup compatibility is tested against the actual retained files.

Local 50/100/200-character component renders took about 57/109/131 ms; validation/filtering took about 3.5/4.2/12.7 ms. These are jsdom/Node benchmarks, not physical-device frame-rate measurements. Known limits include browser-local quota/origin storage, conservative life-stage rules, incomplete free-text interpretation, overlapping dense edges and no game-file integration. See the documentation for details and proof artifacts.
