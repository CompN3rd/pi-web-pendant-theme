// Rebuild logos/manifest.json from simple-icons (CC0) + hand-crafted symbol glyphs.
//
//   node scripts/build-manifest.js
//
// Fetches the simple-icons package data + index from unpkg, extracts every
// brand slug referenced by `commandToSlug` below, and writes a compact
// manifest { commandToSlug, brands, symbols } next to the plugin.
//
// Brand icons that simple-icons has removed for trademark reasons
// (Java, AWS, Azure, Heroku, IBM Cloud, Playwright, Parcel, Ninja, Meson)
// are mapped to generic `symbol:*` fallbacks defined in `symbols` below.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SI_VERSION = '16.27.0';
const ROOT = join(__dirname, '..');

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.text();
}

// command -> icon slug. Brand slugs use Simple Icons naming; `symbol:*`
// are generic fallbacks resolved from the `symbols` table below.
const commandToSlug = {
  // git / vcs
  git: 'git', gh: 'github', hg: 'mercurial', svn: 'subversion',
  'git-lfs': 'gitlfs', lazygit: 'git', tig: 'git', hub: 'github',
  glab: 'gitlab', bb: 'bitbucket', bitbucket: 'bitbucket',
  gitleaks: 'git', act: 'githubactions',
  // search
  grep: 'symbol:search', rg: 'symbol:search', ag: 'symbol:search',
  ack: 'symbol:search', find: 'symbol:search', fd: 'symbol:search',
  which: 'symbol:search', semgrep: 'symbol:search',
  // listing / text / file / network utils
  ls: 'symbol:terminal', tree: 'symbol:terminal', cat: 'symbol:file',
  head: 'symbol:file', tail: 'symbol:listEnd', wc: 'symbol:hash',
  sed: 'symbol:file', awk: 'symbol:file', sort: 'symbol:arrowDownUp',
  cut: 'symbol:file', diff: 'symbol:fileCode', cmp: 'symbol:gitCompare',
  comm: 'symbol:gitCompare', date: 'symbol:hash', file: 'symbol:file',
  cp: 'symbol:file', mv: 'symbol:file', rm: 'symbol:file',
  mkdir: 'symbol:file', rmdir: 'symbol:file', touch: 'symbol:file',
  echo: 'symbol:terminal', tee: 'symbol:file', xargs: 'symbol:terminal',
  curl: 'symbol:cloud', wget: 'symbol:cloud',
  // shells
  sh: 'symbol:terminal', bash: 'gnubash', zsh: 'zsh', fish: 'fishshell',
  pwsh: 'symbol:terminal', powershell: 'symbol:terminal',
  // node / js runtimes & package managers
  npm: 'npm', pnpm: 'pnpm', yarn: 'yarn', bun: 'bun', corepack: 'npm',
  npx: 'npm', bunx: 'bun', node: 'nodedotjs', tsx: 'typescript',
  'ts-node': 'typescript', deno: 'deno',
  // system package managers
  nuget: 'nuget', choco: 'chocolatey', chocolatey: 'chocolatey',
  apt: 'debian', 'apt-get': 'debian', aptitude: 'debian', dpkg: 'debian',
  dnf: 'fedora', yum: 'redhat', rpm: 'redhat', pacman: 'archlinux',
  brew: 'homebrew', pod: 'cocoapods', fastlane: 'fastlane',
  nix: 'nixos', 'nix-shell': 'nixos', 'nix-build': 'nixos',
  'nix-env': 'nixos', nvm: 'nvm',
  // python
  python: 'python', python3: 'python', pip: 'pypi', pip3: 'pypi',
  pipx: 'pypi', uv: 'uv', uvx: 'uv', poetry: 'poetry', pipenv: 'python',
  pdm: 'pdm', pytest: 'pytest', ruff: 'ruff', mypy: 'python',
  pyright: 'python', black: 'black', isort: 'python', tox: 'python',
  nox: 'python', hatch: 'python', 'pip-compile': 'pypi',
  // js test / build / bundlers
  vitest: 'vitest', jest: 'jest', mocha: 'mocha', ava: 'avajs',
  playwright: 'symbol:flask', cypress: 'cypress', eslint: 'eslint',
  eslint_d: 'eslint', prettier: 'prettier', prettierd: 'prettier',
  biome: 'biome', tsc: 'typescript', 'ts-prune': 'typescript',
  vite: 'vite', 'create-vite': 'vite', 'svelte-check': 'svelte',
  svelte: 'svelte', 'create-svelte': 'svelte', astro: 'astro',
  next: 'nextdotjs', 'next-app': 'nextdotjs', 'create-next-app': 'nextdotjs',
  storybook: 'storybook', vitepress: 'vitepress', webpack: 'webpack',
  rollup: 'rollupdotjs', esbuild: 'esbuild', tsup: 'typescript',
  turbo: 'turborepo', nx: 'nx', lerna: 'lerna', rush: 'npm',
  parcel: 'symbol:box',
  // go / rust / c / c++
  go: 'go', gofmt: 'go', goimports: 'go', 'golangci-lint': 'go',
  goreleaser: 'go', cargo: 'rust', rustc: 'rust',
  gcc: 'symbol:hammer', 'g++': 'symbol:hammer', clang: 'symbol:hammer',
  'clang++': 'symbol:hammer',
  // dotnet / jvm
  dotnet: 'dotnet', msbuild: 'dotnet', java: 'openjdk', javac: 'openjdk',
  scala: 'scala', 'scala-cli': 'scala', sbt: 'scala', kotlin: 'kotlin',
  kotlinc: 'kotlin', zig: 'zig', mvn: 'apachemaven', mvnw: 'apachemaven',
  gradle: 'gradle', gradlew: 'gradle', swift: 'swift', xcodebuild: 'swift',
  // ruby / php / elixir / flutter / dart
  ruby: 'ruby', bundle: 'ruby', bundler: 'ruby', rake: 'ruby',
  php: 'php', composer: 'composer', mix: 'elixir', elixir: 'elixir',
  flutter: 'flutter', dart: 'dart',
  // containers / k8s
  docker: 'docker', 'docker-compose': 'docker', podman: 'podman',
  systemctl: 'symbol:terminal', journalctl: 'symbol:terminal',
  service: 'symbol:terminal', kubectl: 'kubernetes',
  kustomize: 'kubernetes', kind: 'kubernetes', minikube: 'kubernetes',
  argocd: 'argo', flux: 'flux', helm: 'helm',
  // iac / cloud / security / observability
  terraform: 'terraform', tofu: 'opentofu', opentofu: 'opentofu',
  packer: 'packer', pulumi: 'pulumi', ansible: 'ansible', vault: 'vault',
  op: 'symbol:lock', sops: 'symbol:lock', trivy: 'trivy', snyk: 'snyk',
  prometheus: 'prometheus', promtool: 'prometheus',
  'datadog-ci': 'datadog', 'datadog-agent': 'datadog', splunk: 'splunk',
  newrelic: 'newrelic',
  // databases
  psql: 'postgresql', mysql: 'mysql', mariadb: 'mariadb',
  sqlite3: 'sqlite', 'redis-cli': 'redis', mongosh: 'mongodb',
  mongo: 'mongodb', duckdb: 'duckdb', elasticsearch: 'elasticsearch',
  'elastic-agent': 'elasticsearch', bq: 'googlebigquery', snow: 'snowflake',
  snowsql: 'snowflake', influx: 'influxdb', databricks: 'databricks',
  cqlsh: 'apachecassandra', 'cypher-shell': 'neo4j', clickhouse: 'clickhouse',
  'clickhouse-client': 'clickhouse', cockroach: 'cockroachlabs',
  // clouds
  gcloud: 'googlecloud', aws: 'symbol:cloud', az: 'symbol:cloud',
  doctl: 'digitalocean', heroku: 'symbol:cloud', flyctl: 'flydotio',
  railway: 'railway', ibmcloud: 'symbol:cloud', yc: 'yandexcloud',
  vercel: 'vercel', netlify: 'netlify', wrangler: 'cloudflareworkers',
  cloudflared: 'cloudflare', firebase: 'firebase', supabase: 'supabase',
  // build / misc
  just: 'just', task: 'task', bazel: 'bazel', ninja: 'symbol:hammer',
  meson: 'symbol:hammer', make: 'make', cmake: 'cmake',
  direnv: 'dotenv', dotenv: 'dotenv',
};

// hand-crafted generic glyphs (24x24 viewBox, single path, MIT — this plugin).
const symbols = {
  cloud: 'M6 14a4 4 0 0 1 .8-7.9 5 5 0 0 1 9.6 1.4A4 4 0 0 1 17 18H7a4 4 0 0 1-1-4z',
  flask: 'M9 2v2h1v4.6L4.2 18a2 2 0 0 0 1.7 3h12.2a2 2 0 0 0 1.7-3L15 8.6V4h1V2H9zm3 2h0v5.4l.3.5L17 18H7l4.7-8.1.3-.5V4z',
  box: 'M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.3 7.5 3.7L12 11.7 4.5 8 12 4.3zM4 9.5l7 3.5v7.4l-7-3.5V9.5zm16 0v7.4l-7 3.5V13l7-3.5z',
  search: 'M10 2a8 8 0 1 0 4.9 14.32l5.39 5.39 1.42-1.42-5.39-5.39A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z',
  hammer: 'M21.6 6.4 17.7 2.5a1.4 1.4 0 0 0-2 0L9.3 8.9 5.4 5a1.4 1.4 0 0 0-2 0L2 6.4a1.4 1.4 0 0 0 0 2l3.9 3.9-3.2 3.2a1.4 1.4 0 0 0 0 2l3.3 3.3a1.4 1.4 0 0 0 2 0l3.2-3.2 3.9 3.9a1.4 1.4 0 0 0 2 0l1.4-1.4a1.4 1.4 0 0 0 0-2L13.7 14.1l6.4-6.4a1.4 1.4 0 0 0 0-2z',
  terminal: 'M2 3h20a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h18V5H3zm3.3 3.7 3 3-3 3 1.4 1.4 3.7-3.7a1 1 0 0 0 0-1.4L7.7 7.3 6.3 8.7zM13 14h5v2h-5z',
  file: 'M6 2h8l4 4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm7 1.5V7h3.5L13 3.5zM7 4v16h10V9h-4a1 1 0 0 1-1-1V4H7z',
  hash: 'M9.2 2 8 8H3v2h4.6l-.9 4H3v2h3.4l-.9 4.2 2 .4.9-4.2h4l-.9 4.2 2 .4.9-4.2H20v-2h-3.4l.9-4H20V8h-3.4l1.2-6-2-.4L14.6 8h-4l1.2-6-2-.4zM10.4 10h4l-.9 4h-4l.9-4z',
  listEnd: 'M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h12v2H3v-2zm0 4h18v2H3v-2zm15-7 5 4-5 4V9z',
  arrowDownUp: 'M7 2 3 6h3v12H3l4 4 4-4H8V6h3L7 2zm10 4v12h-3l4 4 4-4h-3V6h3l-4-4-4 4h3z',
  fileCode: 'M6 2h8l4 4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm7 1.5V7h3.5L13 3.5zM9.6 12 7 14.6 9.6 17l1.4-1.4-1.6-1.6 1.6-1.6L9.6 12zm4.8 0-1.4 1.4 1.6 1.6-1.6 1.6L14.4 18 17 15.4 14.4 12z',
  gitCompare: 'M6 3a3 3 0 1 0 .8 5.9L9 11v6.2A3 3 0 1 0 11 20v-8a1 1 0 0 0-.3-.7L8.3 9a3 3 0 0 0-2.3-6zm12 0a3 3 0 0 0-3 3 3 3 0 0 0 .2 1L12.7 3.3l-1.4 1.4 4 4a1 1 0 0 0 1.4 0l4-4-1.4-1.4L16.8 4.9A3 3 0 0 0 18 3zM6 14l-3 3 3 3 1-1-1.3-1.3A3 3 0 0 1 9 18a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z',
  lock: 'M12 2a5 5 0 0 1 5 5v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3z',
};

console.log('fetching simple-icons metadata + index...');
const [metaText, indexText] = await Promise.all([
  fetchText(`https://unpkg.com/simple-icons@${SI_VERSION}/data/simple-icons.json`),
  fetchText(`https://unpkg.com/simple-icons@${SI_VERSION}/index.js`),
]);
const metaArr = JSON.parse(metaText);
const metaBySlug = new Map();
for (const i of metaArr) metaBySlug.set(i.slug, i);

function extractPath(slug) {
  const needle = `slug:"${slug}"`;
  const idx = indexText.indexOf(needle);
  if (idx < 0) return null;
  const m = indexText.slice(idx, idx + 40000).match(/path:"((?:[^"\\]|\\.)*)"/);
  return m ? m[1] : null;
}

const brandSlugs = new Set();
for (const v of Object.values(commandToSlug)) {
  if (!v.startsWith('symbol:')) brandSlugs.add(v);
}

const brands = {};
const missing = [];
for (const slug of brandSlugs) {
  const meta = metaBySlug.get(slug);
  const path = extractPath(slug);
  if (!meta || !path) { missing.push(slug); continue; }
  brands[slug] = { title: meta.title, hex: (meta.hex || '').toUpperCase(), path };
}

if (missing.length) {
  console.error('MISSING brand slugs in simple-icons (map them to symbol:* or an alias):');
  console.error('  ' + missing.join(', '));
  process.exit(1);
}

const manifest = { commandToSlug, brands, symbols };
const dest = join(ROOT, 'logos', 'manifest.json');
writeFileSync(dest, JSON.stringify(manifest, null, 2));
console.log(`wrote ${dest}`);
console.log(`  commands: ${Object.keys(commandToSlug).length}`);
console.log(`  brands:   ${Object.keys(brands).length}`);
console.log(`  symbols:  ${Object.keys(symbols).length}`);
