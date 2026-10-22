# Pendant v5 visual review

## Migration checkpoint

`migration/` contains real Edge/Chromium screenshots from PI WEB upstream
`4c31ebc81` (see `migration/results.json` for the full revision), version
1.202610.6. The fixture uses an isolated daemon, API, temporary project and
synthetic saved session. It does not call a model or touch existing sessions.

This checkpoint deliberately retains the original broad visual overrides.
It migrates palettes and structural CSS to v5 theme stylesheet contributions,
removes browser prototype patches, and gives command-logo observers/timers a
start/dispose lifecycle. CSS selectors remain experimental host internals.

## Reproduce

1. Build PI WEB with CSS-first themes / `stylesheet-integration` v1.
2. `npm ci` in this repository.
3. Set `PI_WEB_SOURCE` to that built checkout (default:
   `../worktrees/pendant-v5-preview`).
4. Install Edge, or set `CHROME_BIN` to a Chromium executable.
5. `npm run test:visual -- migration` (use another output name for a new run).

The test driver uses private host methods only for deterministic theme/settings
selection. The shipped theme does not call those methods. Host refactors may
require updates to this driver and the private command-logo DOM adapter.

## Coverage

- Real app shell, navigation, saved transcript, thinking/event disclosure,
  successful/failed bash cards, branded command logos, Markdown table/code/link.
- Files tree and highlighted TypeScript preview; general settings dialog.
- All seven palettes at 1440×1000; chat/settings at 1024×768 and 390×844.
- Browser console/runtime and failed-resource checks, unchanged browser
  prototypes, exact 15×15px logo footprint, stock-theme cleanup and reactivation.
- Separate browser DOM fixture: command mutations, recycled non-bash cards,
  unmapped commands, late shadow roots, disconnect/reconnect, monochrome logos,
  theme switching and plugin disposal.
- Parser and package/source contracts: `npm test`; parser sync:
  `npm run verify:parser`.

The host's initial notification request for an unhosted saved session can return
404; that specific response is excluded from failed-resource checks. No other
HTTP failures or browser errors are accepted. Auto-installed bundled package
skills/extensions are excluded in the isolated agent profile so unrelated
skill-frontmatter warnings do not obscure the screenshots.

Not established by these checks: Firefox/Safari, real mobile hardware, remote
machines, live model streaming, third-party unregistered shadow roots or all
possible extension interfaces. The saved fixture displays unknown model/context
status because it is not running a model. Temporary logs are retained outside
the repository for diagnosis; test-owned child processes are stopped on exit.
