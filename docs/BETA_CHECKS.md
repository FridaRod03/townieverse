# Phase 10 public beta checks

Prepared locally on October 10, 2026. **No publishing actions performed.**

## Automated verification

| Check                                                              | Result                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| TypeScript (`npm run typecheck`)                                   | Pass                                                                          |
| ESLint (`npm run lint`)                                            | Pass, zero warnings                                                           |
| Prettier (`npm run format:check`)                                  | Pass                                                                          |
| Vitest (`npm test`)                                                | 396 passing tests in 22 files: all 394 existing tests plus 2 beta regressions |
| Content validation (`npm run validate:content -- --report`)        | Pass, zero issues; existing library counts unchanged                          |
| Production build (`npm run build`)                                 | Pass, 111 modules; static `dist/` output                                      |
| Production preview (`npm run preview -- --port 4177 --strictPort`) | Pass; tested the generated bundles, not the development server                |

Windows sandbox file/socket restrictions required rerunning Vitest, content validation, build and preview outside the sandbox. These were tooling restrictions, not application errors. A browser automation timeout interrupted one mobile sweep; it was recovered, and all six mobile generator interactions were subsequently completed.

## Browser checks

- Desktop at 1280 pixels: opened and refreshed every canonical route (Home, all six generators, Casting Board, World Population, Relationship Web). Each retained its correct heading after refresh. All six generators produced results without error alerts. No console errors or warnings were reported.
- Fresh test origin `127.0.0.1:4177`: empty collection/planner initially; all three mature switches unchecked. Crime alone was enabled to exercise the non-graphic mature generator, then disabled. No mature result was saved. Existing user saves on other origins were untouched.
- Generated and saved a household; refresh preserved it. Imported and merged the synthetic Phase 6 Board backup; both entries remained available. Created `Beta QA save`, assigned the generated household with a note, and refreshed: the profile and its three source characters persisted. Added a Friends connection with a note; refresh preserved it.
- The existing regression suite checks Board, selected/all planning and selected/all web exports, download controls, validated imports, legacy JSON compatibility, non-destructive merge, confirmed replacement, corruption, quota and stale-tab protections. Actual browser download actions were avoided because the browser's default download folder is outside the authorized project.
- Mobile at 390 pixels: menu navigation to Board closed the menu; both saved households remained visible. Theme choice survived refresh. At 320 pixels all ten routes had no horizontal page overflow; all six generators produced results without error alerts. Mobile Relationship Web list mode preserved and exposed the connection and edit controls.
- Light/dark layouts were visually checked. Native privacy disclosure opened with Enter/Space; focus styling was visible. Existing keyboard/focus tests remain green. Navigation and primary action controls were exercised at mobile widths; this is browser viewport testing, not hardware touch or a formal accessibility certification.

Proof: [desktop production page](phase-10-preview.png), [320-pixel mobile production page](phase-10-mobile.png).

## Repository and public content audit

The original Git root was the parent Personal Projects folder (`master`, no remote); Townieverse was untracked there. A new independent Git repository is initialized in Townieverse on `main`. No parent Git files were modified. No remote is configured, no commit history exists, and nothing has been pushed. Files are staged locally for review after the final checks.

`.gitignore` excludes `node_modules`, `dist`, `.npm-cache`, coverage/build state, environment files, local Vercel account settings, logs, private `backups/` and private-key files. The lockfile stays included. Review found no credential-pattern matches, personal username/path references in publishable text, environment files, unrelated project files or real user collections. Synthetic backup fixtures are explicitly identified in the deployment guide and retained for existing tests. This is a local inspection, not a guarantee against every possible secret format.

Production output contains only `index.html`, the original favicon and three built JS/CSS assets. Documentation backups, tests, screenshots, source maps and development caches are not shipped in `dist/`. Source references are links, not embedded EA artwork. No network API, backend, service worker, PWA manifest or analytics client is configured. Mature preferences remain off by default. User-authored saves and content IDs are unchanged.

## Files changed or added

- `.gitignore`: local hosting settings, logs and private backup/key exclusions.
- `.gitattributes`: consistent LF text files across Windows and hosting checkouts; screenshots remain binary.
- `package.json`, `package-lock.json`: Node 24.x build engine; no dependencies added.
- `vercel.json`: Vite/build/output/install settings and HTML revalidation headers.
- `src/components/PrivacyNotice.tsx`: browser-local privacy, transfer and backup explanation.
- `src/App.tsx`: footer privacy notice integration.
- `src/components/Home.tsx`: replace development-phase badge with Public Beta.
- `src/styles/index.css`: readable responsive privacy/footer layout.
- `tests/beta-interfaces.test.tsx`: fresh-visit safeguards and byte-preserving storage/remount regressions.
- `README.md`, `docs/DEPLOYMENT.md`, `docs/BETA_CHECKS.md`: setup, publication boundary, exact deployment/transfer steps and verification results.
- `docs/phase-10-preview.png`, `docs/phase-10-mobile.png`: local production proof screenshots.
- `docs/content-validation.json`: refreshed audit report (counts unchanged).
- `.git/`: isolated local Git metadata, inside Townieverse only; excluded automatically from publication.

Generated `dist/` and TypeScript build metadata are local, ignored outputs.

## Remaining deployment conditions

No known application build blocker remains. Publishing still requires explicit approval, a chosen GitHub owner/repository, a Git author identity, authenticated GitHub/Vercel access and account/plan eligibility. The deployed Vercel URL, response headers and public-access settings can only be verified after an approved deployment. Re-run direct-route, generator, mobile, persistence and backup smoke checks on that URL before announcing the beta. Account connections and deployment have deliberately not been attempted.
