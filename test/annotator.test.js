import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { saveAnnotation, initAnnotations, validateScriptExists } from '../lib/annotator.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pkgscripts-annotator-'));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function readJson(dir, filename) {
  return JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf8'));
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('saveAnnotation', () => {
  test('1. creates package.scripts.json if it doesn\'t exist', () => {
    const tmp = makeTmpDir();
    try {
      saveAnnotation(tmp, 'build', 'Compile TypeScript');
      const filePath = path.join(tmp, 'package.scripts.json');
      assert.ok(fs.existsSync(filePath), 'file should be created');
      const data = readJson(tmp, 'package.scripts.json');
      assert.equal(data.build, 'Compile TypeScript');
    } finally {
      cleanup(tmp);
    }
  });

  test('2. updates existing annotation', () => {
    const tmp = makeTmpDir();
    try {
      saveAnnotation(tmp, 'build', 'First description');
      saveAnnotation(tmp, 'build', 'Updated description');
      const data = readJson(tmp, 'package.scripts.json');
      assert.equal(data.build, 'Updated description');
    } finally {
      cleanup(tmp);
    }
  });

  test('3. preserves other annotations when updating one', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, 'package.scripts.json'),
        JSON.stringify({ test: 'Run tests', lint: 'Lint code' }, null, 2),
        'utf8'
      );
      saveAnnotation(tmp, 'build', 'New build description');
      const data = readJson(tmp, 'package.scripts.json');
      assert.equal(data.test, 'Run tests');
      assert.equal(data.lint, 'Lint code');
      assert.equal(data.build, 'New build description');
    } finally {
      cleanup(tmp);
    }
  });

  test('4. returns the updated object', () => {
    const tmp = makeTmpDir();
    try {
      const result = saveAnnotation(tmp, 'deploy', 'Deploy to production');
      assert.equal(typeof result, 'object');
      assert.equal(result.deploy, 'Deploy to production');
    } finally {
      cleanup(tmp);
    }
  });

  test('writes file with 2-space indent', () => {
    const tmp = makeTmpDir();
    try {
      saveAnnotation(tmp, 'start', 'Start the server');
      const raw = fs.readFileSync(path.join(tmp, 'package.scripts.json'), 'utf8');
      // Should contain 2-space indentation
      assert.ok(raw.includes('  "start"'), 'should use 2-space indent');
    } finally {
      cleanup(tmp);
    }
  });
});

describe('initAnnotations', () => {
  test('5. creates file with all script names', () => {
    const tmp = makeTmpDir();
    try {
      const scripts = ['build', 'test', 'lint', 'start'];
      initAnnotations(tmp, scripts);
      const data = readJson(tmp, 'package.scripts.json');
      for (const name of scripts) {
        assert.ok(name in data, `"${name}" should be in annotations`);
      }
    } finally {
      cleanup(tmp);
    }
  });

  test('6. doesn\'t overwrite existing annotations', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, 'package.scripts.json'),
        JSON.stringify({ build: 'Existing build description' }, null, 2),
        'utf8'
      );
      initAnnotations(tmp, ['build', 'test']);
      const data = readJson(tmp, 'package.scripts.json');
      assert.equal(data.build, 'Existing build description', 'existing annotation should be preserved');
      assert.equal(data.test, '', 'new annotation should be empty string');
    } finally {
      cleanup(tmp);
    }
  });

  test('7. returns count of new entries added', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, 'package.scripts.json'),
        JSON.stringify({ existing: 'already here' }, null, 2),
        'utf8'
      );
      const count = initAnnotations(tmp, ['existing', 'new1', 'new2']);
      assert.equal(count, 2, 'should return 2 for two new entries');
    } finally {
      cleanup(tmp);
    }
  });

  test('returns 0 when all scripts already annotated', () => {
    const tmp = makeTmpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, 'package.scripts.json'),
        JSON.stringify({ build: 'desc', test: 'desc' }, null, 2),
        'utf8'
      );
      const count = initAnnotations(tmp, ['build', 'test']);
      assert.equal(count, 0);
    } finally {
      cleanup(tmp);
    }
  });

  test('new entries have empty string value', () => {
    const tmp = makeTmpDir();
    try {
      initAnnotations(tmp, ['newscript']);
      const data = readJson(tmp, 'package.scripts.json');
      assert.equal(data.newscript, '');
    } finally {
      cleanup(tmp);
    }
  });
});

describe('validateScriptExists', () => {
  test('8. returns true/false correctly for array of script objects', () => {
    const scripts = [
      { name: 'build', command: 'tsc', description: '' },
      { name: 'test',  command: 'node --test', description: '' },
    ];

    assert.equal(validateScriptExists(scripts, 'build'), true);
    assert.equal(validateScriptExists(scripts, 'test'),  true);
    assert.equal(validateScriptExists(scripts, 'notexist'), false);
  });

  test('returns false for null/undefined inputs', () => {
    assert.equal(validateScriptExists(null, 'build'), false);
    assert.equal(validateScriptExists([], null), false);
    assert.equal(validateScriptExists(undefined, 'build'), false);
  });

  test('works with plain object (pkg.scripts)', () => {
    const scripts = { build: 'tsc', test: 'node --test' };
    assert.equal(validateScriptExists(scripts, 'build'), true);
    assert.equal(validateScriptExists(scripts, 'missing'), false);
  });

  test('returns false for empty array', () => {
    assert.equal(validateScriptExists([], 'build'), false);
  });
});
