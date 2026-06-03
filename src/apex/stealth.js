  // ─── Stealth fetch/WebSocket proxy ────────────────────────────────────────
  // We use Proxy so that .toString() on the wrapped function still returns the
  // native function string, preventing trivial "is this native?" checks.

  const _nativeFetch = window.fetch;
  const _nativeWS    = window.WebSocket;

  // Make our intercept wrapper look native
  function makeNativeToString(fn, nativeRef) {
    try {
      Object.defineProperty(fn, 'toString', {
        value: () => Function.prototype.toString.call(nativeRef),
        configurable: true,
        writable: false,
      });
      Object.defineProperty(fn, Symbol.toPrimitive, {
        value: () => Function.prototype.toString.call(nativeRef),
        configurable: true,
      });
    } catch { /* ignore */ }
  }

