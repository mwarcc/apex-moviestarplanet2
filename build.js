/**
 * build.js — Apex MSP2 Extension bundler
 *
 * Concatenates all source modules in the correct order, wraps the result
 * in the IIFE that the extension expects, and minifies the output with
 * Terser. The `dist/` directory is populated with the files that the
 * Service Worker registers as content scripts.
 *
 * Usage:
 *   node build.js          # production (minified)
 *   node build.js --dev    # development (unminified, readable)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Source modules (concatenated in this exact order) ─────────────────────
// Every file is a plain JS fragment that contributes to the shared IIFE
// scope. No ES module import/export syntax is used — all variables and
// functions are scoped inside the top-level IIFE added by this script.

const SOURCE_FILES = [
  // Core constants & game configuration
  'src/apex/constants.js',

  // Bootstrap payload handler (homes.json / questions.json message listener)
  'src/apex/bootstrap-payload.js',

  // Per-session random DOM identifiers & shadow-DOM host
  'src/apex/session-ids.js',

  // Persistent preferences (localStorage)
  'src/apex/prefs.js',

  // Global state object
  'src/apex/state.js',

  // Cleaner console (noise filter)
  'src/apex/console-filter.js',

  // Anti-detection helpers & native references
  'src/apex/stealth.js',

  // Network intercepts
  'src/apex/network/fetch.js',
  'src/apex/network/xhr.js',

  // JWT / token capture & region detection
  'src/apex/token.js',

  // Utility functions (sf, wait, traceLog…)
  'src/apex/utils.js',

  // Autographer helper functions
  'src/apex/autographer/helpers.js',

  // Auto-liker queue & processor
  'src/apex/auto-liker.js',

  // PNG codec (parse, build, strip metadata, apply MSP template)
  'src/apex/png.js',

  // WebSocket intercept + quiz message handler
  'src/apex/network/websocket.js',

  // Chatroom roster, feed helpers & player-experience logic
  'src/apex/chatroom/roster.js',
  'src/apex/chatroom/player-xp.js',

  // REST API layer + BSON encoding
  'src/apex/api.js',

  // Social/GraphQL queries + profile & reward helpers
  'src/apex/social.js',

  // ── Feature implementations ───────────────────────────────────────────
  'src/apex/features/operations.js',
  'src/apex/features/restore-status.js',
  'src/apex/features/homes.js',

  'src/apex/autographer/ops.js',
  'src/apex/autographer/floating-menu.js',

  'src/apex/features/avatar-upload.js',
  'src/apex/features/packages.js',

  // ── UI system ─────────────────────────────────────────────────────────
  'src/apex/ui/theme.js',
  'src/apex/ui/dom.js',
  'src/apex/ui/components.js',
  'src/apex/ui/speed-gear.js',
  'src/apex/ui/settings.js',

  // ── Menu panels & panes ───────────────────────────────────────────────
  'src/apex/menu/builder.js',
  'src/apex/menu/chatroom.js',
  'src/apex/menu/player-popover.js',
  'src/apex/menu/autographer-panel.js',
  'src/apex/menu/tabs.js',

  // Toast notification system
  'src/apex/ui/toast.js',

  // DOM-ready bootstrap (calls createUI)
  'src/apex/bootstrap-init.js',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROOT    = __dirname;
const DIST    = path.join(ROOT, 'dist');
const isDev   = process.argv.includes('--dev');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readSource(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    console.error(`  MISSING: ${file}`);
    process.exit(1);
  }
  return fs.readFileSync(full, 'utf8');
}

// ─── Bundle apex.js ─────────────────────────────────────────────────────────

async function buildApex() {
  console.log('Building apex.js…');

  // Concatenate all source fragments
  const inner = SOURCE_FILES.map(f => {
    const src = readSource(f);
    return `\n// ── ${f} ──\n${src}`;
  }).join('');

  // Wrap in the same IIFE the extension expects
  const bundle = `(function () {\n  'use strict';\n${inner}\n})();\n`;

  ensureDir(DIST);

  if (isDev) {
    // Development: write unminified (keeps comments, readable)
    fs.writeFileSync(path.join(DIST, 'apex.js'), bundle, 'utf8');
    console.log(`  apex.js  (dev / unminified)  ${(bundle.length / 1024).toFixed(1)} kB`);
  } else {
    // Production: minify with Terser
    const { minify } = require('terser');
    const result = await minify(bundle, {
      compress: {
        passes:       3,
        drop_console: false,   // keep console calls (used intentionally)
        keep_fargs:   false,
      },
      mangle: {
        // Don't mangle property names — the extension accesses DOM APIs and
        // game-API JSON keys directly by name.
        properties: false,
      },
      format: {
        comments: false,
      },
    });

    if (result.code == null) {
      console.error('  Terser returned no output — aborting.');
      process.exit(1);
    }

    fs.writeFileSync(path.join(DIST, 'apex.js'), result.code, 'utf8');
    const inKb  = (bundle.length   / 1024).toFixed(1);
    const outKb = (result.code.length / 1024).toFixed(1);
    console.log(`  apex.js  ${inKb} kB  →  ${outKb} kB  (minified)`);
  }
}

// ─── Copy bootstrap.js ──────────────────────────────────────────────────────

function copyBootstrap() {
  console.log('Copying bootstrap.js…');
  const src  = path.join(ROOT, 'src', 'bootstrap.js');
  const dest = path.join(DIST, 'bootstrap.js');

  if (!fs.existsSync(src)) {
    console.error('  MISSING: src/bootstrap.js');
    process.exit(1);
  }

  ensureDir(DIST);
  fs.copyFileSync(src, dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  bootstrap.js  ${size} kB`);
}

// ─── Copy assets ────────────────────────────────────────────────────────────

function copyAssets() {
  console.log('Copying assets…');
  const assets = ['homes.json', 'questions.json', 'bson.bundle.js'];
  for (const name of assets) {
    const src  = path.join(ROOT, 'assets', name);
    const dest = path.join(DIST, name);
    if (!fs.existsSync(src)) {
      console.error(`  MISSING: assets/${name}`);
      process.exit(1);
    }
    fs.copyFileSync(src, dest);
    console.log(`  ${name}`);
  }
}

// ─── Copy extension root files ───────────────────────────────────────────────

function copyExtensionFiles() {
  console.log('Copying extension root files…');
  const files = ['manifest.json', 'sw.js'];
  for (const name of files) {
    const src  = path.join(ROOT, name);
    const dest = path.join(DIST, name);
    if (!fs.existsSync(src)) {
      console.error(`  MISSING: ${name}`);
      process.exit(1);
    }
    fs.copyFileSync(src, dest);
    console.log(`  ${name}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

(async () => {
  const t = Date.now();
  console.log(`\nApex MSP2 — ${isDev ? 'development' : 'production'} build\n`);

  try {
    await buildApex();
    copyBootstrap();
    copyAssets();
    copyExtensionFiles();
  } catch (err) {
    console.error('\nBuild failed:', err.message ?? err);
    process.exit(1);
  }

  console.log(`\nDone in ${Date.now() - t} ms`);
  console.log('Output → dist/\n');
})();
