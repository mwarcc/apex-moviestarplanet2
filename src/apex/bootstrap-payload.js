  // ─── Bootstrapped payload ─────────────────────────────────────────────────
  // bson.bundle.js runs immediately before us in the MAIN world and parks
  // itself on `window.BSON`. We capture it locally and then shadow the global
  // with a non-configurable, non-enumerable property that always returns
  // `undefined`, so the value is never accessible from page code regardless
  // of when it probes the window object.
  //
  // homes.json / questions.json arrive asynchronously from the isolated
  // bootstrap via window.postMessage (keyed on a random hex string regenerated
  // every page load). The listener is installed below, and the data is
  // applied as soon as it lands.
  const _BSON = window.BSON ?? null;
  // A non-configurable accessor descriptor is itself a fingerprintable
  // trace; prefer a plain delete and only fall back if the property is
  // somehow non-configurable on this host.
  try { delete window.BSON; } catch { /* non-configurable */ }
  if ('BSON' in window) {
    try { window.BSON = undefined; } catch { /* read-only — give up */ }
  }

  const _AX = { nonce: '', homes: [], questions: {} };

  // ─── Glitched Homes ───────────────────────────────────────────────────────
  // Populated by the isolated bootstrap; until that message lands the array
  // stays empty (UI re-renders when it arrives).
  // Each entry: { name: string, img: string, bson_data: base64-string }
  const HOMES_DB = [];

  // Heuristic listener: the bootstrap posts an object with exactly one own
  // property whose key is a 32-char hex string and whose value carries the
  // expected shape. Nothing about this listener fingerprints us — there's no
  // fixed message name, type field, or sender marker.
  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || typeof d !== 'object') return;
    const keys = Object.keys(d);
    if (keys.length !== 1) return;
    const k = keys[0];
    if (!/^[a-f0-9]{32}$/.test(k)) return;
    const payload = d[k];
    if (!payload || typeof payload !== 'object') return;
    if (!Array.isArray(payload.homes) || typeof payload.questions !== 'object') return;
    if (_AX.nonce) return; // already initialised; ignore stray re-posts
    _AX.nonce = typeof payload.nonce === 'string' ? payload.nonce : k;
    _AX.questions = payload.questions || {};
    // Hydrate the quiz knowledge base from questions.json.
    try { Object.assign(QUESTIONS_DB, _AX.questions); } catch { /* ignore */ }
    HOMES_DB.length = 0;
    for (const h of payload.homes) {
      if (h && typeof h.name === 'string') HOMES_DB.push(h);
    }
    try { _refreshHomesDropdown && _refreshHomesDropdown(); } catch { /* UI not built yet */ }
  });

  const GAME_ID  = 'j68d';
  // API_BASE / CDN_BASE are mutable: APEX auto-detects the active region
  // (eu / us) from the first authenticated /experience request and rewrites
  // both bases accordingly. Defaults to EU until the first hit lands.
  let API_BASE = 'https://eu.mspapis.com';
  let CDN_BASE = 'https://ugc-eu.mspcdns.com';
  let API_REGION = null; // 'eu' | 'us' once detected

  // Map an API host -> matching CDN base. Falls back to EU if unknown.
  function _cdnForApiHost(host) {
    if (host === 'us.mspapis.com') return 'https://ugc-us.mspcdns.com';
    return 'https://ugc-eu.mspcdns.com';
  }
  function _setRegionFromUrl(url) {
    try {
      const u = new URL(url);
      const host = u.host.toLowerCase();
      if (host !== 'eu.mspapis.com' && host !== 'us.mspapis.com') return;
      const nextApi = `${u.protocol}//${host}`;
      const nextRegion = host.startsWith('us.') ? 'us' : 'eu';
      if (API_REGION === nextRegion) return;
      API_BASE = nextApi;
      CDN_BASE = _cdnForApiHost(host);
      API_REGION = nextRegion;
    } catch { /* ignore malformed URL */ }
  }

  const SOFT_HYPHEN = '\u00AD';

  const PET_IDS = [
    'f922447a43434c1f9e65ebdae0f3c194', '5e2e86fda70b486986ab370a60ab5641',
    'e80ab1526b0d4bd88c8d23619234969e', '5ad1d1732a184c7db2c7d90826f75b02',
    '953b2a98ee024bfeaa68697ba60a280e', 'cf7bc982a67b46ec99f231169b00fd65',
    '66ff8292c1fa4d4892651c7da43af50c', '882a76f6e7f84ac08820ca103e2628d1',
    'b30198dab5dd44ab89e0aeee8bfb527f', '5d2392e07bff4344836d31d319fb74ce',
  ];

  const QUEST_SKIP = new Set([
    'daily_open_gift_normal', 'daily_open_gift_vip',
    'daily_pet_pets', 'daily_spend_starcoins', 'daily_spend_diamonds',
  ]);

  const QUIZ_EVENT_NAMES = new Set([
    'quiz:chal', 'quiz:init', 'quiz:answer', 'quiz:result',
    'quiz:start', 'quiz:end', 'quiz:score', 'quiz:question',
    'game:state', 'game:start', 'game:end',
  ]);

  const MAX_PNG_BYTES   = 60_000;
  const AVATAR_SIZE     = 256;
  const PNG_SIG         = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const PNG_CRITICAL    = new Set(['IHDR', 'PLTE', 'IDAT', 'tRNS', 'IEND']);

  const PNG_SKIP_FROM_TEMPLATE = new Set([
    'IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND',
    'iCCP', 'sRGB', 'gAMA', 'cHRM', 'sBIT',
    'bKGD', 'hIST', 'tEXt', 'zTXt', 'iTXt', 'tIME',
  ]);

  const ORIGINAL_PRICES = {
    '6050':  '13,99 €',
    '14050': '39,99 €',
    '42050': '77,99 €',
    '42010': '77,99 €',
  };

  const TARGET_OFFER_IDS = new Set(['1002', '6050', '14050', '42010', '42050']);

