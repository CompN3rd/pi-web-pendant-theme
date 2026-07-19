// Verify that the inlined parser in pi-web-plugin.js matches the canonical
// copy in lib/parse-command.js. Run via: npm run verify:parser

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let plugin = fs.readFileSync(path.join(ROOT, 'pi-web-plugin.js'), 'utf8');
let lib    = fs.readFileSync(path.join(ROOT, 'lib', 'parse-command.js'), 'utf8');

// Normalize to LF for clean regex matching
plugin = plugin.replace(/\r\n/g, '\n');
lib    = lib.replace(/\r\n/g, '\n');

// Extract the 8 inline parser functions from pi-web-plugin.js
const inlineBlock = plugin.match(
  /^function skipWhitespace[\s\S]*?^function firstCommandToken[\s\S]*?^\}/m
);
if (!inlineBlock) {
  console.error('FAIL: could not extract inline parser from pi-web-plugin.js');
  process.exit(1);
}

// Extract the 8 parser functions from lib/parse-command.js (with export).
const libBlock = lib.match(
  /^function skipWhitespace[\s\S]*?^export function firstCommandToken[\s\S]*?^\}/m
);
if (!libBlock) {
  console.error('FAIL: could not extract parser from lib/parse-command.js');
  process.exit(1);
}

// Strip 'export ' from lib so both are comparable
const libClean = libBlock[0].replace(/^export /m, '');

// --- Semantic comparison (formatting-agnostic) ---
// Strip all insignificant whitespace while preserving string literal content.
function semanticStrip(s) {
  let out = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      while (i < s.length && /\s/.test(s[i])) i++;
      out.push(' ');
    } else if (s[i] === "'" || s[i] === '"') {
      const quote = s[i++];
      out.push(quote);
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\' && i + 1 < s.length) out.push(s[i++], s[i++]);
        else out.push(s[i++]);
      }
      if (i < s.length) out.push(s[i++]);
    } else if (s[i] === '/' && s[i + 1] === '/') {
      while (i < s.length && s[i] !== '\n') i++;
      out.push('\n');
    } else if (s[i] === '/' && s[i + 1] === '*') {
      i += 2;
      while (i < s.length - 1 && !(s[i] === '*' && s[i + 1] === '/')) i++;
      i += 2;
    } else {
      out.push(s[i++]);
    }
  }
  return out.join('').replace(/\s+/g, ' ').trim();
}

const inlineNorm = semanticStrip(inlineBlock[0]);
const libNorm = semanticStrip(libClean);

if (inlineNorm === libNorm) {
  const funcCount = (inlineBlock[0].match(/^function /gm) || []).length;
  console.log(`✓ Inline parser (${funcCount} functions) matches lib/parse-command.js`);
  process.exit(0);
}

// Find first semantic difference
const minLen = Math.min(inlineNorm.length, libNorm.length);
for (let i = 0; i < minLen; i++) {
  if (inlineNorm[i] !== libNorm[i]) {
    const ctx = 40;
    console.error(`First diff at char ${i}:`);
    console.error(`  plugin: ${JSON.stringify(inlineNorm.slice(Math.max(0,i-ctx), i+ctx))}`);
    console.error(`  lib:    ${JSON.stringify(libNorm.slice(Math.max(0,i-ctx), i+ctx))}`);
    break;
  }
}
if (inlineNorm.length !== libNorm.length) {
  console.error(`Length: plugin=${inlineNorm.length} lib=${libNorm.length}`);
}

console.error('\nFAIL: inline parser differs from lib/parse-command.js');
process.exit(1);
