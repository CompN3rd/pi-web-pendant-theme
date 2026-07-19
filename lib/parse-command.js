// Shared command-parsing logic used by both the Pendant plugin and its tests.
//
// Extracted so the unit tests exercise the exact same functions deployed in the
// browser — no more copy-paste drift.
//
// --- firstCommandToken -------------------------------------------------------
// First "real" command token of a shell command string. Strips one leading
// `cd <dir>` + separator (`&&`, `;`, `|`, newline) so `cd ~/repo && git status`
// resolves to `git`. Mirrors Pendant's g41/El semantics (first-token match).

export function firstCommandToken(s) {
  if (!s) return "";
  let i = 0;
  while (i < s.length && /\s/.test(s[i])) i++;
  if (s.slice(i, i + 2).toLowerCase() === "cd" && (i + 2 === s.length || /\s/.test(s[i + 2]))) {
    i += 2;
    while (i < s.length && /\s/.test(s[i])) i++;
    while (i < s.length && s[i] === "-") {
      while (i < s.length && !/\s/.test(s[i])) i++;
      while (i < s.length && /\s/.test(s[i])) i++;
    }
    if (i < s.length && (s[i] === "\"" || s[i] === "'")) {
      const q = s[i]; i++;
      while (i < s.length && s[i] !== q) i++;
      if (i < s.length) i++;
    } else {
      while (i < s.length && !/[\s&;|]/.test(s[i])) i++;
    }
    while (i < s.length && /[ \t]/.test(s[i])) i++;
    let sepLen = 0;
    if (s.slice(i, i + 2) === "&&") sepLen = 2;
    else if (s[i] === ";" || s[i] === "\n" || s[i] === "|") sepLen = 1;
    else if (s[i] === "\r") sepLen = s[i + 1] === "\n" ? 2 : 1;
    if (sepLen === 0) {
      // `cd <dir>` with no separator → `cd` IS the command. Reset to start
      // and re-skip leading whitespace (the original string may have it).
      i = 0;
      while (i < s.length && /\s/.test(s[i])) i++;
    } else {
      i += sepLen;
      while (i < s.length && /\s/.test(s[i])) i++;
      s = s.slice(i);
      i = 0;
    }
  }
  const m = s.slice(i).match(/^\S+/);
  return m ? m[0] : "";
}

// --- extractCommand ----------------------------------------------------------
// Pull the command line out of a PI WEB shell-output <pre> text.
// Format: optional `excluded from context\n\n` prefix, then `$ <cmd>\n\n<output>`.

export function extractCommand(preText) {
  if (!preText) return "";
  // Multiline regex: ^ matches at each line start, so we find the first
  // `$ <cmd>` line without splitting the whole text into an array — important
  // for long streaming outputs where the command line is near the top.
  // The separator is [ \t]+ (not \s+): \s would also match newlines, so a
  // blank command line (`$ \n\n<output>`) would greedily eat across the
  // blank line and capture the first line of *output* as the command.
  const m = /^\$[ \t]+(.*)$/m.exec(preText);
  return m ? m[1].trim() : "";
}
