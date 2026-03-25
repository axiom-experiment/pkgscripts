import fs from 'node:fs';
import path from 'node:path';

/**
 * Walks up the directory tree (max 5 levels) looking for package.json.
 * Returns { dir, pkg } or throws if not found.
 */
export function findPackageJson(startDir) {
  let current = path.resolve(startDir);
  const root = path.parse(current).root;

  for (let i = 0; i < 5; i++) {
    const candidate = path.join(current, 'package.json');
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8');
      const pkg = JSON.parse(raw);
      return { dir: current, pkg };
    }
    const parent = path.dirname(current);
    if (parent === current || current === root) {
      break;
    }
    current = parent;
  }

  throw new Error(`No package.json found starting from: ${startDir} (searched up to 5 levels)`);
}

/**
 * Reads package.scripts.json from pkgDir if it exists.
 * Returns parsed object or {} if not found.
 */
export function readAnnotations(pkgDir) {
  const annotationsPath = path.join(pkgDir, 'package.scripts.json');
  if (!fs.existsSync(annotationsPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(annotationsPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Merges scripts from package.json with annotations from package.scripts.json.
 * Returns array of { name, command, description } sorted alphabetically by name.
 * description is '' (empty string) for unannotated scripts.
 */
export function mergeScripts(pkg, annotations) {
  const scripts = pkg.scripts || {};
  const result = [];

  for (const [name, command] of Object.entries(scripts)) {
    result.push({
      name,
      command: command || '',
      description: annotations[name] || '',
    });
  }

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
