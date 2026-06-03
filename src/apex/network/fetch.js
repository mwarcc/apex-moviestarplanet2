  // ─── Fetch intercept ──────────────────────────────────────────────────────

  // Matches POSTs to the REST chat-history endpoint that the game uses for
  // direct messages — both fetch and XHR interceptors use this.
  const HISTORY_RE = /\/gamemessaging\/v[0-9]+\/conversations\/[^/]+\/history(?:[/?]|$)/;

  function _interceptedFetch(...args) {
    const input = args[0];
    const opts  = args[1];

    // Normalise the URL across the (string | Request | URL) input shapes.
    let urlStr = '';
    if (typeof input === 'string') urlStr = input;
    else if (input instanceof Request) urlStr = input.url;
    else if (input && typeof input.toString === 'function') urlStr = String(input);

    // Auth / region capture (works for both fetch(string, opts) and
    // fetch(new Request(...)) call shapes).
    if (urlStr) {
      let auth = opts?.headers?.authorization ?? opts?.headers?.Authorization ?? '';
      if (!auth && input instanceof Request) {
        try { auth = input.headers.get('authorization') ?? ''; } catch { /* ignore */ }
      }
      if (auth.startsWith('Bearer ')) {
        if (urlStr.includes('/experience')) { _setRegionFromUrl(urlStr); captureToken(auth.slice(7)); }
        if (urlStr.includes('/gamemessaging/')) {
          try {
            const u = new URL(urlStr);
            capturedMessagingBase = `${u.protocol}//${u.host}`;
          } catch { /* malformed URL */ }
        }
      }
    }

    // ── Chat filter bypass for the REST history endpoint ────────────────
    // POST https://eu.mspapis.com/gamemessaging/v1/conversations/<n>/history
    // body: {"Author":"...","MessageType":"ChatMessageV2","MessageBody":"..."}
    // Inject a soft hyphen between every character of MessageBody so the
    // word filter can't tokenise it. Handles both fetch(url, opts) and
    // fetch(new Request(...)) call shapes.
    const method = (opts?.method ?? (input instanceof Request ? input.method : '') ?? 'GET').toUpperCase();
    if (state.misc.chatFilterBypass && method === 'POST' && urlStr && HISTORY_RE.test(urlStr)) {
      if (input instanceof Request) {
        // Request body has to be read asynchronously; rebuild a fresh
        // Request with the mutated body and dispatch that instead.
        const self = this;
        return input.clone().text().then(bodyText => {
          try {
            const parsed = JSON.parse(bodyText);
            if (parsed && parsed.MessageType === 'ChatMessageV2' && typeof parsed.MessageBody === 'string') {
              parsed.MessageBody = insertSoftHyphens(parsed.MessageBody);
              const newReq = new Request(input, { body: JSON.stringify(parsed), method: 'POST' });
              return _nativeFetch.call(self, newReq);
            }
          } catch { /* not JSON — pass through */ }
          return _nativeFetch.call(self, input);
        }).catch(() => _nativeFetch.call(self, input));
      } else if (typeof opts?.body === 'string') {
        try {
          const parsed = JSON.parse(opts.body);
          if (parsed && parsed.MessageType === 'ChatMessageV2' && typeof parsed.MessageBody === 'string') {
            parsed.MessageBody = insertSoftHyphens(parsed.MessageBody);
            args[1] = { ...opts, body: JSON.stringify(parsed) };
          }
        } catch { /* not JSON — leave the request alone */ }
      }
    }

  const _prom = _nativeFetch.apply(this, args);
  _prom.then(res => {
    try {
      const endpoint = urlStr || (typeof input === 'string' ? input : (input?.url ?? String(input)));
      // Flag 429 (rate-limited/detected) and 404 (probing detected) immediately
      if (res.status === 429 || res.status === 404) {
        _addTraceLog(`[${res.status}] ${endpoint}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        res.clone().json().then(data => {
          if (data && typeof data === 'object' && 'TraceId' in data) {
            _addTraceLog(`[traceId] ${endpoint}`);
          }
          // Auto-Liker: detect profile attributes fetches with a WAYD
          const amatch = endpoint.match(/\/profileattributes\/v1\/profiles\/([a-f0-9]+)\/games\/j68d\/attributes/);
          const m2 = (opts?.method ?? (input instanceof Request ? input.method : '') ?? 'GET').toUpperCase();
          if (amatch && m2 === 'GET') {
            _maybeAutoLike(amatch[1], data);
          }
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  }).catch(() => {});
  return _prom;
  }

  makeNativeToString(_interceptedFetch, _nativeFetch);

  // Replace via defineProperty so it survives simple overwrites and looks
  // clean. Fall back to a plain assignment, but tolerate the (strict-mode)
  // TypeError that happens when the page has locked fetch as non-writable —
  // we'd rather lose interception than crash the whole script.
  try {
    Object.defineProperty(window, 'fetch', {
      value: _interceptedFetch,
      writable: true,
      configurable: true,
    });
  } catch {
    try { window.fetch = _interceptedFetch; } catch { /* read-only fetch — skip */ }
  }

