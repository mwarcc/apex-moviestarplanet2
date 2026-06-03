  // ─── Cleaner Console ──────────────────────────────────────────────────────
  // Filter Unity / browser spam out of devtools. Active when
  // state.misc.cleanConsole is true. Patterns are anchored loosely so
  // wording variations between Unity versions still match.
  const _CONSOLE_NOISE = [
    /\[UnityCache\]/,
    /^Unloading \d+ Unused Serialized files/,
    /^Unloading \d+ unused Assets/,
    /^Total: [\d.]+ ms \(FindLiveObjects:/,
    /BoxCollider does not support negative scale/,
    /^Uploading Crash Report/,
    /Unsafe attempt to load URL .* from frame with URL chrome-error:/,
    /ArgumentException: PGCDownloadingInfoBase was invalid/,
    /UgcManager\.TryGetUgcSnapshot/,
    /_JS_Log_Dump/,
    /\bWS_Create\b/,
    /\bWS_Close\b/,
    /\bWS_Release\b/,
    /\bWS_Send\b/,
    /Failed to create agent because it is not close enough to the NavMesh/,
  ];
  function _consoleShouldFilter(args) {
    if (!state.misc.cleanConsole) return false;
    if (!args || !args.length) return false;
    let s = '';
    try {
      for (const a of args) {
        if (a == null) continue;
        s += (typeof a === 'string' ? a : (a.message ?? String(a))) + ' ';
        if (s.length > 4000) break; // keep cost bounded
      }
    } catch { return false; }
    for (const re of _CONSOLE_NOISE) {
      if (re.test(s)) return true;
    }
    return false;
  }
  const _nativeConsole = {
    log:   console.log.bind(console),
    info:  console.info.bind(console),
    warn:  console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
    try {
      const native = _nativeConsole[m];
      const wrapped = function (...args) {
        if (_consoleShouldFilter(args)) return;
        return native(...args);
      };
      makeNativeToString(wrapped, native);
      console[m] = wrapped;
    } catch { /* read-only console method — skip */ }
  }

