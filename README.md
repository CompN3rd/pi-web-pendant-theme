# PI WEB Pendant Theme

A [Pendant](https://pendant.run/)-inspired theme pack for [PI WEB](https://pi-web.dev/) with retro 8-bit aesthetics: sharp corners, flat surfaces, a subtle pixel grid, Source Sans 3 body font, and Press Start 2P pixel accents on section headers.

## Command logos

When a Pendant theme is active, shell-command boxes (`.msg.bash`) get an
unobtrusive brand logo in their header, matching the first token of the
command to a [Simple Icons](https://simpleicons.org/) slug — the same idea
as the Pendant VS Code extension.

- **236 commands** mapped across git, shells, every major language/runtime,
  package managers, build tools, test runners, linters, bundlers,
  containers, Kubernetes, IaC, clouds, databases, and observability tools.
- **124 brand icons** (Simple Icons, CC0) + **13 hand-crafted generic glyphs**
  (`symbol:search`, `symbol:cloud`, `symbol:hammer`, `symbol:terminal`, …)
  for commands with no brand mark.
- The `bash` header label is replaced with the tool's name (`Git`, `uv`,
  `PDM`, `Python`, `PyPI`, `Rust`, `Docker`, …); generic glyphs keep `bash`.
- `cd <dir> && <cmd>` / `cd <dir>; <cmd>` prefixes are stripped, so
  `cd ~/repo && git push` shows the Git logo.
- **Pendant Dark** and **Pendant Light** use each brand's official hex;
  all experiment themes (Amber CRT, Green Phosphor, Cyan/Teal, Nearly
  Monochrome, Muted Everything) desaturate logos to `--pi-text-secondary`
  so they stay on-palette.
- Fully gated behind the Pendant theme toggle: switching to a stock theme
  strips every logo and restores the `bash` label.

The mapping + icon path data live in [`logos/manifest.json`](./logos/manifest.json)
(`commandToSlug`, `brands`, `symbols`). Brand icons are CC0 (Simple Icons);
the generic `symbol:*` glyphs are MIT-licensed part of this plugin. Brand
logos are trademarks of their owners and are used here only to identify
tools the agent is running.

## Themes

This package contributes 7 themes to PI WEB's theme picker:

| Theme | Description |
|---|---|
| **Pendant Dark** | Original dark palette (blue accent, green success, red danger) |
| **Pendant Light** | Light variant |
| **Amber CRT** | Pitch black bg, warm amber glow — old monochrome terminal |
| **Green Phosphor** | Deep black bg, classic matrix green — green-screen retro |
| **Cyan/Teal** | Near-black bg, cool cyan accents — modern-retro hybrid |
| **Nearly Monochrome** | Pure grayscale — every accent is a different shade of gray |
| **Muted Everything** | Desaturated hints at ~5–10% saturation |

All dark themes share the same structural styling: sharp `border-radius: 0`, flat surfaces (no box-shadows), `image-rendering: pixelated`, and a 32px subtle pixel-grid background.

Fonts are bundled as WOFF2/TTF (no external requests):
- **Source Sans 3** (variable) — body text
- **Source Code Pro** (variable) — code
- **Press Start 2P** — section header arcade kickers

## Installation

### Via Pi (recommended)

```bash
pi install -g @compn3rd/pi-web-pendant-theme
```

Then reload the PI WEB browser tab and select a Pendant theme from the theme picker
(gear icon or action palette).

### Manual

Clone or symlink into `~/.pi-web/plugins/pendant/`:

```bash
mkdir -p ~/.pi-web/plugins
git clone https://github.com/CompN3rd/pi-web-pendant-theme.git ~/.pi-web/plugins/pendant
```

Hard-reload the PI WEB browser tab.

## Fonts & assets

| File | License |
|---|---|
| `fonts/SourceSans3VF-*` | [SIL OFL 1.1](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md) |
| `fonts/SourceCodeVF-*` | [SIL OFL 1.1](https://github.com/adobe-fonts/source-code-pro/blob/release/LICENSE.md) |
| `fonts/PressStart2P-Regular.ttf` | [SIL OFL 1.1](https://github.com/googlefonts/PressStart2P/blob/main/LICENSE) |
| `logos/manifest.json` brand icons | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — from [Simple Icons](https://simpleicons.org/) |
| `logos/manifest.json` `symbol:*` glyphs | MIT (this plugin) |

## Development

```bash
git clone https://github.com/CompN3rd/pi-web-pendant-theme.git
cd pi-web-pendant-theme
# edit pi-web-plugin.js, then symlink for live testing:
ln -s "$PWD" ~/.pi-web/plugins/pendant
# hard-reload browser
```

### Tests

```bash
node test-parse-command.js    # pure-logic: command-token + $-line parsing
```

(The DOM injection path is covered by manual testing on localhost:8504.)

### Rebuilding the icon manifest

`logos/manifest.json` is generated from `simple-icons` (CC0) plus hand-crafted
`symbol:*` glyphs. To regenerate after bumping the Simple Icons set:

```bash
node scripts/build-manifest.js
```

## License

MIT — plugin code and the `symbol:*` generic glyphs. Fonts have their own
OFL licenses (see above). Brand icons in `logos/manifest.json` are CC0 from
Simple Icons; the brand marks themselves are trademarks of their owners,
used here only to identify which tool the agent is running.
