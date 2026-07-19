// Standalone unit test: exercises the exact parsing functions that the Pendant
// theme plugin uses in the browser — no copy-paste drift.
// Run: node test-parse-command.js
import assert from 'node:assert/strict';
import { firstCommandToken, extractCommand } from './lib/parse-command.js';

// --- tests ------------------------------------------------------------------
const cases = [
  ['git status', 'git'],
  ['git push origin main', 'git'],
  ['uv sync', 'uv'],
  ['uvx ruff check .', 'uvx'],
  ['pdm install', 'pdm'],
  ['python -m pytest -x', 'python'],
  ['python3 -m black .', 'python3'],
  ['poetry run pytest', 'poetry'],
  ['pip install -e .', 'pip'],
  ['pip3 install httpx', 'pip3'],
  ['  ruff format . ', 'ruff'],
  ['cd ~/repo && git status', 'git'],
  ['cd /tmp && uv sync', 'uv'],
  ['cd "my dir" && pdm install', 'pdm'],
  ["cd 'src' && pytest", 'pytest'],
  ['cd --foo bar && git push', 'git'],
  ['cd ~/repo; git status', 'git'],
  ['cd ~/repo\ngit status', 'git'],
  ['cd ~/repo\r\ngit status', 'git'],
  ['cd ~/repo | grep foo', 'grep'],
  ['cd ~/repo', 'cd'],          // no separator → cd is the command
  ['  cd ~/repo', 'cd'],        // leading whitespace + cd + no separator
  ['  cd', 'cd'],               // leading whitespace + bare cd
  ['  cd ~/repo && git status', 'git'], // leading whitespace + cd + separator
  ['cargo build --release', 'cargo'],
  ['docker compose up -d', 'docker'],
  ['docker-compose up', 'docker-compose'],
  ['npm run build', 'npm'],
  ['npx playwright test', 'npx'],
  ['go test ./...', 'go'],
  ['kubectl get pods', 'kubectl'],
  ['terraform apply', 'terraform'],
  ['gcloud auth login', 'gcloud'],
  ['make all', 'make'],
  ['cmake -B build', 'cmake'],
  ['', ''],
  ['   ', ''],
];

let pass = 0, fail = 0;
for (const [input, want] of cases) {
  try {
    assert.equal(firstCommandToken(input), want);
    pass++;
  } catch (e) {
    fail++;
    console.error(`FAIL: ${JSON.stringify(input)} -> got ${JSON.stringify(firstCommandToken(input))}, want ${JSON.stringify(want)}`);
  }
}

// extractCommand tests
const preCases = [
  ['$ git status\n\nOn branch main...', 'git status'],
  ['excluded from context\n\n$ uv sync\n\nResolved', 'uv sync'],
  ['$ pdm install', 'pdm install'],
  ['no command here', ''],
  // Blank command line (e.g. an empty bash call): `$ ` then newline — must NOT
  // eat across the blank line into the output and treat it as the command.
  ['$ \n\noutput', ''],
  ['', ''],
];
for (const [input, want] of preCases) {
  try {
    assert.equal(extractCommand(input), want);
    pass++;
  } catch (e) {
    fail++;
    console.error(`FAIL extract: ${JSON.stringify(input)} -> got ${JSON.stringify(extractCommand(input))}, want ${JSON.stringify(want)}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
