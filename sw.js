// ─── Service Worker ───────────────────────────────────────────────────────
// Registers content scripts dynamically (no static entries in the manifest,
// no web_accessible_resources) and serves homes.json / questions.json to the
// isolated-world bootstrap on demand.
//
// Two content scripts are registered:
//   • apex-iso  → bootstrap.js, ISOLATED world, document_start
//                 (fetches data from the SW and forwards it to MAIN)
//   • apex-main → bson.bundle.js + apex.js, MAIN world, document_start
//                 (runs synchronously before the page can lock window.fetch
//                  or otherwise harden the environment).

const HOST_MATCH = 'https://moviestarplanet2.com/*';
const ID_ISO  = 'apex-iso';
const ID_MAIN = 'apex-main';

async function registerAll() {
  // Unregister any previous variants so we always reflect the latest config.
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [ID_ISO, ID_MAIN] });
    if (existing && existing.length) {
      await chrome.scripting.unregisterContentScripts({
        ids: existing.map(s => s.id),
      });
    }
  } catch { /* nothing to clean up */ }

  try {
    await chrome.scripting.registerContentScripts([
      {
        id: ID_MAIN,
        matches: [HOST_MATCH],
        js: ['bson.bundle.js', 'apex.js'],
        runAt: 'document_start',
        allFrames: true,
        persistAcrossSessions: true,
        world: 'MAIN',
      },
      {
        id: ID_ISO,
        matches: [HOST_MATCH],
        js: ['bootstrap.js'],
        runAt: 'document_start',
        allFrames: true,
        persistAcrossSessions: true,
        // ISOLATED (default) — bootstrap talks to the SW and the MAIN world
        // through window.postMessage.
      },
    ]);
  } catch {
    // Already registered or transient error — fail soft.
  }
}

chrome.runtime.onInstalled.addListener(registerAll);
chrome.runtime.onStartup.addListener(registerAll);
// Also try once at SW startup so a freshly-installed session that didn't
// trigger onInstalled (e.g. on `chrome.runtime.reload()`) still ends up
// registered.
registerAll();

async function _readJSON(name) {
  try {
    const res = await fetch(chrome.runtime.getURL(name));
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Bundle homes.json + questions.json into a single response — the bootstrap
// reads everything in a single round-trip.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'apex:bootstrap') return false;
  (async () => {
    try {
      const [homes, questions] = await Promise.all([
        _readJSON('homes.json'),
        _readJSON('questions.json'),
      ]);
      sendResponse({
        ok: true,
        homes: Array.isArray(homes) ? homes : [],
        questions: (questions && typeof questions === 'object') ? questions : {},
      });
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message ?? err) });
    }
  })();
  return true; // async response
});
