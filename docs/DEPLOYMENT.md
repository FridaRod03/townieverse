# Public beta deployment

Phase 10. Townieverse is a static React/TypeScript/Vite application. It needs no backend, database, environment variables, cloud storage, analytics integration or paid add-on. No repository has been created on GitHub, no remote has been configured and no code has been pushed or deployed during preparation.

## Local development and production checks

From the Townieverse directory, with Node 24.x and npm:

```powershell
npm ci
npm run dev
```

To check and serve the actual production output:

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run validate:content
npm run build
npm run preview -- --port 4177 --strictPort
```

Open the printed local address. Stop with Ctrl+C. The preview server is for local inspection; Vercel serves `dist/` directly. A different port is a different browser-storage origin.

## GitHub publishing — execute only after approval

The project was initially untracked inside a parent Personal Projects repository. Preparation initializes a separate repository **inside Townieverse**, on `main`, to avoid publishing unrelated folders. Run all commands from Townieverse. Check `git rev-parse --show-toplevel` resolves to Townieverse itself.

1. On GitHub, create an empty repository named `townieverse` with the approved visibility. Leave README, license and gitignore initialization unchecked to avoid an unrelated first commit.
2. Review the files and choose the Git author identity you want associated with public commits. Use your GitHub no-reply address if desired; configure identity locally with `git config user.name` and `git config user.email` rather than changing global settings.
3. Run the following, replacing `YOUR-OWNER` with the repository owner. These are publishing instructions, **not actions already performed**:

```powershell
git status --short
git rev-parse --show-toplevel
git remote -v
git add .
git diff --cached --check
git diff --cached --stat
git commit -m "Prepare Townieverse public beta"
git remote add origin https://github.com/YOUR-OWNER/townieverse.git
git push -u origin main
```

If `origin` already exists, stop and inspect it. Do not overwrite it or force-push. Authenticate through GitHub's supported browser/credential flow; never put a token in source files or the remote URL. `.gitignore` excludes dependency/build/cache folders, local environment files, local Vercel settings, private `backups/`, logs and private key files. `package-lock.json` stays in the repository. GitHub will contain source and synthetic QA fixtures, not runtime browser saves. There is no existing Townieverse commit history to clean.

Source: [GitHub's local-code publishing instructions](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github?platform=windows).

## Vercel deployment — execute only after approval

1. Sign in to Vercel and select **Add New → Project**. Connect GitHub only after approval and grant access to the Townieverse repository.
2. Import `townieverse`. Use its repository root (`./`), not a parent Personal Projects directory. Select the personal Hobby plan if your use meets its terms; do not add paid integrations or services.
3. Confirm these settings, already recorded in `vercel.json`:

| Setting               | Value           |
| --------------------- | --------------- |
| Framework preset      | Vite            |
| Build command         | `npm run build` |
| Output directory      | `dist`          |
| Install command       | `npm install`   |
| Node.js version       | 24.x            |
| Production branch     | `main`          |
| Environment variables | None            |

4. Click **Deploy** after approval. Inspect the build logs. Test the resulting HTTPS address in a signed-out/private window to confirm it is publicly accessible; check deployment protection settings if it requests a Vercel login.
5. Open and refresh `/#/home`, `/#/household`, `/#/sim`, `/#/aesthetic`, `/#/world`, `/#/relationship`, `/#/mature`, `/#/casting`, `/#/population` and `/#/web`. Verify assets, generation, themes and backup restoration before announcing the beta.

Routes intentionally use URL fragments. The server receives `/` for every deep link, so **no SPA rewrite is required**. `/web` is not the application's canonical route; use `/#/web`. Retaining hash routing preserves existing bookmarks. Missing asset paths should remain errors rather than receiving HTML. `vercel.json` asks browsers to revalidate the HTML shell; Vite filenames hash the JS/CSS assets. No service worker or offline cache can hold an old release indefinitely. An already-open tab continues its current version until refreshed. Updates keep the storage keys and data schemas; never clear site data as a routine deployment step.

Sources: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [Node 24 build support](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions).

## Moving localhost saves to the public site

LocalStorage belongs to a specific browser and origin (scheme, hostname and port). `localhost`, `127.0.0.1`, development ports, Vercel preview URLs, the production domain and a future custom domain all have separate storage. Localhost saves **do not transfer automatically**. Keep the old site and its data until restoration is verified.

1. On the exact local address where your saves exist, open **Casting Board** and select **Export Backup**. Save the complete JSON backup, not only a filtered selection or TXT summary.
2. Open **World Population → Planning backups and recovery** and export **all profiles** as JSON. This includes profile-scoped Relationship Web data, placements, custom lots, notes and recovery snapshots. Optionally export all Relationship Webs separately as an additional backup.
3. On the deployed site, import the Casting Board JSON through **Import JSON backup**. Inspect the preview and choose **Merge** to keep current data.
4. Import the planning JSON through **Planning backups and recovery**. Inspect the preview and choose **Merge**. Importing Board first gives plans their live household references. A separate web backup uses the Relationship Web importer, not the Board importer.
5. Check favorites, notes, creation progress, profile assignments and connections, then refresh and verify them again. Re-select your owned packs, other generator preferences and theme: those settings are not part of the JSON collection backups. TXT exports are readable summaries, not restorable backups.

Duplicate conflicts may be preserved as separate entries/profiles on merge. Replacement is destructive and requires explicit confirmation in the app; it is unnecessary for a fresh empty site. Older Board and planning JSON remain supported. See [Casting Board recovery](CASTING_BOARD.md), [planning recovery](WORLD_POPULATION.md) and [Relationship Web backups](RELATIONSHIP_WEB.md).

## Privacy, content and known beta limits

- User saves live in browser LocalStorage. There are no app accounts, upload endpoint, cloud synchronization or built-in analytics. Hosting still processes ordinary requests to deliver files. Backups contain readable stories/notes; keep personal backups private and outside the public repository (the local `backups/` folder is ignored).
- Browser data may disappear when site storage is cleared, private sessions close, or quotas/eviction apply. Export regularly, including before updates and domain changes. Corruption/quota/stale-tab guards preserve existing data and show recovery notices; simultaneous-tab writes are not a database transaction.
- Mature romance, crime and substance-use themes are independently **off by default**, and generated material is non-graphic fictional storytelling. Previously saved mature stories remain in the user's own Board/backups. No demo saves are seeded into a fresh visitor's Board or planner.
- This is an unofficial fan project, unaffiliated with and not endorsed by Electronic Arts or Maxis. Production artwork is an original CSS illustration and favicon. No EA artwork, game screenshots or logos are shipped.
- Content coverage is curated and incomplete. See [CONTENT_STATUS.md](../CONTENT_STATUS.md), especially fashion coverage and missing verified lot data. Dense relationship graphs may overlap; list mode and keyboard controls remain available. There is no real Sims save-file integration, offline installation or physical-device certification.
- `docs/phase-6-backup-check.json`, `docs/phase-8-backup-check.json` and `docs/phase-9-import-example.json` are **synthetic QA fixtures**, retained for legacy compatibility checks. They are not user saves and are not included in `dist/`. Screenshots in `docs/` show fictional QA data only.

## Verification and publication boundary

The Phase 10 check results and file manifest are recorded in [BETA_CHECKS.md](BETA_CHECKS.md). Local production checks do not confirm Vercel account access or the deployed platform's headers/protection; repeat the listed smoke checks after an approved deployment. Publishing awaits explicit approval and the chosen GitHub owner/repository. No remote, account connection, push or deployment is authorized by this preparation phase.
