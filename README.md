# PI WEB Pendant Theme

A [Pendant](https://pendant.run/)-inspired theme pack for [PI WEB](https://pi-web.dev/) with retro 8-bit aesthetics: sharp corners, flat surfaces, a subtle pixel grid, Source Sans 3 body font, and Press Start 2P pixel accents on section headers.

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

## Fonts

| File | License |
|---|---|
| `fonts/SourceSans3VF-*` | [SIL OFL 1.1](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md) |
| `fonts/SourceCodeVF-*` | [SIL OFL 1.1](https://github.com/adobe-fonts/source-code-pro/blob/release/LICENSE.md) |
| `fonts/PressStart2P-Regular.ttf` | [SIL OFL 1.1](https://github.com/googlefonts/PressStart2P/blob/main/LICENSE) |

## Development

```bash
git clone https://github.com/CompN3rd/pi-web-pendant-theme.git
cd pi-web-pendant-theme
# edit pi-web-plugin.js, then symlink for live testing:
ln -s "$PWD" ~/.pi-web/plugins/pendant
# hard-reload browser
```

## License

MIT — plugin code. Fonts have their own OFL licenses (see above).
