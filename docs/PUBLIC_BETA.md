# Public beta publication

Publishing was explicitly approved on October 10, 2026. This record supplements the historical [preparation checks](BETA_CHECKS.md).

## Reviewed publication contents

- Reviewed all 158 staged project files before publication. No credential-pattern matches, personal email addresses, Windows user paths, ignored environment/private-key files, runtime saves or unrelated project files were found in the staged text and file list.
- Documentation backups are synthetic compatibility fixtures required by existing tests; production output does not contain these files. Screenshots contain fictional QA data and original app artwork.
- Git author identity uses the authenticated GitHub username and its ID-based no-reply address, configured only in Townieverse. The existing personal Git email is not used for the public commit.
- The repository is isolated within Townieverse on `main`. No parent project Git files or existing remote are changed.
- All 396 tests, TypeScript, ESLint, formatting, content validation and the local production build passed during preparation. Application code and storage keys remain unchanged during publication.

## Publication status

GitHub repository creation, push and Vercel deployment are in progress. The verified production URL and live checks will be recorded here once deployment completes. No working website URL is claimed before verification.

The application is static and requires no backend, cloud database or environment variables. Vercel settings: Vite, Node 24.x, `npm install`, `npm run build`, output `dist`, production branch `main`. Existing local saves require manual JSON backup transfer as described in [the deployment guide](DEPLOYMENT.md#moving-localhost-saves-to-the-public-site).
