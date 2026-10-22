# Changelog

## Unreleased — v5 migration

- Require browser API v5 with stylesheet-integration v1 (early v5 hosts lack
  CSS-first themes). Keep 0.4.0 for older hosts.
- Move seven palettes and shared structural styling into host-managed CSS files.
- Remove global attachShadow/adoptedStyleSheets patches; isolate logo DOM
  discovery and clean up observers and timers on theme changes/disposal.
- Add reproducible isolated real-browser captures and logo lifecycle checks.

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
