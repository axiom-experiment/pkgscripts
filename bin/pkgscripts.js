#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

import { findPackageJson, readAnnotations, mergeScripts } from '../lib/reader.js';
import { renderTable, renderSearch } from '../lib/renderer.js';
import { saveAnnotation, initAnnotations, validateScriptExists } from '../lib/annotator.js';

// ── ANSI helpers ─────────────────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

function err(msg) {
  process.stderr.write(`${RED}error:${RESET} ${msg}\n`);
  process.exit(1);
}

function info(msg) {
  process.stdout.write(msg + '\n');
}

// ── Version ───────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgJsonPath = path.join(__dirname, '..', 'package.json');
const selfPkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const VERSION = selfPkg.version;

// ── Help text ─────────────────────────────────────────────────────────────────
const HELP = `
${BOLD}${CYAN}pkgscripts${RESET} v${VERSION} — Annotate, search, and run npm scripts with ease.

${BOLD}Usage:${RESET}
  pkgscripts [list]                   List all scripts in a formatted table
  pkgscripts run <name>               Run a named npm script
  pkgscripts annotate <name> "<desc>" Add or update a script description
  pkgscripts init                     Scaffold package.scripts.json from existing scripts
  pkgscripts search <term>            Search scripts by name or description

${BOLD}Options:${RESET}
  -h, --help      Show this help message
  -v, --version   Print version number

${BOLD}Examples:${RESET}
  pkgscripts
  pkgscripts list
  pkgscripts run build
  pkgscripts annotate build "Compile TypeScript to dist/"
  pkgscripts init
  pkgscripts search test

${DIM}Annotations are stored in package.scripts.json alongside package.json.${RESET}
`;

// ── Main ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const cmd  = args[0];

if (!cmd || cmd === 'list') {
  runList();
} else if (cmd === 'run') {
  runScript(args[1]);
} else if (cmd === 'annotate') {
  runAnnotate(args[1], args.slice(2).join(' '));
} else if (cmd === 'init') {
  runInit();
} else if (cmd === 'search') {
  runSearch(args.slice(1).join(' '));
} else if (cmd === '--help' || cmd === '-h') {
  process.stdout.write(HELP);
  process.exit(0);
} else if (cmd === '--version' || cmd === '-v') {
  process.stdout.write(`pkgscripts v${VERSION}\n`);
  process.exit(0);
} else {
  process.stderr.write(`${RED}error:${RESET} Unknown command: ${BOLD}${cmd}${RESET}\n`);
  process.stdout.write(HELP);
  process.exit(1);
}

// ── Command implementations ───────────────────────────────────────────────────

function loadContext() {
  try {
    const { dir, pkg } = findPackageJson(process.cwd());
    const annotations = readAnnotations(dir);
    const scripts = mergeScripts(pkg, annotations);
    return { dir, pkg, annotations, scripts };
  } catch (e) {
    err(e.message);
  }
}

function runList() {
  const { scripts } = loadContext();
  process.stdout.write(renderTable(scripts));
}

function runScript(name) {
  if (!name) err('Usage: pkgscripts run <script-name>');

  const { scripts } = loadContext();

  if (!validateScriptExists(scripts, name)) {
    err(`Script "${name}" not found in package.json`);
  }

  info(`${GREEN}▶${RESET} Running ${BOLD}npm run ${name}${RESET}\n`);

  const result = spawnSync('npm', ['run', name], {
    stdio: 'inherit',
    shell: true,
  });

  process.exit(result.status ?? 0);
}

function runAnnotate(name, description) {
  if (!name) err('Usage: pkgscripts annotate <script-name> "<description>"');
  if (!description) err('Usage: pkgscripts annotate <script-name> "<description>"');

  const { dir, scripts } = loadContext();

  if (!validateScriptExists(scripts, name)) {
    err(`Script "${name}" not found in package.json. Add it first, then annotate.`);
  }

  saveAnnotation(dir, name, description);
  info(`${GREEN}✓${RESET} Annotated ${BOLD}${CYAN}${name}${RESET}: ${description}`);
}

function runInit() {
  const { dir, scripts } = loadContext();

  if (scripts.length === 0) {
    info(`${YELLOW}No scripts found in package.json.${RESET} Add some scripts first.`);
    process.exit(0);
  }

  const scriptNames = scripts.map((s) => s.name);
  const added = initAnnotations(dir, scriptNames);

  if (added === 0) {
    info(`${YELLOW}All scripts already have entries in package.scripts.json.${RESET} Nothing to do.`);
  } else {
    info(`${GREEN}✓${RESET} Created/updated package.scripts.json with ${BOLD}${added}${RESET} new entr${added === 1 ? 'y' : 'ies'}.`);
    info(`${DIM}Edit package.scripts.json to add descriptions, then run pkgscripts list.${RESET}`);
  }
}

function runSearch(term) {
  if (!term) err('Usage: pkgscripts search <term>');

  const { scripts } = loadContext();
  const lower = term.toLowerCase();

  const filtered = scripts.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      (s.description && s.description.toLowerCase().includes(lower))
  );

  process.stdout.write(renderSearch(filtered, term));
}
