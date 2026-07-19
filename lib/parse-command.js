// Command parser unit-tested by test-parse-command.js. The same functions are
// inlined in pi-web-plugin.js so the plugin has zero runtime imports; keep
// them in sync when making changes.

function skipWhitespace(s, i) {
  while (i < s.length && /\s/.test(s[i])) i++;
  return i;
}

function skipHorizontalWhitespace(s, i) {
  while (i < s.length && /[ \t]/.test(s[i])) i++;
  return i;
}

function separatorLength(s, i) {
  if (s.slice(i, i + 2) === "&&") return 2;
  if (s[i] === ";" || s[i] === "\n" || s[i] === "|") return 1;
  if (s[i] === "\r") return s[i + 1] === "\n" ? 2 : 1;
  return 0;
}

function readShellWord(s, i) {
  const start = i;
  while (i < s.length && !/[\s&;|]/.test(s[i])) {
    if (s[i] === "\\") {
      i += i + 1 < s.length ? 2 : 1;
    } else if (s[i] === "\"" || s[i] === "'") {
      const quote = s[i++];
      while (i < s.length && s[i] !== quote) {
        i += s[i] === "\\" && i + 1 < s.length ? 2 : 1;
      }
      if (i < s.length) i++;
    } else {
      i++;
    }
  }
  return { word: s.slice(start, i), end: i };
}

function skipOneCdPrefix(s, i) {
  const start = i;
  const command = readShellWord(s, i);
  if (command.word.toLowerCase() !== "cd") return start;
  i = skipWhitespace(s, command.end);
  while (s[i] === "-") {
    i = skipWhitespace(s, readShellWord(s, i).end);
  }
  if (separatorLength(s, i) === 0 && i < s.length) {
    i = readShellWord(s, i).end;
  }
  i = skipHorizontalWhitespace(s, i);
  const sepLen = separatorLength(s, i);
  return sepLen === 0 ? start : skipWhitespace(s, i + sepLen);
}

function isAssignmentWord(word) {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(word);
}

function skipLeadingAssignments(s, i) {
  while (i < s.length) {
    const { word, end } = readShellWord(s, i);
    if (!word || !isAssignmentWord(word)) return i;
    i = skipHorizontalWhitespace(s, end);
    const sepLen = separatorLength(s, i);
    if (sepLen > 0) i = skipWhitespace(s, i + sepLen);
    else i = skipWhitespace(s, i);
  }
  return i;
}

// --- firstCommandToken -------------------------------------------------------
// First "real" command token of a shell command string. Strips one leading
// `cd <dir>` + separator (`&&`, `;`, `|`, newline) so `cd ~/repo && git status`
// resolves to `git`, and skips leading shell assignments such as
// `FOO=bar npm test` or `FOO=bar && npm test`.

export function firstCommandToken(s) {
  if (!s) return "";
  let i = skipWhitespace(s, 0);
  i = skipLeadingAssignments(s, i);
  i = skipOneCdPrefix(s, i);
  i = skipLeadingAssignments(s, i);
  return readShellWord(s, i).word;
}
