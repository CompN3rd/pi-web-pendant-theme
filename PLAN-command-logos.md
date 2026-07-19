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

### 0.2 Bash command-box DOM (verified from `renderPart`/`renderMessageHeader`)

A bash execution renders, inside the chat component's **shadow root**, as:

```html
<div class="msg bash">                     <!-- the box; success-colored border/bg -->
  <div class="msg-header">                  <!-- sticky header (top: -26px, z-index:4) -->
    <b class="label">bash</b>               <!-- role label -->
    <div class="msg-header-trailing">…actions…<span class="msg-meta">…</span></div>
  </div>
  <pre class="part shell-output">$ git status\n\n<output text…></pre>
</div>
```

Key facts (from the data model + `renderPart`):
- `renderPart`: `e.type==='text' && t?.role==='bash'` →
  `<pre class="part shell-output">${e.text}</pre>`.
- The `pre`'s text is built as `$ ${command}` then `\n\n` then output
  (`function vo(e,t){…Pa('bash', `${…}$ ${e}`)…}`).
- Variant: when excluded-from-context, text becomes
  `excluded from context\n\n$ ${command}` — so the command line is **not
  always line 0**. Robust extraction: split on `\n`, find the first line
  matching `/^\$\s+(.*)/`, take group 1 as the command string.
- The `.msg-header` is **sticky** — a logo injected there stays visible
  while scrolling through long output. Ideal Pendant-style placement.
- CSS classes are **stable literals** (`.msg`, `.msg.bash`, `.msg-header`,
`.part.shell-output`, `.label`), not Lit-hashed. Safe to key off.

### 0.3 Re-render survivability

Lit re-runs `renderPart` / `renderMessageHeader` on stream updates and
replaces the `.msg-header` and `<pre>` nodes. So an injected logo gets
wiped on each re-render. Design implication: the observer must re-process
idempotently on every mutation (don't trust a `data-pendant-logoed` flag
across re-renders; re-check and re-inject). Tag the **command string** we
matched (e.g. `data-pendant-cmd="git status"`) so we can skip work when
nothing changed, but always verify the logo node is still present.

### 0.4 Shadow-root reachability — already solved by this plugin

The chat `.msg.bash` nodes live in a Lit shadow root. The existing plugin
already wraps `Element.prototype.attachShadow` and walks all existing
shadow roots (`adoptIntoExistingShadowRoots`), so we have a hook point to
install a per-shadow-root `MutationObserver` watching for `.msg.bash`
nodes being added/changed. No new discovery machinery needed.

### 0.5 Confirmed selectors & extraction algorithm

```
for each shadow root (and document):
  for each el matching '.msg.bash':
    pre  = el.querySelector('.part.shell-output')
    text = pre?.textContent ?? ''
    cmd  = first line of text matching /^\$\s+(.*)/  →  group(1)
    if !cmd: skip (not a command box, e.g. pure output)
    token = first whitespace-delimited token of cmd   (Pendant's rule)
    slug  = commandToSlug[token]
    header = el.querySelector('.msg-header')
    inject <span class="pendant-cmd-logo" data-slug=slug>…svg…</span>
      as header's first child (before <b class="label">)
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
* ✅ **Verbatim command string?** Yes — `<pre class="part shell-output">`
  text starts with `$ <command>` verbatim (only `\n`-joining, no
  escaping). First-token matching works.
* ✅ **Light DOM or shadow root?** Shadow root (Lit). The plugin's existing
  `attachShadow` wrap + shadow-root walk already cover it.
* ✅ **Stable selectors?** Yes — class literals `.msg.bash`, `.msg-header`,
  `.part.shell-output`, `.label` are not hashed. No `data-*` attrs exist,
  but class-based selection is safe here.
* ⚠️ **Still open (design decision, not blocking):** should logos appear for
  *every* `.msg.bash`, or only for ones whose first token maps to a known
  brand? Recommendation: inject only on known-brand match (cleaner, avoids
  noise on `cat`/`echo`/arbitrary commands); unknown commands simply get
  no logo. The `symbol:*` generic fallbacks from Pendant are optional in a
  theme plugin and can be skipped to keep the look clean.
* ⚠️ **Streaming re-render:** Lit replaces `.msg-header` on updates, wiping
  the logo. Mitigation already designed in §0.3 — re-inject idempotently.

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
