  // ─── XHR intercept ────────────────────────────────────────────────────────
  // The game may also send chat history POSTs through XMLHttpRequest rather
  // than fetch — wrap open + send so the chat-filter bypass still applies.
  // Per-instance metadata is held in a WeakMap so we never leave expando
  // properties on the XHR object that page code could probe.
  const _xhrMeta = new WeakMap();
  const _nativeXHROpen = XMLHttpRequest.prototype.open;
  const _nativeXHRSend = XMLHttpRequest.prototype.send;
  try {
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      try {
        _xhrMeta.set(this, {
          method: typeof method === 'string' ? method.toUpperCase() : '',
          url:    typeof url === 'string' ? url : (url?.toString?.() ?? ''),
        });
      } catch { /* ignore */ }
      return _nativeXHROpen.call(this, method, url, ...rest);
    };
    makeNativeToString(XMLHttpRequest.prototype.open, _nativeXHROpen);
  } catch { /* leave native open in place */ }

  try {
    XMLHttpRequest.prototype.send = function (body) {
      try {
        const meta = _xhrMeta.get(this);
        if (state.misc.chatFilterBypass &&
            meta && meta.method === 'POST' &&
            HISTORY_RE.test(meta.url || '') &&
            typeof body === 'string') {
          const parsed = JSON.parse(body);
          if (parsed && parsed.MessageType === 'ChatMessageV2' && typeof parsed.MessageBody === 'string') {
            parsed.MessageBody = insertSoftHyphens(parsed.MessageBody);
            body = JSON.stringify(parsed);
          }
        }
      } catch { /* not JSON or unexpected shape — pass through */ }
      return _nativeXHRSend.call(this, body);
    };
    makeNativeToString(XMLHttpRequest.prototype.send, _nativeXHRSend);
  } catch { /* leave native send in place */ }

