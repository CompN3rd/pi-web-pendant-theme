# Changelog

## 0.5.0 — 2026-10-22

### Breaking compatibility change

This release requires PI WEB browser API v5 **with CSS stylesheet contributions
and `stylesheet-integration` v1**, verified against upstream `4c31ebc8`
(1.202610.6). API v5 alone is not sufficient. Older v4 hosts should stay on
version 0.4.0.

### Migration and refinement

- Require browser API v5 with stylesheet-integration v1 (early v5 hosts lack
  CSS-first themes). Keep 0.4.0 for older hosts.
- Move seven palettes and shared structural styling into host-managed CSS files.
- Remove global attachShadow/adoptedStyleSheets patches; isolate logo DOM
  discovery and clean up observers and timers on theme changes/disposal.
- Add reproducible isolated real-browser captures and logo lifecycle checks.
- Refine desktop proportions, semantic typography, conversation/activity surfaces
  and syntax colours; retain square controls and targeted pixel section labels.
- Restore visible tool-status glyphs, remove blanket font/image overrides and
  improve muted text contrast across the experimental palettes.
- Add 126 bounded palette contrast checks and a 19-view comparison gallery.
- Require explicit visual-review destinations and expected profiles; report
  transport failures without hiding runtime or non-resource console errors.

### Upgrading

Update the package on a compatible host and hard-reload the PI WEB browser tab.
No web-process or session-daemon restart is required.

## 0.4.0

### Breaking compatibility change

- Target PI WEB browser plugin API v4. Verified against PI WEB 1.202609.1.
- Older hosts using browser API v2 should stay on version 0.3.0.

### Fixes

- Explicitly declare `pi.extensions: []` so Pi does not try to load this
  browser-only package as a session extension.

### Release checks

- Update browser plugin contract tests for API v4 and the empty Pi extension manifest.
- Run tests and inline-parser synchronization checks automatically before npm publishing.
- Verify all seven themes at desktop and mobile widths, font and logo asset
  delivery, command-logo updates, and cleanup when returning to a stock theme
  against the running PI WEB 1.202609.1 package.

### Upgrading

Update the package and hard-reload the PI WEB browser tab. No pi-web process or
session-daemon restart is required. Open a new session if an existing session
reported the package-root extension load error.
