import fs from 'node:fs';
import path from 'node:path';

const ANNOTATIONS_FILE = 'package.scripts.json';

/**
 * Reads existing package.scripts.json from pkgDir, or returns {}.
 */
function readExisting(pkgDir) {
  const filePath = path.join(pkgDir, ANNOTATIONS_FILE);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves package.scripts.json with 2-space indent.
 */
function writeAnnotations(pkgDir, data) {
  const filePath = path.join(pkgDir, ANNOTATIONS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Adds or updates the description for scriptName in package.scripts.json.
 * Returns the updated annotations object.
 */
export function saveAnnotation(pkgDir, scriptName, description) {
  const existing = readExisting(pkgDir);
  existing[scriptName] = description;
  writeAnnotations(pkgDir, existing);
  return existing;
}

/**
 * Creates or updates package.scripts.json with empty ('') descriptions
 * for all script names that don't already have entries.
 * Returns the count of new entries added.
 */
export function initAnnotations(pkgDir, scripts) {
  const existing = readExisting(pkgDir);
  let added = 0;

  for (const scriptName of scripts) {
    if (!(scriptName in existing)) {
      existing[scriptName] = '';
      added++;
    }
  }

  writeAnnotations(pkgDir, existing);
  return added;
}

/**
 * Returns true if scriptName exists in the scripts array/object.
 * Accepts either an array of { name } objects or a plain object keyed by name.
 */
export function validateScriptExists(scripts, name) {
  if (!scripts || !name) return false;
  if (Array.isArray(scripts)) {
    return scripts.some((s) => s.name === name);
  }
  // plain object (from pkg.scripts)
  return Object.prototype.hasOwnProperty.call(scripts, name);
}
