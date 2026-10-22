# Pendant v5 visual review

## Compare the two checkpoints

Open **[the comparison gallery](./index.html)** in a browser. It contains 19
matched views (38 source PNGs) with full-resolution links. Static previews:

- [Desktop conversation](./compare-desktop-chat.png)
- [Tool cards](./compare-desktop-tools.png)
- [Settings](./compare-settings.png)
- [Mobile conversation](./compare-mobile-chat.png)
- [All refined palettes](./refined-palettes.png)

| Migration (`91e0652`) | Refinement (`b43ef01`) |
| --- | --- |
| Existing 340px desktop navigation / 42vw workspace | 280px navigation / 32vw workspace; more room for chat |
| Blanket font overrides and pixel Markdown headings | Semantic fonts; 16px prose, normal reading headings, pixel UI section labels |
| Strong tool backgrounds; brand logo replaces status glyph | Quieter activity surfaces; brand logo plus status glyph and status text |
| Broad shadow/radius/image resets | Targeted square controls/dialogs/code; natural images; host-owned terminal metrics |
| Existing muted and syntax colours | Brighter muted text and dedicated syntax properties |

The refined desktop gives the conversation approximately 698px instead of
494px at 1440px viewport width. Tablet/mobile retain the host's responsive
layout rather than forcing desktop panel dimensions onto smaller screens.

The final comparison recaptures **migration source from commit `91e0652`** with
the expanded test driver, so both columns show the same two-session fixture,
terminal and keyboard-focus views. The migration commit also retains its
original captures. Temporary paths and session ordering may vary; screenshots
are unmodified apart from scaling them in the comparison page.

## Migration checkpoint

`migration/` contains real Edge/Chromium screenshots from PI WEB upstream
`4c31ebc8` (see `migration/results.json` for the full revision), version
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
5. `npm run test:visual -- refinement --profile refinement`. Both output directory
   and expected profile are required. Use another directory for a new run, or
   an absolute temporary path to leave the gallery untouched. Relative paths
   resolve under `review/`; existing captures in the chosen directory are replaced.
6. To regenerate the baseline with the same driver, check out `91e0652` in a
   separate worktree, set `PI_PENDANT_SOURCE` to it, and run
   `npm run test:visual -- migration --profile migration`.
7. `npm run review:render` verifies the 19 image pairs and rebuilds comparison
   PNGs from the source captures. `review/index.html` also works via `file://`.

The test driver uses private host methods only for deterministic theme/settings
selection. The shipped theme does not call those methods. Host refactors may
require updates to this driver and the private command-logo DOM adapter.

## Verification results

Both stages passed the final real-host browser run on Edge/Chromium
155.0.4283.62 with no unexpected HTTP failures or browser errors. See each
stage's `results.json` for the checks, host revision and browser version.
`pluginHash` fingerprints the entry module plus shared structural CSS (not the
entire package). `npm test`, parser synchronization, package dry-run and image
pair verification passed. The images were also visually inspected, including
the palette contact sheet, desktop tools/settings/Files/Terminal and mobile
chat/settings.

## Coverage

- Real app shell, navigation, saved transcript, thinking/event disclosure,
  successful/failed bash cards, branded command logos, Markdown table/code/link.
- Files tree and highlighted TypeScript preview; general settings dialog;
  second saved session; real terminal with a harmless echo command.
- All seven palettes at 1440×1000; chat/settings at 1024×768 and 390×844.
- Browser console/runtime and failed-resource checks, unchanged browser
  prototypes, exact 15×15px logo footprint, stock-theme cleanup and reactivation,
  auto light/dark pair, keyboard focus, loaded prose font and visible status
  glyphs. Refined settings dialog verified square in computed styles.
- Separate browser DOM fixture: command mutations, recycled non-bash cards,
  unmapped commands, late shadow roots, disconnect/reconnect, monochrome logos,
  theme switching and plugin disposal.
- 126 text/syntax palette contrast assertions (at least 4.5:1 against base and
  surface colours). These are bounded checks, **not a whole-app WCAG audit**;
  translucent backgrounds, disabled controls and decorative dim text are not
  included.
- 44 parser cases and package/source contracts: `npm test`; parser sync:
  `npm run verify:parser`.

The host's initial notification request for an unhosted saved session can return
404; that specific response is excluded from failed-resource checks. No other
HTTP failures or browser errors are accepted. Transport failures are recorded
through Playwright's `requestfailed` event, including aborted requests; there
are currently no cancellation exclusions. The expected profile selects the
assertions independently of the observed theme CSS. Auto-installed bundled package
skills/extensions are excluded in the isolated agent profile so unrelated
skill-frontmatter warnings do not obscure the screenshots.

Not established by these checks: Firefox/Safari, real mobile hardware, remote
machines, live model streaming, third-party unregistered shadow roots or all
possible extension interfaces. The saved fixture displays unknown model/context
status because it is not running a model. Temporary logs are retained outside
the repository for diagnosis; test-owned child processes are stopped on exit.
