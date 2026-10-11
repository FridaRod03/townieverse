# Public beta publication

Publishing was explicitly approved on October 10, 2026. This record supplements the historical [preparation checks](BETA_CHECKS.md).

## Reviewed publication contents

- Reviewed all 158 staged project files before publication. No credential-pattern matches, personal email addresses, Windows user paths, ignored environment/private-key files, runtime saves or unrelated project files were found in the staged text and file list.
- Documentation backups are synthetic compatibility fixtures required by existing tests; production output does not contain these files. Screenshots contain fictional QA data and original app artwork.
- Git author identity uses the authenticated GitHub username and its ID-based no-reply address, configured only in Townieverse. The existing personal Git email is not used for the public commit.
- The repository is isolated within Townieverse on `main`. No parent project Git files or existing remote are changed.
- All 396 tests, TypeScript, ESLint, formatting, content validation and the local production build passed during preparation. Application code and storage keys remain unchanged during publication.

## Publication status

The public repository is [FridaRod03/townieverse](https://github.com/FridaRod03/townieverse), created without initializing unrelated files. Initial commit `5769176` was pushed to `main` successfully. The repository has no exposed personal author email.

The public beta is deployed at **[townieverse.vercel.app](https://townieverse.vercel.app)** on the personal Hobby plan. Vercel imported only the approved repository and successfully built production commit `a9ed8a4`. Pushes to `main` trigger subsequent production deployments.

## Live verification

- An unauthenticated HTTPS request returned HTTP 200 with `Cache-Control: no-cache`; no hosting login is needed to visit the production domain.
- All ten canonical routes opened directly and retained their expected page heading after refresh: `/#/home`, `/#/household`, `/#/sim`, `/#/aesthetic`, `/#/world`, `/#/relationship`, `/#/mature`, `/#/casting`, `/#/population`, and `/#/web`.
- All six generators produced results. Mature settings were initially all off; a non-graphic adult crime prompt was tested and the option switched off again.
- A generated household remained on the Casting Board after refresh. A clearly named local QA planning profile, household assignment, two linked characters and a saved friendship connection remained available after refresh. These are browser-local QA data, not bundled starter saves or shared public data.
- Mobile navigation worked at 390px and closed after selecting a page. All ten pages had no horizontal overflow at 320px. Both themes rendered and the selected theme survived refresh. The Relationship Web list-only view retained connection editing controls.
- The privacy disclosure opened and closed with the keyboard. Browser console warning/error logs were empty.
- [Live homepage screenshot](public-beta-live.png) records the deployed interface. The 396 passing preparation tests and checks remain applicable: publishing changed documentation only, with no application code or persistent storage key changes. Formatting was checked again for the publication updates.

No deployment blockers remain. Existing beta content-coverage and browser-local-storage limitations are documented in the README and content status report. JSON backup/import compatibility was tested during preparation; live refresh checks confirm persistence on the production origin.

The application is static and requires no backend, cloud database or environment variables. Vercel settings: Vite, Node 24.x, `npm install`, `npm run build`, output `dist`, production branch `main`. Existing local saves require manual JSON backup transfer as described in [the deployment guide](DEPLOYMENT.md#moving-localhost-saves-to-the-public-site).
