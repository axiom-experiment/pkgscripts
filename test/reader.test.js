import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { findPackageJson, readAnnotations, mergeScripts } from '../lib/reader.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pkgscripts-reader-'));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('findPackageJson', () => {
  test('1. returns correct path when package.json exists in cwd', () => {
    const tmp = makeTmpDir();
    try {
      const pkgData = { name: 'test-pkg', version: '1.0.0', scripts: { build: 'tsc' } };
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify(pkgData), 'utf8');

      const result = findPackageJson(tmp);
      assert.equal(result.dir, tmp);
      assert.equal(result.pkg.name, 'test-pkg');
    } finally {
      cleanup(tmp);
    }
  });

  test('2. throws when no package.json found after 5 levels', () => {
    const tmp = makeTmpDir();
    // Create a deeply nested directory with no package.json
    const deep = path.join(tmp, 'a', 'b', 'c', 'd', 'e', 'f');
    fs.mkdirSync(deep, { recursive: true });

    try {
      assert.throws(
        () => findPackageJson(deep),
        (e) => e instanceof Error && e.message.includes('No package.json found')
      );
    } finally {
      cleanup(tmp);
    }
  });

  test('finds package.json in a parent directory', () => {
    const tmp = makeTmpDir();
    try {
      const pkgData = { name: 'parent-pkg', scripts: {} };
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify(pkgData), 'utf8');
      const subdir = path.join(tmp, 'src');
      fs.mkdirSync(subdir);

      const result = findPackageJson(subdir);
      assert.equal(result.dir, tmp);
      assert.equal(result.pkg.name, 'parent-pkg');
    } finally {
      cleanup(tmp);
    }
  });
});

describe('readAnnotations', () => {
  test('3. returns empty object when file doesn\'t exist', () => {
    const tmp = makeTmpDir();
    try {
      const result = readAnnotations(tmp);
      assert.deepEqual(result, {});
    } finally {
      cleanup(tmp);
    }
  });

  test('4. returns parsed object when file exists', () => {
    const tmp = makeTmpDir();
    try {
      const data = { build: 'Compile TypeScript', test: 'Run unit tests' };
      fs.writeFileSync(
        path.join(tmp, 'package.scripts.json'),
        JSON.stringify(data),
        'utf8'
      );

      const result = readAnnotations(tmp);
      assert.deepEqual(result, data);
    } finally {
      cleanup(tmp);
    }
  });

  test('returns empty object when file is malformed JSON', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(path.join(tmp, 'package.scripts.json'), '{ bad json }', 'utf8');
      const result = readAnnotations(tmp);
      assert.deepEqual(result, {});
    } finally {
      cleanup(tmp);
    }
  });
});

describe('mergeScripts', () => {
  test('5. returns empty array when no scripts in package.json', () => {
    const pkg = { name: 'test' };
    const result = mergeScripts(pkg, {});
    assert.deepEqual(result, []);
  });

  test('6. correctly merges scripts with descriptions', () => {
    const pkg = { scripts: { build: 'tsc', test: 'node --test' } };
    const annotations = { build: 'Compile TypeScript', test: 'Run tests' };

    const result = mergeScripts(pkg, annotations);

    assert.equal(result.length, 2);
    const buildScript = result.find((s) => s.name === 'build');
    assert.ok(buildScript);
    assert.equal(buildScript.command, 'tsc');
    assert.equal(buildScript.description, 'Compile TypeScript');
  });

  test('7. returns empty string description for unannotated scripts', () => {
    const pkg = { scripts: { build: 'tsc' } };
    const annotations = {};

    const result = mergeScripts(pkg, annotations);

    assert.equal(result.length, 1);
    assert.equal(result[0].description, '');
  });

  test('8. sorts results alphabetically by name', () => {
    const pkg = {
      scripts: {
        zebra: 'echo z',
        alpha: 'echo a',
        mango: 'echo m',
        banana: 'echo b',
      },
    };

    const result = mergeScripts(pkg, {});
    const names = result.map((s) => s.name);
    assert.deepEqual(names, ['alpha', 'banana', 'mango', 'zebra']);
  });

  test('handles scripts with empty command strings', () => {
    const pkg = { scripts: { empty: '' } };
    const result = mergeScripts(pkg, {});
    assert.equal(result[0].command, '');
  });
});
