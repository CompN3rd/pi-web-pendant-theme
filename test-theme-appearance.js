// Bounded contrast checks, not a claim of whole-app WCAG compliance.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { piWeb } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const themes = piWeb.plugins.find(plugin => plugin.id === 'pendant').themes;
const shared = readFileSync(new URL('./styles/pendant.css',import.meta.url),'utf8');
assert.doesNotMatch(shared, /image-rendering:\s*pixelated|font-family:\s*inherit\s*!important/);
assert.doesNotMatch(shared, /\.status-icon\s*\{[^}]*display:\s*none/);
assert.match(shared, /--pi-font:/);
assert.match(shared, /--pi-mono:/);
assert.equal((shared.match(/!important/g) ?? []).length,1,'only the plugin-owned hidden name needs !important');
const lum = hex => hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
const ratio = (a,b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
let count = 0;
for(const id of ['dark','light','amber','green','cyan','mono','muted']) {
  const css = readFileSync(new URL(`./styles/${id}.css`,import.meta.url),'utf8');
  const tokens = Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2]]));
  const value = key => tokens[key].startsWith('var(') ? value(tokens[key].slice(4,-1)) : tokens[key];
  const loading = themes.find(theme => theme.id === id).loadingScreen;
  assert.deepEqual(loading, {
    background: value('--pi-bg'), foreground: value('--pi-text'), logo: value('--pi-accent'),
  }, `${id}: startup colours must match the palette`);
  for (const colour of Object.values(loading)) assert.match(colour, /^#(?:[\da-f]{3}|[\da-f]{6})$/i);
  assert(ratio(loading.foreground, loading.background) >= 4.5, `${id}: unreadable startup errors`);
  assert(ratio(loading.logo, loading.background) >= 3, `${id}: startup activity needs visible contrast`);
  for(const text of ['--pi-text','--pi-text-secondary','--pi-muted','--pi-syntax-comment','--pi-syntax-keyword','--pi-syntax-string','--pi-syntax-number','--pi-syntax-title','--pi-syntax-deletion']) {
    for(const bg of ['--pi-bg','--pi-surface']) {
      const contrast=ratio(value(text),value(bg));
      assert(contrast>=4.5,`${id} ${text} on ${bg}: ${contrast.toFixed(2)} < 4.5`);
      count++;
    }
  }
}
console.log(`${count} palette text/syntax contrast checks passed (>=4.5:1 on base and surface)`);
