# PI WEB 1.202610.9 compatibility check

Latest stable upstream release checked: [v1.202610.9](https://github.com/jmfederico/pi-web/releases/tag/v1.202610.9),
commit `83bcf5637ac7801fb3b1f54653f205cb474475f1` (also npm's latest version at the time of checking).

The release deprecates runtime theme registration in favor of static package
metadata and adds supported message, navigation, composer, and popup hooks.
Existing runtime themes are not immediately broken, but cannot supply the
initial server-delivered palette. Pendant 0.6.0 adopts that static catalog,
preserves all seven theme IDs and `pendant:auto`, and retains browser JavaScript
only for the existing command-logo decoration.

## Verification performed

- `npm ci --ignore-scripts`, `npm test`, `npm run verify:parser` passed.
- Tests check metadata, selection IDs, matching palette/structure files, asset
  inclusion, absence of runtime theme registration, supported selectors, logo
  layout source contracts, parser behavior, and 126 palette contrast checks.
- Started temporary, isolated web/API and daemon processes from the installed
  **1.202610.9** package with a copied Pendant plugin and separate data, config,
  ports, agent profile, and socket. No hosting services were restarted.
- The real host's `/api/themes` returned all seven qualified themes and the
  Auto pair without needing browser activation. `/api/theme` returned the dark
  palette plus structural CSS and revisioned asset URLs; Auto returned both
  dark and light stylesheets. Temporary processes were terminated afterwards.
- `npm pack --ignore-scripts`, the package-contract test inside the unpacked
  tarball, and an isolated `npm publish --dry-run --ignore-scripts` passed.

## Browser release gate

The real-browser harness passed on Chromium 156.0.8078.4 against the installed
1.202610.9 build, with the release checkout recording the matching host commit.
See [`review/release-0.6.0/results.json`](../review/release-0.6.0/results.json)
and the adjacent screenshots. All seven palettes, Auto light/dark switching,
stock-theme restoration, loaded prose fonts, visible status glyphs, fixed 15px
logos, keyboard focus, terminal echo, and tablet/mobile overflow checks passed.
The isolated logo lifecycle suite also passed with no browser errors.
Desktop and mobile chat captures were inspected.

The harness now warms the static catalog before testing a persisted selection
and opens General settings before iterating the full picker inventory, matching
the release's scoped startup catalog and lazy inventory behavior.

## Limits

This is Chromium coverage, not a cross-browser accessibility certification.
The logo adapter and remaining private CSS selectors are still experimental.
A local npm dry run does not verify publishing authorization; the tagged
GitHub workflow and public npm metadata are the publication evidence.
