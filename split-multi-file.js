#!/usr/bin/env node
/**
 * split-multi-file.js
 *
 * A tiny helper that explodes a “multi-file” markdown snippet like
 *
 *   // src/foo.ts
 *   ```
 *   console.log('foo');
 *   ```
 *
 *   // src/bar/baz.js
 *   ```
 *   console.log('baz');
 *   ```
 *
 * into real files on disk.  Extra blank lines between sections are fine,
 * and the very last block **may omit** the closing ``` fence.
 *
 * ─── Usage ──────────────────────────────────────────────────────────────
 *   node scripts/split-multi-file.js /path/to/snippet.txt
 *
 * All files are written **relative to the current working directory** and
 * existing files with the same names will be **overwritten**.
 */

const fs   = require('fs');
const path = require('path');

const input = process.argv[2];

if (!input) {
  console.error('❌  Provide the path to the multi-file snippet.\n' +
                '    Example: node scripts/split-multi-file.js snippet.md');
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(input, 'utf8');
} catch (err) {
  console.error(`❌  Cannot read "${input}":`, err.message);
  process.exit(1);
}

const lines = raw.split(/\r?\n/);
const files = [];

/** Returns true for lines like "// path/to/file.ext"               */
const isFileHeader = (l) => /^\s*\/\/\s*\S/.test(l);

for (let i = 0; i < lines.length; i++) {
  if (!isFileHeader(lines[i])) continue;

  const filePath = lines[i].replace(/^\/\/\s*/, '').trim();
  i++;

  // Skip blank lines between header and fence (if any)
  while (i < lines.length && lines[i].trim() === '') i++;

  // Optional opening fence ```
  let inFence = false;
  if (i < lines.length && lines[i].startsWith('```')) {
    inFence = true;
    i++;
  }

  const codeLines = [];
  for (; i < lines.length; i++) {
    // End of fenced block
    if (inFence && lines[i].startsWith('```')) {
      break;
    }
    // Next file header (unterminated last block)
    if (!inFence && isFileHeader(lines[i])) {
      i--;               // Re-process this line in the outer loop
      break;
    }
    codeLines.push(lines[i]);
  }

  files.push({ filePath, code: codeLines.join('\n') });
}

/* ─── Write files ──────────────────────────────────────────────────── */
files.forEach(({ filePath, code }) => {
  const outPath = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, code, 'utf8');
  console.log(`✔︎ ${filePath}`);
});

console.log(`\nDone. ${files.length} file(s) written.`);
