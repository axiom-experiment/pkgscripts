// ANSI color codes
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';
const WHITE  = '\x1b[37m';
const YELLOW = '\x1b[33m';
const BOLD_CYAN  = '\x1b[1;36m';
const BOLD_GREEN = '\x1b[1;32m';

const COL_NAME_W = 25;
const COL_DESC_W = 40;
const COL_CMD_W  = 40;

/**
 * Returns the visible (non-ANSI) length of a string.
 */
function visibleLength(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/**
 * Pads str to `width` visible characters by appending spaces.
 * Correctly handles strings that contain ANSI escape codes.
 */
function padEnd(str, width) {
  const visible = visibleLength(str);
  const padding = Math.max(0, width - visible);
  return str + ' '.repeat(padding);
}

/**
 * Truncates a plain string to maxLen characters, appending '…' if needed.
 */
function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}

/**
 * Builds a single table data row.
 */
function buildRow(nameCell, descCell, cmdCell) {
  return `\u2502 ${nameCell} \u2502 ${descCell} \u2502 ${cmdCell} \u2502\n`;
}

function topBorder() {
  return `\u250c${'─'.repeat(COL_NAME_W + 2)}\u252c${'─'.repeat(COL_DESC_W + 2)}\u252c${'─'.repeat(COL_CMD_W + 2)}\u2510\n`;
}

function midBorder() {
  return `\u251c${'─'.repeat(COL_NAME_W + 2)}\u253c${'─'.repeat(COL_DESC_W + 2)}\u253c${'─'.repeat(COL_CMD_W + 2)}\u2524\n`;
}

function bottomBorder() {
  return `\u2514${'─'.repeat(COL_NAME_W + 2)}\u2534${'─'.repeat(COL_DESC_W + 2)}\u2534${'─'.repeat(COL_CMD_W + 2)}\u2518\n`;
}

/**
 * Builds a header row.
 */
function buildHeaderRow() {
  const hName = padEnd(BOLD_GREEN + 'Name' + RESET, COL_NAME_W);
  const hDesc = padEnd(BOLD_GREEN + 'Description' + RESET, COL_DESC_W);
  const hCmd  = padEnd(BOLD_GREEN + 'Command' + RESET, COL_CMD_W);
  return buildRow(hName, hDesc, hCmd);
}

/**
 * Renders a formatted ASCII box table of scripts.
 * Returns a string.
 */
export function renderTable(scripts) {
  if (!scripts || scripts.length === 0) {
    return renderEmpty();
  }

  let out = '';
  out += topBorder();
  out += buildHeaderRow();
  out += midBorder();

  for (const script of scripts) {
    const rawName = truncate(script.name, COL_NAME_W);
    const rawCmd  = truncate(script.command, COL_CMD_W);
    const rawDesc = truncate(script.description, COL_DESC_W);

    const nameCell = padEnd(BOLD_CYAN + rawName + RESET, COL_NAME_W);
    const descCell = rawDesc
      ? padEnd(WHITE + rawDesc + RESET, COL_DESC_W)
      : padEnd(DIM + '\u2014' + RESET, COL_DESC_W);
    const cmdCell  = padEnd(DIM + rawCmd + RESET, COL_CMD_W);

    out += buildRow(nameCell, descCell, cmdCell);
  }

  out += bottomBorder();
  return out;
}

/**
 * Returns a message when no scripts are found.
 */
export function renderEmpty() {
  return `${YELLOW}No scripts found in package.json.${RESET}\nRun ${BOLD}pkgscripts init${RESET} after adding scripts to your package.json.\n`;
}

/**
 * Highlights all occurrences of searchTerm in text (case-insensitive).
 */
function highlight(text, searchTerm) {
  if (!text || !searchTerm) return text;
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return text.replace(regex, (match) => YELLOW + match + RESET);
}

/**
 * Renders table with the matching search term highlighted in yellow.
 * Internally filters scripts to only those matching the term.
 * Case-insensitive.
 */
export function renderSearch(scripts, term) {
  const lower = term ? term.toLowerCase() : '';
  const filtered = (scripts || []).filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      (s.description && s.description.toLowerCase().includes(lower))
  );

  if (filtered.length === 0) {
    return `${YELLOW}No scripts match "${term}".${RESET}\nTry a different search term.\n`;
  }

  let out = '';
  out += topBorder();
  out += buildHeaderRow();
  out += midBorder();

  for (const script of filtered) {
    const rawName = truncate(script.name, COL_NAME_W);
    const rawCmd  = truncate(script.command, COL_CMD_W);
    const rawDesc = truncate(script.description, COL_DESC_W);

    const hlName = highlight(rawName, term);
    const hlCmd  = highlight(rawCmd, term);
    const hlDesc = rawDesc ? highlight(rawDesc, term) : '';

    const nameCell = padEnd(BOLD_CYAN + hlName + RESET, COL_NAME_W);
    const descCell = hlDesc
      ? padEnd(WHITE + hlDesc + RESET, COL_DESC_W)
      : padEnd(DIM + '\u2014' + RESET, COL_DESC_W);
    const cmdCell  = padEnd(DIM + hlCmd + RESET, COL_CMD_W);

    out += buildRow(nameCell, descCell, cmdCell);
  }

  out += bottomBorder();
  return out;
}
