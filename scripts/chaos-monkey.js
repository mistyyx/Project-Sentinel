/**
 * chaos-monkey.js
 *
 * System disruptor for Project Sentinel.
 * Every 5 seconds, randomly flips the system between HEALTHY and CRITICAL.
 * When CRITICAL, a fake error is chosen and written to the error log.
 *
 * Outputs:
 *   /services/status.json  — current system status
 *   /services/error.log    — timestamped log of injected errors
 */

const fs   = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────

const STATUS_FILE = path.resolve(__dirname, '../services/status.json');
const ERROR_LOG   = path.resolve(__dirname, '../services/error.log');

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERVAL_MS = 5000; // How often the monkey strikes (milliseconds)

// The five fake error types the monkey can inject
const ERROR_TYPES = ['SyntaxError', 'TypeMismatch', 'LogicError', 'DependencyError', 'ConfigError'];

// Fake error messages paired to each error type for realistic log output
const ERROR_MESSAGES = {
  SyntaxError:      'Unexpected token "<" at position 42 in response payload.',
  TypeMismatch:     'Expected type "number" but received "string" for field "severity".',
  LogicError:       'Alert deduplication window produced a negative interval (-300ms).',
  DependencyError:  'Package "axios" not found — entry removed from package.json by chaos injection.',
  ConfigError:      'SyntaxError in config.json at position 1: unexpected token "}" — file corrupted by chaos injection.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a random element from an array.
 * @param {Array} arr
 * @returns {*}
 */
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns an ISO-8601 timestamp string for right now.
 * @returns {string}
 */
function now() {
  return new Date().toISOString();
}

/**
 * Writes the system status to /services/status.json.
 * Overwrites the file on every tick so consumers always read current state.
 * @param {'HEALTHY'|'CRITICAL'} status
 * @param {string|null} errorType  - The injected error type, or null if healthy.
 */
function writeStatus(status, errorType = null) {
  const payload = {
    status,
    updatedAt: now(),
    activeError: errorType, // null when healthy, error type string when critical
  };

  fs.writeFileSync(STATUS_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

/**
 * Appends a single timestamped error entry to /services/error.log.
 * Each line follows the format:
 *   [ISO_TIMESTAMP] [ERROR_TYPE] message
 * @param {string} errorType
 */
function appendErrorLog(errorType) {
  const message = ERROR_MESSAGES[errorType];
  const line    = `[${now()}] [${errorType}] ${message}\n`;

  // Append so the log accumulates a full history across runs
  fs.appendFileSync(ERROR_LOG, line, 'utf8');
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * One tick of the chaos monkey.
 * Flips a coin: 50% chance of staying HEALTHY, 50% chance of going CRITICAL.
 */
function tick() {
  const isCritical = Math.random() < 0.5;

  if (isCritical) {
    // Pick a random error type and inject it
    const errorType = randomFrom(ERROR_TYPES);

    writeStatus('CRITICAL', errorType);
    appendErrorLog(errorType);

    console.log(`[${now()}] 💥 CRITICAL — ${errorType}: ${ERROR_MESSAGES[errorType]}`);
  } else {
    // System is fine this tick — clear any active error
    writeStatus('HEALTHY', null);

    console.log(`[${now()}] ✅ HEALTHY — no faults injected.`);
  }
}

// ─── Initialisation ───────────────────────────────────────────────────────────

// Ensure the /services directory exists before writing any files
fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });

// Write an initial HEALTHY state so the status file always exists from the start
writeStatus('HEALTHY', null);
console.log(`[${now()}] Chaos Monkey started. Interval: ${INTERVAL_MS / 1000}s`);
console.log(`  Status file : ${STATUS_FILE}`);
console.log(`  Error log   : ${ERROR_LOG}`);
console.log('─'.repeat(60));

// Run the first tick immediately, then repeat on the interval
tick();
setInterval(tick, INTERVAL_MS);
