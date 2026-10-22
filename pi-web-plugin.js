// PI WEB plugin: Pendant 8-bit theme.
//
// Contributes CSS-first themes (original palette taken from pendant.run)
// plus a host-managed structural stylesheet that mirrors Pendant's
// look: Source Sans 3 body font, Source Code Pro for code, Press Start 2P only
// as a tiny arcade accent on section headers (Pendant reserves it for the logo
// and kicker labels), sharp corners, flat surfaces, subtle 32px pixel grid.
//
// PI WEB adopts the selected theme's CSS into participating roots and removes
// it on theme changes. Only command-logo decoration uses a private DOM adapter.

// --- Inline command parser (extracted from lib/parse-command.js) ------------
// Kept in-sync with the test-only library copy; duplicated here so the plugin
// has zero runtime imports (no secondary file to serve/resolve).

function skipWhitespace(s, i) {
  while (i < s.length && /\s/.test(s[i])) i++;
  return i;
}
function skipHorizontalWhitespace(s, i) {
  while (i < s.length && /[ \t]/.test(s[i])) i++;
  return i;
}
function separatorLength(s, i) {
  if (s.slice(i, i + 2) === "&&") return 2;
  if (s[i] === ";" || s[i] === "\n" || s[i] === "|") return 1;
  if (s[i] === "\r") return s[i + 1] === "\n" ? 2 : 1;
  return 0;
}
function readShellWord(s, i) {
  const start = i;
  while (i < s.length && !/[\s&;|]/.test(s[i])) {
    if (s[i] === "\\") { i += i + 1 < s.length ? 2 : 1; }
    else if (s[i] === "\"" || s[i] === "'") {
      const quote = s[i++];
      while (i < s.length && s[i] !== quote) { i += s[i] === "\\" && i + 1 < s.length ? 2 : 1; }
      if (i < s.length) i++;
    } else { i++; }
  }
  return { word: s.slice(start, i), end: i };
}
function skipOneCdPrefix(s, i) {
  const start = i;
  const command = readShellWord(s, i);
  if (command.word.toLowerCase() !== "cd") return start;
  i = skipWhitespace(s, command.end);
  while (s[i] === "-") { i = skipWhitespace(s, readShellWord(s, i).end); }
  if (separatorLength(s, i) === 0 && i < s.length) { i = readShellWord(s, i).end; }
  i = skipHorizontalWhitespace(s, i);
  const sepLen = separatorLength(s, i);
  return sepLen === 0 ? start : skipWhitespace(s, i + sepLen);
}
function isAssignmentWord(word) {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(word);
}
function skipLeadingAssignments(s, i) {
  while (i < s.length) {
    const { word, end } = readShellWord(s, i);
    if (!word || !isAssignmentWord(word)) return i;
    i = skipHorizontalWhitespace(s, end);
    const sepLen = separatorLength(s, i);
    if (sepLen > 0) i = skipWhitespace(s, i + sepLen);
    else i = skipWhitespace(s, i);
  }
  return i;
}
function firstCommandToken(s) {
  if (!s) return "";
  let i = skipWhitespace(s, 0);
  i = skipLeadingAssignments(s, i);
  i = skipOneCdPrefix(s, i);
  i = skipLeadingAssignments(s, i);
  return readShellWord(s, i).word;
}

// ----------------------------------------------------------------------------

const PLUGIN_ID = "pendant";
const THEME_ATTR = "data-pi-web-theme";
// Resolve browser assets from the loaded module rather than the application
// root. This survives reverse-proxy base paths and machine-scoped plugin URLs.
const MANIFEST_URL = new URL("./logos/manifest.json", import.meta.url).href;

// Theme files are owned, adopted and removed by PI WEB.
function themeStyles(id) {
  return [
    { id: "palette", url: new URL(`./styles/${id}.css`, import.meta.url).href, order: 1000 },
    { id: "structure", url: new URL("./styles/pendant.css", import.meta.url).href, order: 1010 },
  ];
}

// --- Command logos ----------------------------------------------------------
// When a Pendant theme is active, decorate bash tool cards with a brand logo.
// PI WEB renders every tool call as a <tool-execution-view> whose shadow root
// contains:
//
//   section.tool-card > div.tool-header > div.tool-title >
//     span.status-icon + <strong>bash</strong> + span.summary (command)
//
// plus a Details block holding the full command (div.detail-target > pre).
// The first command token (after one `cd <dir> &&` prefix) is matched to a
// Simple Icons slug via logos/manifest.json. Brand matches hide the "bash"
// <strong> (CSS class only — Lit-managed text is never mutated, since Lit
// keeps part markers inside it) and insert logo + brand name as sibling
// nodes; symbol matches insert just a glyph. Fully gated behind the theme
// toggle: switching away strips everything and unhides the tool name.

const LOGO_CLASS = "pendant-cmd-logo";
const NAME_CLASS = "pendant-cmd-name";
const HIDDEN_CLASS = "pendant-cmd-hidden";

let manifestPromise = null;
let manifest = null;       // { commandToSlug, brands, symbols }
const observedRoots = new Map();
let logoSweepScheduled = false;
let manifestFailed = false;

function loadManifest() {
  if (manifestFailed) return Promise.resolve(null);
  if (manifestPromise) return manifestPromise;
  // Default HTTP caching (NOT force-cache): force-cache would pin the first
  // cached copy forever, so manifest updates shipped in new package versions
  // would never reach returning users. Per-page-load memoization is already
  // handled by manifestPromise above.
  manifestPromise = fetch(MANIFEST_URL)
    .then((r) => { if (!r.ok) throw new Error(`manifest HTTP ${r.status}`); return r.json(); })
    .then((m) => { manifest = m; return m; })
    .catch((e) => {
      console.warn(`[pendant] command-logo manifest failed: ${e.message}`);
      manifestPromise = null;
      manifestFailed = true;
      return null;
    });
  return manifestPromise;
}

function activeThemeId() {
  const v = document.documentElement.getAttribute(THEME_ATTR) ?? "";
  return v.startsWith(`${PLUGIN_ID}:`) ? v.slice(PLUGIN_ID.length + 1) : null;
}

// Only the canonical Pendant Dark/Light themes render logos in full brand
// color; every experiment theme (Amber, Green, Cyan, Mono, Muted) desaturates
// logos to --pi-text-secondary so they stay on-palette. The "auto" pair
// resolves to dark or light (both brand-color), so treat it as brand-color too
// — this is correct whether PI WEB stores the resolved id or the pair id.
function usesDesaturatedLogos(themeId) {
  return themeId !== "dark" && themeId !== "light" && themeId !== "auto";
}

function logoColorFor(slug, themeId) {
  if (slug.startsWith("symbol:") || usesDesaturatedLogos(themeId)) {
    return "var(--pi-text-secondary)";
  }
  const b = manifest?.brands?.[slug];
  return b?.hex ? `#${b.hex}` : "var(--pi-text-secondary)";
}

function labelFor(slug) {
  if (slug.startsWith("symbol:")) return null; // keep the `bash` label for generic glyphs
  return manifest?.brands?.[slug]?.title ?? null;
}

function buildLogoSvg(slug, themeId) {
  const isSym = slug.startsWith("symbol:");
  const path = isSym
    ? manifest?.symbols?.[slug.slice(7)]
    : manifest?.brands?.[slug]?.path;
  if (!path) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // All Simple Icons paths are pre-normalized to a 24x24 box (larger dimension
  // spans 24, centered), so a fixed viewBox renders every icon as intended.
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-hidden", "true");
  svg.style.color = logoColorFor(slug, themeId);
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  p.setAttribute("fill", "currentColor");
  svg.appendChild(p);
  return svg;
}

// Full command from the card's Details block; while the call is still
// streaming only the (possibly truncated) title summary exists.
function commandOfCard(card) {
  const pre = card.querySelector(".detail-target pre");
  if (pre?.textContent) return pre.textContent;
  return card.querySelector(".tool-title .summary")?.textContent ?? "";
}

function restoreToolCard(title, strong) {
  for (const el of title.querySelectorAll(`.${LOGO_CLASS}, .${NAME_CLASS}`)) el.remove();
  strong.classList.remove(HIDDEN_CLASS);
}

function processToolCard(card, themeId) {
  const title = card.querySelector(".tool-header .tool-title");
  const strong = title?.querySelector("strong");
  if (!strong) return;
  const existing = title.querySelector(`.${LOGO_CLASS}`);
  // strong's text is never mutated, so it always holds the real tool name —
  // including after Lit recycles this card for a different tool.
  if (strong.textContent.trim().toLowerCase() !== "bash") {
    if (existing) restoreToolCard(title, strong);
    return;
  }
  const cmd = commandOfCard(card);
  if (existing && existing.dataset.cmd === cmd && existing.dataset.theme === themeId) return;

  const token = firstCommandToken(cmd);
  const slug = (token && manifest.commandToSlug?.[token]) || null;
  if (existing || !slug) restoreToolCard(title, strong);
  if (!slug) return;
  const svg = buildLogoSvg(slug, themeId);
  if (!svg) return;
  const wrap = document.createElement("span");
  wrap.className = LOGO_CLASS;
  wrap.dataset.cmd = cmd;
  wrap.dataset.slug = slug;
  wrap.dataset.theme = themeId;
  wrap.appendChild(svg);
  const pretty = labelFor(slug);
  if (pretty) {
    const name = document.createElement("span");
    name.className = NAME_CLASS;
    name.textContent = pretty;
    strong.classList.add(HIDDEN_CLASS);
    strong.before(wrap, name);
  } else {
    // Symbol glyphs keep the "bash" tool name visible.
    strong.before(wrap);
  }
}

function stripRoot(root) {
  for (const el of root.querySelectorAll(`.${LOGO_CLASS}, .${NAME_CLASS}`)) el.remove();
  for (const el of root.querySelectorAll(`.${HIDDEN_CLASS}`)) el.classList.remove(HIDDEN_CLASS);
}

function sweepRoot(root) {
  if (root !== document && !root.isConnected) {
    observedRoots.get(root)?.disconnect();
    stripRoot(root);
    observedRoots.delete(root);
    return;
  }
  const themeId = activeThemeId();
  if (!themeId) {
    stripRoot(root);
    return;
  }
  if (!manifest) {
    if (!manifestFailed) {
      loadManifest().then(() => scheduleSweep());
    }
    return;
  }
  for (const card of root.querySelectorAll("section.tool-card")) processToolCard(card, themeId);
}

function scheduleSweep() {
  if (!running || logoSweepScheduled) return;
  logoSweepScheduled = true;
  // setTimeout (not queueMicrotask): breaks synchronous microtask recursion in
  // some environments (e.g. jsdom) where mutation callbacks drain inline, and
  // the ~task-gap is imperceptible for UI in real browsers.
  sweepTimer = setTimeout(() => {
    logoSweepScheduled = false;
    for (const r of observedRoots.keys()) sweepRoot(r);
  }, 0);
}

// Tool-title decoration has no public contribution API yet. Keep the DOM
// adapter separate from styling. Discover open roots only while Pendant is
// selected; never patch browser prototypes or retain detached components.
let discoveryTimer;
let themeObserver;
let sweepTimer;
let running = false;

function discoverRoots(root = document) {
  if (!observedRoots.has(root)) {
    const observer = new MutationObserver(scheduleSweep);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    observedRoots.set(root, observer);
  }
  for (const element of root.querySelectorAll("*")) {
    if (element.shadowRoot) discoverRoots(element.shadowRoot);
  }
}

function releaseRoots() {
  for (const [root, observer] of observedRoots) {
    observer.disconnect();
    stripRoot(root);
  }
  observedRoots.clear();
}

function refreshRoots() {
  if (!running || !activeThemeId()) return;
  for (const [root, observer] of observedRoots) {
    if (root !== document && !root.isConnected) {
      observer.disconnect();
      stripRoot(root);
      observedRoots.delete(root);
    }
  }
  discoverRoots();
  scheduleSweep();
}

function syncLogos() {
  clearInterval(discoveryTimer);
  clearTimeout(sweepTimer);
  logoSweepScheduled = false;
  if (!activeThemeId()) {
    releaseRoots();
    return;
  }
  manifestFailed = false;
  refreshRoots();
  // Roots attached to an existing host produce no outer-tree mutation.
  // Periodic discovery covers those without changing attachShadow globally.
  discoveryTimer = setInterval(refreshRoots, 750);
}

function startLogos() {
  running = true;
  themeObserver = new MutationObserver(syncLogos);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTR] });
  syncLogos();
}

function disposeLogos() {
  running = false;
  themeObserver?.disconnect();
  clearInterval(discoveryTimer);
  clearTimeout(sweepTimer);
  logoSweepScheduled = false;
  releaseRoots();
}

// --- Plugin export ------------------------------------------------------------

export default {
  apiVersion: 5,
  name: "Pendant Theme",
  requires: [{ pluginId: "pi-web", id: "stylesheet-integration", version: 1, parse: (value) => value }],
  activate: () => {
    return {
      start: startLogos,
      dispose: disposeLogos,
      contributions: {
        themes: [
          {
            id: "dark",
            name: "Pendant Dark",
            description: "8-bit Pendant look: pixel fonts, sharp boxes, flat dark surfaces.",
            order: 40,
            colorScheme: "dark",
            stylesheets: themeStyles("dark"),
          },
          // Experiment series --------------------------------------------------
          {
            id: "amber",
            name: "Amber CRT",
            description: "Pitch black bg, warm amber glow — like an old monochrome terminal.",
            order: 44,
            colorScheme: "dark",
            stylesheets: themeStyles("amber"),
          },
          {
            id: "green",
            name: "Green Phosphor",
            description: "Deep black bg, classic matrix green — retro green-screen.",
            order: 45,
            colorScheme: "dark",
            stylesheets: themeStyles("green"),
          },
          {
            id: "cyan",
            name: "Cyan/Teal",
            description: "Near-black bg, cool cyan accents — modern-retro hybrid.",
            order: 46,
            colorScheme: "dark",
            stylesheets: themeStyles("cyan"),
          },
          {
            id: "mono",
            name: "Nearly Monochrome",
            description: "Pure grayscale — every accent is just a different shade of gray.",
            order: 47,
            colorScheme: "dark",
            stylesheets: themeStyles("mono"),
          },
          {
            id: "muted",
            name: "Muted Everything",
            description: "Desaturated hints, barely-there color — 5–10% saturation.",
            order: 48,
            colorScheme: "dark",
            stylesheets: themeStyles("muted"),
          },
          {
            id: "light",
            name: "Pendant Light",
            description: "8-bit Pendant look: pixel fonts, sharp boxes, flat light surfaces.",
            order: 50,
            colorScheme: "light",
            stylesheets: themeStyles("light"),
          },
        ],
        themePairs: [
          {
            id: "auto",
            name: "Pendant",
            description: "Follow the system light/dark preference with Pendant themes.",
            order: 20,
            light: "light",
            dark: "dark",
          },
        ],
      },
    };
  },
};
