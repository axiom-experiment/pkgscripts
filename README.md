# pkgscripts

[![npm version](https://img.shields.io/npm/v/pkgscripts.svg)](https://www.npmjs.com/package/pkgscripts)
[![npm downloads](https://img.shields.io/npm/dm/pkgscripts.svg)](https://www.npmjs.com/package/pkgscripts)
[![license](https://img.shields.io/npm/l/pkgscripts.svg)](LICENSE)
[![node version](https://img.shields.io/node/v/pkgscripts.svg)](https://nodejs.org)

**Annotate, search, and run npm scripts with a beautiful CLI — no more mystery commands in package.json.**

---

## Features

- 📋 **List all scripts** in a formatted, color-coded table
- 🔍 **Search scripts** by name or description with highlighted results
- 🏷️ **Annotate scripts** with human-readable descriptions (stored separately, never modifies package.json)
- ▶️ **Run scripts** directly from the CLI
- 🚀 **Init command** to scaffold a `package.scripts.json` for your project in seconds
- 🎨 **Beautiful output** with box-drawing characters and ANSI colors
- 📦 **Zero dependencies** — pure Node.js built-ins only
- ⚡ **Works anywhere** — auto-discovers `package.json` by walking up the directory tree

---

## Why pkgscripts?

Every project accumulates a graveyard of npm scripts nobody understands.

```json
"scripts": {
  "build": "cross-env NODE_ENV=production webpack --config config/webpack.prod.js",
  "build:analyze": "ANALYZE=1 npm run build",
  "precommit": "lint-staged && npm test",
  "ci:coverage": "c8 --reporter=lcov npm test && codecov"
}
```

Six months later: *What does `precommit` actually do? Is `build:analyze` safe to run locally? Why are there three build scripts?*

`pkgscripts` solves this by letting you annotate scripts in a companion file (`package.scripts.json`) and surfacing everything in a readable table — without touching `package.json`.

---

## Installation

```bash
npm install -g pkgscripts
```

---

## Usage

### `pkgscripts list` (or just `pkgscripts`)

Lists all scripts in a formatted table.

```bash
pkgscripts
```

```
┌───────────────────────────┬──────────────────────────────────────────┬──────────────────────────────────────────┐
│ Name                      │ Description                              │ Command                                  │
├───────────────────────────┼──────────────────────────────────────────┼──────────────────────────────────────────┤
│ build                     │ Compile TypeScript to dist/              │ tsc --outDir dist                        │
│ build:analyze             │ Bundle with size analysis                │ ANALYZE=1 npm run build                  │
│ ci:coverage               │ Coverage report for CI                   │ c8 --reporter=lcov npm test && codecov   │
│ lint                      │ —                                        │ eslint src/                              │
│ precommit                 │ Pre-commit hook: lint + test             │ lint-staged && npm test                  │
│ test                      │ Run all unit tests                       │ node --test test/*.test.js               │
└───────────────────────────┴──────────────────────────────────────────┴──────────────────────────────────────────┘
```

### `pkgscripts annotate <name> "<description>"`

Adds or updates a description for a script.

```bash
pkgscripts annotate build "Compile TypeScript to dist/"
pkgscripts annotate precommit "Pre-commit hook: runs lint-staged then test suite"
```

Annotations are saved to `package.scripts.json` — never to `package.json`.

### `pkgscripts init`

Scaffolds a `package.scripts.json` with empty entries for all current scripts. Run this once per project to get started.

```bash
pkgscripts init
# ✓ Created/updated package.scripts.json with 6 new entries.
# Edit package.scripts.json to add descriptions, then run pkgscripts list.
```

### `pkgscripts search <term>`

Fuzzy-searches scripts by name or description. Matches are highlighted in yellow.

```bash
pkgscripts search build
pkgscripts search "coverage"
```

### `pkgscripts run <name>`

Runs a named npm script.

```bash
pkgscripts run build
# ▶ Running npm run build
```

### `pkgscripts --help`

```bash
pkgscripts --help
pkgscripts -h
```

### `pkgscripts --version`

```bash
pkgscripts --version
pkgscripts -v
```

---

## `package.scripts.json` Format

Annotations are stored in a `package.scripts.json` file alongside your `package.json`. The format is a simple JSON object mapping script names to description strings.

**Example `package.scripts.json`:**

```json
{
  "build": "Compile TypeScript to dist/ for production",
  "build:analyze": "Run webpack bundle analyzer — opens browser",
  "ci:coverage": "Generate lcov coverage report and push to Codecov",
  "lint": "",
  "precommit": "Pre-commit hook: runs lint-staged then full test suite",
  "test": "Run all unit tests with Node.js built-in test runner"
}
```

- Scripts with an empty string `""` show `—` in the table (unannotated)
- `package.scripts.json` should be committed to version control — it's team documentation
- `pkgscripts init` will never overwrite existing descriptions, only add new empty entries

---

## Directory Detection

`pkgscripts` automatically finds your `package.json` by walking up the directory tree from `cwd`, up to 5 levels. This means it works correctly when run from subdirectories of your project.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and add tests
4. Run tests: `node --test test/*.test.js`
5. Submit a pull request

---

## Sponsoring

If `pkgscripts` saves you time, consider sponsoring on GitHub:
[**github.com/sponsors/yonderzenith**](https://github.com/sponsors/yonderzenith)

Your support helps maintain this project and fund new developer tools from AXIOM.

---

## License

MIT — see [LICENSE](LICENSE) for details.

Built by [AXIOM](https://github.com/yonderzenith) — autonomous software, built to last.
