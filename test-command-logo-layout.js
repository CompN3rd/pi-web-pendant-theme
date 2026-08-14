// Source contract test for the command-logo footprint and SVG containment.
// Computed dimensions and responsive/re-render behavior still require browser testing.
// Run: node test-command-logo-layout.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./pi-web-plugin.js', import.meta.url), 'utf8');

function cssDeclarations(selector) {
  const marker = `${selector} {`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${selector} CSS rule`);
  const end = source.indexOf('}', start + marker.length);
  assert.notEqual(end, -1, `unterminated ${selector} CSS rule`);
  return source.slice(start + marker.length, end);
}

const wrapperCss = cssDeclarations('.pendant-cmd-logo');
assert.match(wrapperCss, /(?:^|\n)\s*flex:\s*0\s+0\s+15px\s*;/, 'logo wrapper must not shrink');
assert.match(wrapperCss, /(?:^|\n)\s*width:\s*15px\s*;/, 'logo wrapper width must be fixed');
assert.match(wrapperCss, /(?:^|\n)\s*height:\s*15px\s*;/, 'logo wrapper height must be fixed');

const svgCss = cssDeclarations('.pendant-cmd-logo svg');
assert.match(svgCss, /(?:^|\n)\s*width:\s*100%\s*;/, 'nested SVG must fill the wrapper width');
assert.match(svgCss, /(?:^|\n)\s*height:\s*100%\s*;/, 'nested SVG must fill the wrapper height');

assert.match(
  source,
  /svg\.setAttribute\("viewBox",\s*"0 0 24 24"\);/,
  'command-logo SVG must retain its normalized view box',
);
assert.match(
  source,
  /svg\.setAttribute\("preserveAspectRatio",\s*"xMidYMid meet"\);/,
  'command-logo SVG must remain centered without distortion',
);

console.log('Command-logo layout source contract passed');
