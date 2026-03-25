import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { renderTable, renderEmpty, renderSearch } from '../lib/renderer.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

const sampleScripts = [
  { name: 'build', command: 'tsc --outDir dist', description: 'Compile TypeScript to dist' },
  { name: 'test',  command: 'node --test test/*.js', description: 'Run unit tests' },
  { name: 'lint',  command: 'eslint src/', description: '' },
];

// ── tests ─────────────────────────────────────────────────────────────────────

describe('renderTable', () => {
  test('1. renderTable returns a string', () => {
    const result = renderTable(sampleScripts);
    assert.equal(typeof result, 'string');
  });

  test('2. renderTable contains all script names', () => {
    const result = stripAnsi(renderTable(sampleScripts));
    assert.ok(result.includes('build'), 'should include "build"');
    assert.ok(result.includes('test'),  'should include "test"');
    assert.ok(result.includes('lint'),  'should include "lint"');
  });

  test('3. renderTable shows header row', () => {
    const result = stripAnsi(renderTable(sampleScripts));
    assert.ok(result.includes('Name'),        'should include "Name" header');
    assert.ok(result.includes('Description'), 'should include "Description" header');
    assert.ok(result.includes('Command'),     'should include "Command" header');
  });

  test('4. renderTable truncates long commands/descriptions', () => {
    const longScripts = [
      {
        name: 'a-very-long-script-name-that-exceeds-the-column-limit',
        command: 'echo "this is a very long command that should definitely be truncated by the renderer"',
        description: 'This is an extremely long description that goes beyond the forty character limit set for descriptions',
      },
    ];
    const result = stripAnsi(renderTable(longScripts));
    // All lines (except borders) should have reasonable length
    const lines = result.split('\n').filter((l) => l.startsWith('│'));
    assert.ok(lines.length > 0, 'should have data rows');
    for (const line of lines) {
      // Visible length should be bounded (table width = 2+25+2 + 1 + 2+40+2 + 1 + 2+40+2 + 1 = 120)
      const visible = stripAnsi(line);
      assert.ok(visible.length <= 130, `Row too long: ${visible.length}`);
    }
    // Should contain the truncation character
    assert.ok(result.includes('…'), 'should contain truncation ellipsis');
  });

  test('5. renderTable handles empty scripts array (returns renderEmpty output)', () => {
    const result = renderTable([]);
    const emptyResult = renderEmpty();
    assert.equal(result, emptyResult);
  });

  test('8. Column alignment: all data rows start and end with │', () => {
    const result = renderTable(sampleScripts);
    const lines = result.split('\n').filter((l) => {
      const plain = stripAnsi(l);
      return plain.startsWith('│');
    });
    assert.ok(lines.length > 0, 'should have pipe-bordered rows');
    for (const line of lines) {
      const plain = stripAnsi(line);
      assert.ok(plain.startsWith('│'), `Row should start with │: "${plain}"`);
      assert.ok(plain.endsWith('│'), `Row should end with │: "${plain}"`);
    }
  });

  test('shows dash for scripts with no description', () => {
    const noDescScripts = [{ name: 'lint', command: 'eslint .', description: '' }];
    const result = stripAnsi(renderTable(noDescScripts));
    assert.ok(result.includes('—'), 'should show em-dash for missing description');
  });

  test('contains box-drawing border characters', () => {
    const result = renderTable(sampleScripts);
    assert.ok(result.includes('┌'), 'should include top-left corner');
    assert.ok(result.includes('┐'), 'should include top-right corner');
    assert.ok(result.includes('└'), 'should include bottom-left corner');
    assert.ok(result.includes('┘'), 'should include bottom-right corner');
    assert.ok(result.includes('├'), 'should include mid-left junction');
  });
});

describe('renderSearch', () => {
  test('6. renderSearch highlights matching term in output', () => {
    const result = renderSearch(sampleScripts, 'build');
    // The ANSI yellow code should appear for the match
    assert.ok(result.includes('\x1b[33m'), 'should contain yellow ANSI highlight');
    const plain = stripAnsi(result);
    assert.ok(plain.includes('build'), 'should include the matched script name');
  });

  test('7. renderSearch is case-insensitive', () => {
    const resultLower = stripAnsi(renderSearch(sampleScripts, 'BUILD'));
    const resultUpper = stripAnsi(renderSearch(sampleScripts, 'build'));
    // Both should show the build script
    assert.ok(resultLower.includes('build'), 'uppercase search should find lowercase match');
    assert.ok(resultUpper.includes('build'), 'lowercase search should find match');
  });

  test('renderSearch returns no-match message when nothing found', () => {
    const result = stripAnsi(renderSearch(sampleScripts, 'xxxxnotfound'));
    assert.ok(result.includes('xxxxnotfound'), 'should mention the search term in no-match message');
  });

  test('renderSearch matches against description as well as name', () => {
    const result = stripAnsi(renderSearch(sampleScripts, 'Compile'));
    assert.ok(result.includes('build'), 'should find "build" script via its description containing "Compile"');
  });
});
