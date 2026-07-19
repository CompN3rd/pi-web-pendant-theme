# Plan: Command logos in PI WEB (Pendant-style)

Goal: when PI WEB renders a shell command box (e.g. `git push`, `uv sync`,
`pdm install`, `python -m pytest`), show that tool's logo inside the box —
the way the Pendant VS Code extension does.

---

## 0. Phase 0 spike — DONE (against the live PI WEB on localhost:8504)

The PI WEB frontend is a single SPA: `<pi-web-app>` + one Vite bundle
`/assets/index-Brfk1lwl.js` (≈639 KB). Inspecting it (and the PI WEB
plugin loader) confirmed everything below. (A headless-browser probe was
attempted but Edge's CDP pipe handshake is incompatible with the installed
Playwright 1.61 — not worth disturbing the running session for, since the
bundle source is authoritative.)

### 0.1 Plugin contribution surface — NO render hook

PI WEB calls each plugin's `activate({apiVersion:1, pluginId, html, svg})`
and reads exactly these contribution points:
`actions`, `workspacePanels`, `workspaceLabels`, `themes`, `themePairs`.
There is **no** `messageRender` / `partRender` / `toolCallRender` hook.
→ DOM observation is the only way to add command logos. (The `html`/`svg`
Lit tags are passed in, but with no contribution point to slot a template
into the message stream, they don't help here.)

### 0.2 Bash tool-card DOM (verified against production localhost:8504)

A bash execution renders inside a `<tool-execution-view>` custom element.
That custom element has its own **shadow root** containing:

```html
<section class="tool-card success">
  <div class="tool-header">
    <div class="tool-title">
      <span class="status-icon">✓</span>
      <strong>bash</strong>
      <span class="summary">cd "C:/repo" && git status</span>
    </div>
    <div class="tool-meta">…</div>
  </div>
  <details class="text-body">
    <div class="detail-target">
      <span class="detail-label">Command</span>
      <pre>cd "C:/repo" && git status</pre>
    </div>
    …
  </details>
</section>
```

Key facts:
- In the production PI WEB DOM, tool calls render as
  `<tool-execution-view>` custom elements. Each one has a shadow root with
  `section.tool-card > .tool-header > .tool-title`.
- Bash executions are identified by `.tool-title strong` containing `bash`.
- The complete command is available in the Details block:
  `.detail-target pre` under the `Command` detail. While a tool is still
  streaming, only `.tool-title .summary` may exist; it is a fallback only.
- The title's `<strong>` text is Lit-managed. Do **not** mutate it with
  `textContent = ...`; hide it with a CSS class and insert logo/name sibling
  nodes instead.
- Stable production selectors: `section.tool-card`, `.tool-title`,
  `.tool-title strong`, `.tool-title .summary`, `.detail-target pre`.

### 0.3 Re-render survivability

Lit may re-render tool cards as running executions complete and event groups
expand/collapse. Injected logo nodes can be wiped or cards can be reused.
Design implication: the observer must re-process idempotently on every
mutation. Tag the **command string** and active theme on the injected logo so
we can skip work when nothing changed, but never mutate Lit-managed text.

### 0.4 Shadow-root reachability — already solved by this plugin

The `tool-execution-view` cards live in Lit shadow roots. The existing plugin
already wraps `Element.prototype.attachShadow` and walks all existing shadow
roots (`adoptIntoExistingShadowRoots`), so the same machinery can install a
per-shadow-root `MutationObserver` that watches for `section.tool-card` nodes
being added/changed. No new discovery machinery needed.

### 0.5 Confirmed selectors & extraction algorithm

```
for each shadow root (and document):
  for each card matching 'section.tool-card':
    title  = card.querySelector('.tool-header .tool-title')
    strong = title?.querySelector('strong')
    if strong?.textContent.trim().toLowerCase() !== 'bash': restore/skip
    cmd   = card.querySelector('.detail-target pre')?.textContent
            ?? title.querySelector('.summary')?.textContent
            ?? ''
    token = firstCommandToken(cmd)  // strips one leading cd <dir> && prefix
    slug  = commandToSlug[token]
    inject <span class="pendant-cmd-logo" data-slug=slug>…svg…</span>
      before <strong>; for brand logos, also hide <strong> and insert the
      brand display name as a sibling span.
```

---

## 1. What Pendant actually does (reverse-engineered)

Pendant's source is closed, but it ships as a VSIX (just a zip). Inspecting
the bundled `dist/chunks/chunk-4N377NVA.js` reveals the full mechanism:

### 1.1 Two parallel command maps

* `Y_` — **command → display label** (e.g. `'python3':'python'`,
  `'chocolatey':'Chocolatey'`, `'cmake':'CMake'`). Pretty label shown beside
  the icon.
* `J_` — **command → icon slug** (e.g. `'git':'git'`, `'python3':'python'`,
  `'uv':'uv'`, `'pdm':…`, `'pip3':'pypi'`, `'cargo':'rust'`,
  `'tsx':'typescript'`, `'dpkg':'debian'`, `'yum':'redhat'`). ~250 entries
  covering git, shells, package managers, build tools, languages, test
  runners, linters, bundlers, container/k8s, IaC, clouds, DBs, CI.

When no brand icon fits, the slug is a generic glyph: `symbol:search`,
`symbol:hammer`, `symbol:terminal`, `symbol:file`, `symbol:hash`,
`symbol:listEnd`, `symbol:arrowDownUp`, `symbol:fileCode`,
`symbol:gitCompare`.

### 1.2 Command detection (`El` + `g41`)

```
El(commandStr, cwd, mode='friendly'):
  f = g41(commandStr, cwd)          # see below
  firstToken = f.slice(0, f.indexOf(' ')) or f
  slug  = J_[firstToken]            # icon slug
  label = Y_[firstToken]            # pretty label
  args  = f.slice(after first token), truncated to 0x45 chars + '...'
  return { label, args, icon: slug }
```

`g41(command, cwd)` only does **one** preprocessing step: if the command
starts with `cd <dir> && …` (or `cd <dir>; …` / newline-separated) **and**
`<dir>` resolves to the current working directory, it strips the
`cd <dir> && ` prefix and returns the rest. Otherwise it returns the
command unchanged.

Notable consequences:
* The lookup key is the **first whitespace-delimited token** of the
  (cd-stripped) command.
* `sudo git …`, `env FOO=bar git …`, `/usr/bin/git …`, `git.exe …` all
  **fail** to match — Pendant does not strip these. First-token match only.
* `cd ~/repo && git status` **does** resolve (when cwd == ~/repo) and
  shows the git logo.

### 1.3 The icon dataset

A dictionary of 122 brand icons keyed by slug, each entry shaped like
Simple Icons:

```js
{
  title: 'PDM',                 // obfuscated in bundle
  slug:  'pdm',                 // plaintext
  get svg() { return K + 'PDM' + X + this.path + Y; }, // <svg><title>PDM</title><path d="…"/></svg>
  path:  'M…Z',                 // obfuscated
  source:'https://github.com/pdm-project/pdm/…',
  hex:   '02A8EF',              // brand color, plaintext
  guidelines: '…'              // optional
}
```

Slugs present (122): `1password, apachecassandra, apachemaven, ansible,
argo, archlinux, astro, avajs, bazel, biome, bitbucket, black, bun, cmake,
cloudflare, cloudflareworkers, chocolatey, clickhouse, cockroachlabs,
cocoapods, cypress, dart, databricks, datadog, debian, deno, digitalocean,
docker, dotenv, dotnet, duckdb, elixir, elasticsearch, eslint, esbuild,
fastlane, fedora, firebase, fishshell, flux, flydotio, git, github,
githubactions, gitlab, gitlfs, go, gnubash, googlebigquery, googlecloud,
gnuprivacyguard, gradle, helm, homebrew, influxdb, jest, just, kotlin,
kubernetes, lerna, make, mariadb, mercurial, mocha, mongodb, mysql,
netlify, nextdotjs, nixos, nodedotjs, neo4j, newrelic, npm, nuget, nvm, nx,
openssl, openjdk, opentofu, packer, pdm, php, pnpm, poetry, prettier,
pulumi, pypi, pytest, python, prometheus, railway, redhat, redis,
rollupdotjs, ruff, ruby, rust, scala, storybook, supabase, svelte, swift,
snyk, snowflake, splunk, subversion, task, terraform, trivy, turborepo,
typescript, uv, vault, vercel, vite, vitepress, vitest, webpack, yarn,
yandexcloud, zig, zsh`.

The slug naming (`nodedotjs`, `rollupdotjs`, `gnubash`, `fishshell`,
`googlebigquery`…) is **Simple Icons**' slug convention. The bundled
`media/licenses/MATERIAL_ICON_THEME_LICENSE.txt` (MIT) covers a separate
file/folder-icon feature, not these brand marks.

### 1.4 The user's requested commands — all covered

| Command            | Icon slug   | In 122-icon set |
|--------------------|-------------|:---------------:|
| `git`              | `git`       | ✅ |
| `python` / `python3` | `python`  | ✅ |
| `uv` / `uvx`       | `uv`        | ✅ |
| `pdm`              | `pdm`       | ✅ |
| (bonus, same family) `poetry` | `poetry` | ✅ |
| `pip` / `pip3` / `pipx` | `pypi` / `pipx` | ✅ |
| `ruff`, `pytest`, `black` | own slugs | ✅ |

---

## 2. Feasibility in THIS plugin

### 2.1 What the plugin can and cannot do today

`pi-web-plugin.js` is a **browser-side CSS/theme plugin**. Its only
documented contribution surface is `contributions.themes` (+ `themePairs`).
It has:

* ✅ Full DOM access (it already wraps `Element.prototype.attachShadow`,
  walks all shadow roots, and runs a `MutationObserver` on
  `document.documentElement`).
* ✅ Ability to inject stylesheets into every shadow root.
* ❌ No documented React/component override API.
* ❌ No access to tool-call payloads / session JSON — it only sees what's
  already rendered in the DOM.

**Conclusion: feasible, but via DOM scraping + DOM injection, not via a
first-class plugin hook.** We observe the rendered command boxes, read the
command text out of the DOM, look up the slug, and inject an inline-SVG
logo. This is more fragile than Pendant's in-component rendering, but it's
the only path with the current API, and it's consistent with how the
plugin already operates (the existing `adoptedStyleSheets` setter trap and
`attachShadow` wrap are the same kind of runtime patching).

### 2.2 The main unknown / risk

PI WEB's command-box DOM structure: selectors, class names (Lit often
hashes them), and exactly which text node holds the command string. This
must be inspected on a live PI WEB tab (DevTools) before writing selectors.
Mitigation if classes are hashed: match on **structure + text content**
(e.g. "element containing a `$ ` or command-like string inside a
`<pre>`/mono-spaced block within a tool-call card") rather than class
names, and key the logo off the first token of that text.

---

## 3. Implementation plan

### Phase 0 — Spike (must do first)
1. Run PI WEB with the Pendant theme active, trigger a bash tool call
   (e.g. `git status`), and DevTools-inspect the rendered command box.
2. Record: the host element selector, where the command string lives
   (text node / attribute / `<code>` child), and whether the box is in
   light or shadow DOM. Save a snippet to `docs/command-box-dom.md`.
3. Decide the injection point: prepend an `<span class="pendant-cmd-logo">`
   inside the box's header/label area.

### Phase 1 — Minimal viable logos
1. Add `logos/` dir with **inline SVG strings** for the requested set,
   sourced from Simple Icons (CC0 — attribution-free). Start with:
   `git, python, uv, pdm, poetry, pypi, pytest, ruff, black, node,
   npm, pnpm, yarn, cargo, rust, go, docker, make`.
   Each stored as `{ slug, svg, hex }` (svg path only; we wrap at render
   time so we can recolor).
2. Add a `commandToSlug` map in `pi-web-plugin.js` (write our own — the
   command→slug association is factual; do not copy Pendant's obfuscated
   bundle). Mirror Pendant's first-token semantics + the
   `cd <cwd> && ` strip.
3. Add a `MutationObserver` (shadow-root aware, reusing the existing
   shadow-root walking helpers) that:
   * finds new command-box elements,
   * reads the command string,
   * computes `{ label, slug }`,
   * injects an inline `<svg>` logo (colored with the brand `hex`, or
     `currentColor` for monochrome themes) + optional pretty label.
4. Gate the feature behind the Pendant theme (only active when
  `data-pi-web-theme` starts with `pendant:`), so stock themes are
  unaffected — same toggle pattern as `pixelSheet`.

### Phase 2 — Parity with Pendant
1. Expand `commandToSlug` to the full ~250-entry set.
2. Bundle all 122 Simple Icons SVGs (or lazy-load by slug from a JSON
   manifest to keep the plugin small).
3. Add the `symbol:*` generic fallbacks for commands with no brand
   (rendered as small monochrome glyphs).
4. Pretty-label map (`Y_` equivalent) for the kicker text.

### Phase 3 — Polish
1. Recolor logic per theme: brand `hex` on colored themes; `currentColor`
   on `Nearly Monochrome` / `Muted Everything` so logos stay on-palette.
2. Pixel-render treatment (`image-rendering: pixelated` is wrong for
   vector SVGs — instead snap SVGs to a 16×16 grid / use the Press Start
   aesthetic only for the label kicker, keep logos crisp vector).
3. Caching: parse each command box once, tag with `data-pendant-logoed`
   to avoid re-processing on unrelated mutations.
4. Tests: a small Node harness that feeds command strings through the
   `El`/`g41`-equivalent and asserts `{label, slug}` — pure logic, no
   DOM needed.

### Phase 4 — Legal
* Simple Icons are CC0 (public domain dedication) — safe to bundle.
* Keep the existing OFL font attributions; add a short note in README
  that brand logos are from Simple Icons (CC0) and are trademarks of
  their owners, used for tool identification.

---

## 4. Open questions — resolved by the spike
* ✅ **Verbatim command string?** Yes — bash cards expose the full command in
  the `Command` detail (`.detail-target pre`). First-token matching works.
* ✅ **Light DOM or shadow root?** Shadow root (Lit). The plugin's existing
  `attachShadow` wrap + shadow-root walk already cover it.
* ✅ **Stable selectors?** Yes — production tool cards expose stable literal
  classes (`section.tool-card`, `.tool-title`, `.detail-target`).
* ✅ **Known-brand only?** No — use the full manifest including `symbol:*`
  generic fallbacks, so common unbranded commands still get quiet glyphs while
  unknown commands simply keep the standard bash title.
* ✅ **Streaming re-render:** handled by idempotent MutationObserver sweeps;
  the plugin inserts sibling nodes and hides Lit-managed `<strong>` text rather
  than mutating that text directly.

---

## 5. TL;DR
* Pendant maps the **first token** of a command (after stripping a
  leading `cd $CWD &&`) to a **Simple Icons slug**, then renders that
  brand SVG + a pretty label. ~250 commands, 122 brand icons.
* `git`, `python`, `uv`, `pdm` (and the whole Python tooling family)
  are all supported by Pendant's own set.
* In this plugin it's **doable** by reusing the existing DOM/shadow-root
  observation machinery to scrape rendered command boxes and inject
  inline SVGs — no new plugin API needed. The one prerequisite is a
  DevTools spike on a live PI WEB tab to learn the command-box DOM.
