// Source/package contract test for PI WEB browser plugin API v5.
// This catches discovery failures before publishing; it does not replace loading
// the packed package in a current PI WEB runtime.
// Run: node test-plugin-contract.js
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('./pi-web-plugin.js', import.meta.url), 'utf8');
const entries = packageJson.piWeb?.plugins;
const publishedFiles = packageJson.files;

// Without a pi manifest, Pi treats a local package with no conventional
// resource directories as a session extension and tries to import its root.
assert.deepEqual(packageJson.pi, { extensions: [] }, 'browser-only package must explicitly declare no Pi session extensions');
assert.ok(Array.isArray(entries), 'package.json must declare piWeb.plugins as an array');
assert.ok(Array.isArray(publishedFiles), 'package.json must declare published files');
const plugin = entries.find((entry) => entry?.id === 'pendant');
assert.ok(plugin, 'package.json must declare the pendant plugin');
assert.equal(plugin.browserRoot, '.', 'browser plugin must declare its browserRoot');
assert.equal(plugin.module, 'pi-web-plugin.js', 'browser module path must remain canonical');
assert.match(source, /export default\s*\{\s*apiVersion:\s*5\s*,/, 'browser module must export PI WEB API v5');

for (const relativePath of [
  plugin.module,
  'fonts/PressStart2P-Regular.ttf',
  'fonts/SourceCodeVF-Upright.woff2',
  'fonts/SourceSans3VF-Italic.woff2',
  'fonts/SourceSans3VF-Upright.woff2',
  'logos/manifest.json',
  'styles/pendant.css',
  ...['dark','light','amber','green','cyan','mono','muted'].map(id => `styles/${id}.css`),
]) {
  assert.equal(posix.normalize(relativePath), relativePath, `browser path must be canonical: ${relativePath}`);
  assert.ok(!relativePath.startsWith('../') && !relativePath.startsWith('/'), `browser path must stay inside the package: ${relativePath}`);
  assert.ok(existsSync(new URL(`./${relativePath}`, import.meta.url)), `browser asset is missing: ${relativePath}`);
  assert.ok(
    publishedFiles.some((entry) => relativePath === entry || relativePath.startsWith(`${entry}/`)),
    `browser asset is excluded from npm package files: ${relativePath}`,
  );
}

const css = readFileSync(new URL('./styles/pendant.css', import.meta.url), 'utf8');
assert.match(css, /url\("\.\.\/fonts\//, 'fonts must resolve relative to the CSS asset');
assert.doesNotMatch(css, /@import\b/, 'runtime imports are unsupported');
assert.doesNotMatch(source, /Element\.prototype|ShadowRoot\.prototype|new CSSStyleSheet/, 'host owns stylesheet adoption');
assert.doesNotMatch(source, /tokens:/, 'v5 themes must not declare v4 token objects');
assert.match(source, /dispose: disposeLogos/, 'logo lifecycle must have cleanup');
assert.match(source, /id: "stylesheet-integration"/, 'older v5 hosts must fail explicitly');
for (const id of ['dark','light','amber','green','cyan','mono','muted']) {
  assert.ok(source.includes(`stylesheets: themeStyles("${id}")`));
  const palette = readFileSync(new URL(`./styles/${id}.css`, import.meta.url), 'utf8');
  assert.match(palette, /:root\s*\{/);
  assert.match(palette, /--pi-bg:/);
}
assert.match(
  source,
  /new URL\("\.\/logos\/manifest\.json",\s*import\.meta\.url\)\.href/,
  'manifest URL must be module-relative for nested and federated deployments',
);

console.log('PI WEB browser plugin v5 package contract passed');
