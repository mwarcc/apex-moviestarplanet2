  // ─── Randomised DOM identifiers ───────────────────────────────────────────
  // Generated once per session; nothing meaningful is ever written to the DOM.

  const _rand = (n = 8) => { const s = Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b => b.toString(36)).join(''); return /^\d/.test(s) ? 'x' + s : s; };
  const UID = {
    wrap:     _rand(),
    body:     _rand(),
    fonts:    _rand(),
    kf:       _rand(),
    pkgList:  _rand(),
    pkgFloat: _rand(),
    mood:     _rand(),
    status:   _rand(),
    toasts:   _rand(),
    agFloat:  _rand(),
    homes:    _rand(),
    crScroll: _rand(),
    restoreFloat: _rand(),
    restoreList:  _rand(),
  };

  // ─── Shadow DOM host ──────────────────────────────────────────────────────
  // Every piece of UI we add lives inside a *closed* shadow root attached to
  // an unmarked div. Nothing recognizable lands in the host page's DOM tree
  // (no ids, classes or data-* on the host) and no CSS rule we inject can
  // leak into the page. Fixed-position children inside the shadow root still
  // position themselves against the viewport, so the visual result is
  // identical to appending to <body>.
  let _axHost  = null;
  let _axRoot  = null;
  function _ensureShadow() {
    if (_axRoot) return _axRoot;
    if (!document.body) return null;
    _axHost = document.createElement('div');
    // No styling at all — the host is a default block element. Since every
    // descendant we mount is position:fixed, the host effectively has zero
    // rendered area (an empty block has 0 height) and never intercepts
    // pointer events. Keeping it un-styled is the safest way to ensure
    // shadow-DOM children behave identically to top-level body children for
    // click / drag / focus / keyboard purposes.
    document.body.appendChild(_axHost);
    _axRoot = _axHost.attachShadow({ mode: 'closed' });
    return _axRoot;
  }
  // Lazy accessors so call-sites read just like `document.body` etc.
  function shRoot() { return _ensureShadow(); }

