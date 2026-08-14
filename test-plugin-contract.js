// Source/package contract test for PI WEB browser plugin API v2.
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

assert.ok(Array.isArray(entries), 'package.json must declare piWeb.plugins as an array');
assert.ok(Array.isArray(publishedFiles), 'package.json must declare published files');
const plugin = entries.find((entry) => entry?.id === 'pendant');
assert.ok(plugin, 'package.json must declare the pendant plugin');
assert.equal(plugin.browserRoot, '.', 'browser plugin must declare its browserRoot');
assert.equal(plugin.module, 'pi-web-plugin.js', 'browser module path must remain canonical');
assert.match(source, /export default\s*\{\s*apiVersion:\s*2\s*,/, 'browser module must export PI WEB API v2');

for (const relativePath of [
  plugin.module,
  'fonts/PressStart2P-Regular.ttf',
  'fonts/SourceCodeVF-Upright.woff2',
  'fonts/SourceSans3VF-Italic.woff2',
  'fonts/SourceSans3VF-Upright.woff2',
  'logos/manifest.json',
]) {
  assert.equal(posix.normalize(relativePath), relativePath, `browser path must be canonical: ${relativePath}`);
  assert.ok(!relativePath.startsWith('../') && !relativePath.startsWith('/'), `browser path must stay inside the package: ${relativePath}`);
  assert.ok(existsSync(new URL(`./${relativePath}`, import.meta.url)), `browser asset is missing: ${relativePath}`);
  assert.ok(
    publishedFiles.some((entry) => relativePath === entry || relativePath.startsWith(`${entry}/`)),
    `browser asset is excluded from npm package files: ${relativePath}`,
  );
}

assert.match(
  source,
  /new URL\("\.\/fonts\/",\s*import\.meta\.url\)\.href/,
  'font URLs must be module-relative for nested and federated deployments',
);
assert.match(
  source,
  /new URL\("\.\/logos\/manifest\.json",\s*import\.meta\.url\)\.href/,
  'manifest URL must be module-relative for nested and federated deployments',
);

console.log('PI WEB browser plugin v2 package contract passed');
