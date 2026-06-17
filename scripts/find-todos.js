#!/usr/bin/env node
/**
 * find-todos.js
 *
 * Recursively searches the repository for TODO comments and prints a
 * formatted, colour-coded report to stdout.
 *
 * Recognised patterns (case-insensitive):
 *   // TODO ...
 *   # TODO ...
 *   <!-- TODO ... -->
 *   /* TODO ... *\/
 *   * TODO ...        (inside a JSDoc / block comment)
 *
 * Directories that are always skipped:
 *   node_modules, .git, .next, out, dist, build, coverage, .cache
 *
 * File extensions scanned:
 *   .js .jsx .ts .tsx .mjs .cjs .mts .cts
 *   .css .scss .sass .less
 *   .html .htm .vue .svelte
 *   .md .mdx
 *   .json .yaml .yml
 *   .sh .bash
 *   .tf .tfvars
 *   .sql
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'out', 'dist',
  'build', 'coverage', '.cache', '.parcel-cache',
  '.svelte-kit', '.vite', '.turbo',
]);

const SCAN_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm', '.vue', '.svelte',
  '.md', '.mdx',
  '.json', '.yaml', '.yml',
  '.sh', '.bash',
  '.tf', '.tfvars',
  '.sql',
]);

// Matches a TODO annotation anywhere in a line.
// Capture group 1 = the full TODO annotation text.
const TODO_RE = /(?:\/\/|#|<!--|\/\*|\*)\s*(TODO(?:\(.*?\))?[:\s].+?)(?:\s*-->|\s*\*\/)?$/i;

// ─── ANSI colour helpers ───────────────────────────────────────────────────────

const SUPPORTS_COLOR = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const c = {
  reset:  (s) => SUPPORTS_COLOR ? `\x1b[0m${s}\x1b[0m`  : s,
  bold:   (s) => SUPPORTS_COLOR ? `\x1b[1m${s}\x1b[0m`  : s,
  dim:    (s) => SUPPORTS_COLOR ? `\x1b[2m${s}\x1b[0m`  : s,
  yellow: (s) => SUPPORTS_COLOR ? `\x1b[33m${s}\x1b[0m` : s,
  cyan:   (s) => SUPPORTS_COLOR ? `\x1b[36m${s}\x1b[0m` : s,
  green:  (s) => SUPPORTS_COLOR ? `\x1b[32m${s}\x1b[0m` : s,
  red:    (s) => SUPPORTS_COLOR ? `\x1b[31m${s}\x1b[0m` : s,
};

// ─── File walker ──────────────────────────────────────────────────────────────

/**
 * Yields every file path under `dir` whose extension is in SCAN_EXTENSIONS,
 * skipping any directory whose basename is in SKIP_DIRS.
 * @param {string} dir
 * @returns {Generator<string>}
 */
function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // unreadable directory — skip silently
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(fullPath);
    } else if (entry.isFile()) {
      if (SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        yield fullPath;
      }
    }
  }
}

// ─── TODO scanner ─────────────────────────────────────────────────────────────

/**
 * @typedef {{ file: string, line: number, column: number, text: string }} TodoItem
 */

/**
 * Scans a single file and returns all TODO items found.
 * @param {string} filePath
 * @returns {TodoItem[]}
 */
function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const results = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const match = TODO_RE.exec(raw);
    if (match) {
      results.push({
        file:   filePath,
        line:   i + 1,
        column: raw.indexOf(match[0]) + 1,
        text:   match[1].trim(),
      });
    }
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Resolve the repo root as the directory that contains this script's parent.
  const repoRoot = path.resolve(__dirname, '..');

  console.log(c.bold(`\n🔍  Scanning for TODOs in ${c.cyan(repoRoot)}\n`));

  /** @type {TodoItem[]} */
  const allTodos = [];

  for (const filePath of walk(repoRoot)) {
    const todos = scanFile(filePath);
    allTodos.push(...todos);
  }

  if (allTodos.length === 0) {
    console.log(c.green('  ✅  No TODOs found — clean codebase!\n'));
    process.exit(0);
  }

  // Group by file for a readable report.
  /** @type {Map<string, TodoItem[]>} */
  const byFile = new Map();
  for (const todo of allTodos) {
    if (!byFile.has(todo.file)) byFile.set(todo.file, []);
    byFile.get(todo.file).push(todo);
  }

  for (const [file, todos] of byFile) {
    const rel = path.relative(repoRoot, file);
    console.log(c.bold(c.cyan(`  ${rel}`)));

    for (const todo of todos) {
      const location = c.dim(`${todo.line}:${todo.column}`);
      const text     = c.yellow(todo.text);
      console.log(`    ${location}  ${text}`);
    }

    console.log(); // blank line between files
  }

  const fileCount = byFile.size;
  const todoCount = allTodos.length;
  const summary   = `  Found ${c.bold(c.red(String(todoCount)))} TODO${todoCount === 1 ? '' : 's'} `
                  + `across ${c.bold(String(fileCount))} file${fileCount === 1 ? '' : 's'}.\n`;
  console.log(summary);

  process.exit(0);
}

main();
