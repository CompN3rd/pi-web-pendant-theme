// PI WEB plugin: Pendant 8-bit theme.
//
// Contributes "Pendant Dark" / "Pendant Light" color themes (palette taken from
// pendant.run) plus an injected structural stylesheet that mirrors Pendant's
// look: Source Sans 3 body font, Source Code Pro for code, Press Start 2P only
// as a tiny arcade accent on section headers (Pendant reserves it for the logo
// and kicker labels), sharp corners, flat surfaces, subtle 32px pixel grid.
//
// The structural stylesheet is only active while one of the Pendant themes is
// selected; switching back to a stock theme fully restores the normal look.

const PLUGIN_ID = "pendant";
const THEME_ATTR = "data-pi-web-theme";
const FONT_BASE = `/pi-web-plugins/${PLUGIN_ID}/fonts`;

// --- Color tokens -----------------------------------------------------------
// Pendant dark palette: #111 bg, #171717 surface, #4f8cff accent, #47d18c green.

// --- Experiment palette series -----------------------------------------------
// 1. Amber CRT  —  pitch black bg, warm amber glow
const pendantAmberTokens = {
  "--pi-bg": "#050505",
  "--pi-surface": "#0f0f0f",
  "--pi-surface-hover": "#1a1a1a",
  "--pi-terminal-bg": "#000000",
  "--pi-terminal-text": "#ffb000",
  "--pi-border": "#2a1f00",
  "--pi-border-muted": "#1a1400",
  "--pi-text": "#ffb000",
  "--pi-text-secondary": "#cc8800",
  "--pi-text-bright": "#ffcc44",
  "--pi-muted": "#996600",
  "--pi-dim": "#664400",
  "--pi-accent": "#ffb000",
  "--pi-accent-border": "#cc8800",
  "--pi-selection-bg": "#2a1f00",
  "--pi-success": "#ffb000",
  "--pi-success-border": "#996600",
  "--pi-success-bg": "#0f0a00",
  "--pi-success-surface": "#1a1400",
  "--pi-success-ring": "#ffb00055",
  "--pi-warning": "#ff8800",
  "--pi-warning-border": "#cc6600",
  "--pi-warning-surface": "#1a0f00",
  "--pi-danger": "#ff6600",
  "--pi-purple": "#ffaa44",
  "--pi-purple-border": "#cc8822",
  "--pi-purple-surface": "#1a1400",
  "--pi-overlay": "#000a",
  "--pi-shadow-soft": "#0004",
  "--pi-shadow": "#0006",
  "--pi-shadow-strong": "#0008",
  "--pi-bg-overlay-soft": "#050505dd",
  "--pi-bg-overlay": "#050505e6",
  "--pi-success-bg-overlay": "#0f0a00ee",
  "--pi-terminal-selection": "#2a1f00",
};

// 2. Green Phosphor  —  deep black, classic matrix green
const pendantGreenTokens = {
  "--pi-bg": "#050505",
  "--pi-surface": "#0a0f0a",
  "--pi-surface-hover": "#0f1a0f",
  "--pi-terminal-bg": "#000000",
  "--pi-terminal-text": "#00ff41",
  "--pi-border": "#002a10",
  "--pi-border-muted": "#001a08",
  "--pi-text": "#00ff41",
  "--pi-text-secondary": "#00cc33",
  "--pi-text-bright": "#44ff77",
  "--pi-muted": "#008822",
  "--pi-dim": "#005515",
  "--pi-accent": "#00ff41",
  "--pi-accent-border": "#00cc33",
  "--pi-selection-bg": "#002a10",
  "--pi-success": "#00ff41",
  "--pi-success-border": "#00aa2a",
  "--pi-success-bg": "#001a08",
  "--pi-success-surface": "#002a10",
  "--pi-success-ring": "#00ff4155",
  "--pi-warning": "#66ff00",
  "--pi-warning-border": "#44cc00",
  "--pi-warning-surface": "#0a1a00",
  "--pi-danger": "#ff1a44",
  "--pi-purple": "#00ff88",
  "--pi-purple-border": "#00cc66",
  "--pi-purple-surface": "#001a0f",
  "--pi-overlay": "#000a",
  "--pi-shadow-soft": "#0004",
  "--pi-shadow": "#0006",
  "--pi-shadow-strong": "#0008",
  "--pi-bg-overlay-soft": "#050505dd",
  "--pi-bg-overlay": "#050505e6",
  "--pi-success-bg-overlay": "#001a08ee",
  "--pi-terminal-selection": "#002a10",
};

// 3. Cyan/Teal  —  near-black, cool cyan accent
const pendantCyanTokens = {
  "--pi-bg": "#080b0d",
  "--pi-surface": "#0f1417",
  "--pi-surface-hover": "#161c20",
  "--pi-terminal-bg": "#040607",
  "--pi-terminal-text": "#c8e6f0",
  "--pi-border": "#1a2830",
  "--pi-border-muted": "#121c24",
  "--pi-text": "#c8e6f0",
  "--pi-text-secondary": "#8ab4c8",
  "--pi-text-bright": "#e0f4ff",
  "--pi-muted": "#5a7a8a",
  "--pi-dim": "#3a5a6a",
  "--pi-accent": "#00d4ff",
  "--pi-accent-border": "#0099cc",
  "--pi-selection-bg": "#0a2838",
  "--pi-success": "#00e6a0",
  "--pi-success-border": "#009977",
  "--pi-success-bg": "#001a14",
  "--pi-success-surface": "#002a1e",
  "--pi-success-ring": "#00e6a055",
  "--pi-warning": "#ffb84d",
  "--pi-warning-border": "#cc8800",
  "--pi-warning-surface": "#1a1400",
  "--pi-danger": "#ff6b6b",
  "--pi-purple": "#7a9aff",
  "--pi-purple-border": "#5a7add",
  "--pi-purple-surface": "#101828",
  "--pi-overlay": "#000a",
  "--pi-shadow-soft": "#0004",
  "--pi-shadow": "#0006",
  "--pi-shadow-strong": "#0008",
  "--pi-bg-overlay-soft": "#080b0ddd",
  "--pi-bg-overlay": "#080b0de6",
  "--pi-success-bg-overlay": "#001a14ee",
  "--pi-terminal-selection": "#0a2838",
};

// 4. Nearly Monochrome  —  pure grayscale, clean and flat
const pendantMonoTokens = {
  "--pi-bg": "#080808",
  "--pi-surface": "#121212",
  "--pi-surface-hover": "#1c1c1c",
  "--pi-terminal-bg": "#030303",
  "--pi-terminal-text": "#e0e0e0",
  "--pi-border": "#242424",
  "--pi-border-muted": "#181818",
  "--pi-text": "#e0e0e0",
  "--pi-text-secondary": "#a0a0a0",
  "--pi-text-bright": "#f0f0f0",
  "--pi-muted": "#707070",
  "--pi-dim": "#505050",
  "--pi-accent": "#cccccc",
  "--pi-accent-border": "#888888",
  "--pi-selection-bg": "#282828",
  "--pi-success": "#aaaaaa",
  "--pi-success-border": "#777777",
  "--pi-success-bg": "#121212",
  "--pi-success-surface": "#1c1c1c",
  "--pi-success-ring": "#aaaaaa55",
  "--pi-warning": "#bbbbbb",
  "--pi-warning-border": "#888888",
  "--pi-warning-surface": "#1c1c1c",
  "--pi-danger": "#cccccc",
  "--pi-purple": "#bbbbbb",
  "--pi-purple-border": "#888888",
  "--pi-purple-surface": "#1c1c1c",
  "--pi-overlay": "#000a",
  "--pi-shadow-soft": "#0004",
  "--pi-shadow": "#0006",
  "--pi-shadow-strong": "#0008",
  "--pi-bg-overlay-soft": "#080808dd",
  "--pi-bg-overlay": "#080808e6",
  "--pi-success-bg-overlay": "#121212ee",
  "--pi-terminal-selection": "#303030",
};

// 5. Muted Everything  —  desaturated hints, barely-there color
const pendantMutedTokens = {
  "--pi-bg": "#0a0a0a",
  "--pi-surface": "#141414",
  "--pi-surface-hover": "#1e1e1e",
  "--pi-terminal-bg": "#050505",
  "--pi-terminal-text": "#dfdfdf",
  "--pi-border": "#262626",
  "--pi-border-muted": "#1a1a1a",
  "--pi-text": "#dfdfdf",
  "--pi-text-secondary": "#9f9f9f",
  "--pi-text-bright": "#efefef",
  "--pi-muted": "#6f6f6f",
  "--pi-dim": "#4f4f4f",
  "--pi-accent": "#8899aa",
  "--pi-accent-border": "#667788",
  "--pi-selection-bg": "#1a1a22",
  "--pi-success": "#889a88",
  "--pi-success-border": "#667a66",
  "--pi-success-bg": "#0f140f",
  "--pi-success-surface": "#1a1f1a",
  "--pi-success-ring": "#889a8855",
  "--pi-warning": "#9a9a77",
  "--pi-warning-border": "#7a7a55",
  "--pi-warning-surface": "#1c1c14",
  "--pi-danger": "#9a7777",
  "--pi-purple": "#8877aa",
  "--pi-purple-border": "#665588",
  "--pi-purple-surface": "#14141e",
  "--pi-overlay": "#000a",
  "--pi-shadow-soft": "#0004",
  "--pi-shadow": "#0006",
  "--pi-shadow-strong": "#0008",
  "--pi-bg-overlay-soft": "#0a0a0add",
  "--pi-bg-overlay": "#0a0a0ae6",
  "--pi-success-bg-overlay": "#0f140fee",
  "--pi-terminal-selection": "#282828",
};

const pendantDarkTokens = {
  "--pi-bg": "#111111",
  "--pi-surface": "#171717",
  "--pi-surface-hover": "#202020",
  "--pi-terminal-bg": "#0a0a0a",
  "--pi-terminal-text": "#f5f5f5",
  "--pi-border": "#2f2f2f",
  "--pi-border-muted": "#1f1f1f",
  "--pi-text": "#f5f5f5",
  "--pi-text-secondary": "#b5b5b5",
  "--pi-text-bright": "#ffffff",
  "--pi-muted": "#7f7f7f",
  "--pi-dim": "#666666",
  "--pi-accent": "#4f8cff",
  "--pi-accent-border": "#4f8cff",
  "--pi-selection-bg": "#1b2c46",
  "--pi-success": "#47d18c",
  "--pi-success-border": "#2e8f5e",
  "--pi-success-bg": "#0d1f16",
  "--pi-success-surface": "#123024",
  "--pi-success-ring": "#47d18c55",
  "--pi-warning": "#f0b429",
  "--pi-warning-border": "#8a6d1f",
  "--pi-warning-surface": "#1f1a0d",
  "--pi-danger": "#ff5f56",
  "--pi-purple": "#b98aff",
  "--pi-purple-border": "#9a5cff",
  "--pi-purple-surface": "#1c1329",
  "--pi-overlay": "#000a",
  "--pi-shadow-soft": "#0006",
  "--pi-shadow": "#0008",
  "--pi-shadow-strong": "#000b",
  "--pi-bg-overlay-soft": "#111111dd",
  "--pi-bg-overlay": "#111111e6",
  "--pi-success-bg-overlay": "#0d1f16ee",
  "--pi-terminal-selection": "#264f78",
};

// Pendant light palette: #fafafa bg, #ffffff surface, #145fd7 accent, #168350 green.

const pendantLightTokens = {
  "--pi-bg": "#fafafa",
  "--pi-surface": "#ffffff",
  "--pi-surface-hover": "#f0f2f4",
  "--pi-terminal-bg": "#161616",
  "--pi-terminal-text": "#fafafa",
  "--pi-border": "#d9d9d9",
  "--pi-border-muted": "#ececec",
  "--pi-text": "#161616",
  "--pi-text-secondary": "#545b62",
  "--pi-text-bright": "#000000",
  "--pi-muted": "#62686f",
  "--pi-dim": "#7f858c",
  "--pi-accent": "#145fd7",
  "--pi-accent-border": "#145fd7",
  "--pi-selection-bg": "#d7e4fb",
  "--pi-success": "#168350",
  "--pi-success-border": "#168350",
  "--pi-success-bg": "#e3f5ec",
  "--pi-success-surface": "#d2efe0",
  "--pi-success-ring": "#16835055",
  "--pi-warning": "#9a6700",
  "--pi-warning-border": "#9a6700",
  "--pi-warning-surface": "#fff2d2",
  "--pi-danger": "#b52a20",
  "--pi-purple": "#7a3ff2",
  "--pi-purple-border": "#7a3ff2",
  "--pi-purple-surface": "#efe7fd",
  "--pi-overlay": "#16161666",
  "--pi-shadow-soft": "#16161622",
  "--pi-shadow": "#16161633",
  "--pi-shadow-strong": "#16161644",
  "--pi-bg-overlay-soft": "#fafafadd",
  "--pi-bg-overlay": "#fafafae6",
  "--pi-success-bg-overlay": "#e3f5ecee",
  "--pi-terminal-selection": "#8fb3e8",
};

// --- Document-level styles (fonts must live in the document, not shadow DOM) -

const documentCss = `
@font-face {
  font-family: "Pendant Source Sans 3";
  src: url("${FONT_BASE}/SourceSans3VF-Upright.woff2") format("woff2-variations");
  font-weight: 200 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Pendant Source Sans 3";
  src: url("${FONT_BASE}/SourceSans3VF-Italic.woff2") format("woff2-variations");
  font-weight: 200 900;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Pendant Source Code Pro";
  src: url("${FONT_BASE}/SourceCodeVF-Upright.woff2") format("woff2-variations");
  font-weight: 200 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Pendant Press Start 2P";
  src: url("${FONT_BASE}/PressStart2P-Regular.ttf") format("truetype");
  font-weight: 400;
  font-display: swap;
}
html[${THEME_ATTR}^="${PLUGIN_ID}:"] body {
  font-family: "Pendant Source Sans 3", Arial, Helvetica, sans-serif;
}
/* Pendant's signature subtle pixel grid behind the app. Outer-tree rules win
   over :host rules per-property, so only background-image/size are affected. */
html[${THEME_ATTR}^="${PLUGIN_ID}:"] pi-web-app {
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--pi-text) 1%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--pi-text) 1%, transparent) 1px, transparent 1px);
  background-size: 32px 32px, 32px 32px;
}
`;

// --- Shadow-root structural styles (toggled with the theme) ------------------

const pixelCss = `
/* 8-bit: sharp boxes everywhere, no soft shadows, no rounded pills. */
:host, *, *::before, *::after {
  border-radius: 0 !important;
}
* {
  box-shadow: none !important;
  text-shadow: none !important;
  backdrop-filter: none !important;
}

/* Pendant body font: Source Sans 3, 15px, weight 430. */
:host {
  font-family: "Pendant Source Sans 3", Arial, Helvetica, sans-serif !important;
  font-size: 15px !important;
  font-weight: 430;
}
* {
  font-family: inherit !important;
}
pre, code {
  font-family: "Pendant Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
}

/* Tiny arcade kicker for section headers and the PI WEB logo. */
h2,
header > strong:first-child {
  font-family: "Pendant Press Start 2P", ui-monospace, monospace !important;
  font-size: 0.6rem !important;
  line-height: 1.8 !important;
  letter-spacing: 0.1em !important;
  font-weight: 400 !important;
}
/* Buttons inside those kickers should stay normal. */
button {
  font-family: "Pendant Source Sans 3", Arial, Helvetica, sans-serif !important;
  font-size: 15px !important;
  font-weight: 430 !important;
}

/* Keep xterm's font metrics intact: it measures glyphs in JS with this exact
   stack (see TerminalPanel), so the DOM renderer must use the same one. */
.terminal-host, .terminal-host * {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
}

/* Crisp pixels for previews/avatars, crisp focus outlines. */
img {
  image-rendering: pixelated;
}
:focus-visible {
  outline-width: 2px !important;
  outline-offset: 0 !important;
}

/* Fewer visible hairlines: hide the most decorative muted separators. */
.msg > .msg-header {
  border-bottom-color: transparent !important;
}
`;

// --- Style injection machinery ----------------------------------------------

const pixelSheet = new CSSStyleSheet();
pixelSheet.replaceSync(pixelCss);

function isPendantThemeActive() {
  const value = document.documentElement.getAttribute(THEME_ATTR) ?? "";
  return value.startsWith(`${PLUGIN_ID}:`);
}

function syncPixelSheet() {
  pixelSheet.disabled = !isPendantThemeActive();
}

function adoptInto(shadowRoot) {
  if (!shadowRoot.adoptedStyleSheets.includes(pixelSheet)) {
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, pixelSheet];
  }
}

function findAdoptedStyleSheetsDescriptor() {
  for (let proto = ShadowRoot.prototype; proto !== null; proto = Object.getPrototypeOf(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, "adoptedStyleSheets");
    if (descriptor !== undefined) return descriptor;
  }
  return undefined;
}

function adoptIntoExistingShadowRoots(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  for (let node = root; node !== null; node = walker.nextNode()) {
    if (node instanceof Element && node.shadowRoot !== null) {
      adoptInto(node.shadowRoot);
      adoptIntoExistingShadowRoots(node.shadowRoot);
    }
  }
}

let installed = false;

function installPixelLayer() {
  if (installed) return;
  installed = true;

  // Establish enabled/disabled state before any shadow root adopts the sheet.
  syncPixelSheet();

  // Fonts + document-level rules.
  const style = document.createElement("style");
  style.dataset.piWebPlugin = PLUGIN_ID;
  style.textContent = documentCss;
  document.head.appendChild(style);

  // Cover shadow roots created after installation. Note that appending in an
  // attachShadow wrapper is not enough: Lit's adoptStyles() REPLACES
  // adoptedStyleSheets right after attachShadow(), which would drop our sheet.
  // Wrapping the adoptedStyleSheets setter keeps the pixel sheet always
  // present and always last (so it wins cascade ties against static styles).
  const descriptor = findAdoptedStyleSheetsDescriptor();
  if (descriptor?.get !== undefined && descriptor.set !== undefined) {
    const originalGet = descriptor.get;
    const originalSet = descriptor.set;
    Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
      configurable: true,
      enumerable: descriptor.enumerable ?? false,
      get() {
        return originalGet.call(this);
      },
      set(value) {
        const sheets = [...value].filter((sheet) => sheet !== pixelSheet);
        sheets.push(pixelSheet);
        originalSet.call(this, sheets);
      },
    });
  }

  // Cover shadow roots that never assign adoptedStyleSheets themselves.
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function attachShadowWithPendant(init) {
    const shadowRoot = originalAttachShadow.call(this, init);
    try {
      adoptInto(shadowRoot);
    } catch {
      // Never break component construction over styling.
    }
    return shadowRoot;
  };

  // Cover shadow roots that already exist (plugins load after first render).
  adoptIntoExistingShadowRoots(document.documentElement);

  // Enable/disable the structural layer as the active theme changes.
  const observer = new MutationObserver(syncPixelSheet);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTR] });
}

// --- Plugin export ------------------------------------------------------------

export default {
  apiVersion: 1,
  name: "Pendant Theme",
  activate: () => {
    installPixelLayer();
    return {
      contributions: {
        themes: [
          {
            id: "dark",
            name: "Pendant Dark",
            description: "8-bit Pendant look: pixel fonts, sharp boxes, flat dark surfaces.",
            order: 40,
            colorScheme: "dark",
            tokens: pendantDarkTokens,
          },
          // Experiment series --------------------------------------------------
          {
            id: "amber",
            name: "Amber CRT",
            description: "Pitch black bg, warm amber glow — like an old monochrome terminal.",
            order: 44,
            colorScheme: "dark",
            tokens: pendantAmberTokens,
          },
          {
            id: "green",
            name: "Green Phosphor",
            description: "Deep black bg, classic matrix green — retro green-screen.",
            order: 45,
            colorScheme: "dark",
            tokens: pendantGreenTokens,
          },
          {
            id: "cyan",
            name: "Cyan/Teal",
            description: "Near-black bg, cool cyan accents — modern-retro hybrid.",
            order: 46,
            colorScheme: "dark",
            tokens: pendantCyanTokens,
          },
          {
            id: "mono",
            name: "Nearly Monochrome",
            description: "Pure grayscale — every accent is just a different shade of gray.",
            order: 47,
            colorScheme: "dark",
            tokens: pendantMonoTokens,
          },
          {
            id: "muted",
            name: "Muted Everything",
            description: "Desaturated hints, barely-there color — 5–10% saturation.",
            order: 48,
            colorScheme: "dark",
            tokens: pendantMutedTokens,
          },
          {
            id: "light",
            name: "Pendant Light",
            description: "8-bit Pendant look: pixel fonts, sharp boxes, flat light surfaces.",
            order: 50,
            colorScheme: "light",
            tokens: pendantLightTokens,
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
