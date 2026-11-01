# Publishing

The workflow follows the direct trusted-publishing setup in the sibling
`pi-web-automations` repository. No npm token is used or supported.

## One-time maintainer setup

1. Create the GitHub environment **npm** in `CompN3rd/pi-web-pendant-theme`.
   Configure required reviewers and restrict deployment to release tags as desired.
2. In npm's settings for `@compn3rd/pi-web-pendant-theme`, configure a GitHub
   Actions trusted publisher: owner `CompN3rd`, repository
   `pi-web-pendant-theme`, workflow filename `publish.yml`, environment `npm`.
   This requires package-maintainer access; repository files alone cannot do it.
3. Ensure npm package policy permits direct trusted publishing. Unlike the
   sibling code-review workflow, this workflow does not use staged publishing
   or require a later npm-stage approval. The GitHub environment can gate it.

## Release

1. Update `package.json`, both lockfile version fields, and `CHANGELOG.md`.
   Run `npm ci --ignore-scripts`, `npm test`, and `npm run verify:parser`.
2. Run the real-host visual harness against the target PI WEB release before
   releasing CSS changes (see `review/README.md`). CI's local tests are not a
   substitute for browser compatibility checks.
3. Merge the release commit into `main`, then push its matching stable tag,
   e.g. `v0.6.0`. Do not move an existing tag. Manual dispatch also requires
   selecting that matching tag; a branch dispatch fails validation.
4. Approve the `npm` environment deployment if configured. The workflow
   validates main ancestry and package identity, runs tests, packs once,
   checks the packed assets, and publishes that exact checksummed artifact.
   Only the isolated publish job receives OIDC permission; it has no checkout
   and runs no package scripts. Node 24 must supply npm >=11.5.1.
5. Verify the public npm version, integrity, and provenance before creating
   the GitHub release. A successful dry run or uploaded artifact is not proof
   of publication. Inspect npm before retrying an interrupted publish.

Adding workflow files alone does not provision npm/GitHub publisher settings.
Do not add `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or `NPM_ID_TOKEN`
as a fallback when OIDC fails; correct the trusted publisher configuration.
