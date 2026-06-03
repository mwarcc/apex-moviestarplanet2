  // ─── WebSocket intercept ──────────────────────────────────────────────────
  // Patch the prototype methods once so individual sockets carry no own
  // descriptors that page code could probe. Per-socket metadata is kept in
  // a script-private Map.

  const trackedSockets    = new Map();
  const activeQuizSockets = new Set();

  // Cached native methods / accessors so our wrappers call through to the
  // real implementation without recursing.
  const _wsProto         = _nativeWS.prototype;
  const _nativeWSSend    = _wsProto.send;
  const _nativeWSAddEL   = _wsProto.addEventListener;
  const _nativeWSOnMsg   = Object.getOwnPropertyDescriptor(_wsProto, 'onmessage');

  // Per-socket onmessage shim record (lives in trackedSockets[ws].onmsg)
  function _trackSocket(ws, url) {
    if (trackedSockets.has(ws)) return;
    trackedSockets.set(ws, {
      url: url ?? '',
      isQuiz: false,
      answering: false,
      lastQuestion: null,
      // Internal onmessage relay state — never exposed on the ws instance.
      pageOnMsg: null,
      onMsgHooked: false,
    });

    // Use the native addEventListener on this socket to clean ourselves up
    // when the socket closes.
    try {
      _nativeWSAddEL.call(ws, 'close', () => {
        const i = trackedSockets.get(ws);
        if (i?.isQuiz) activeQuizSockets.delete(ws);
        trackedSockets.delete(ws);
      });
    } catch { /* native addEventListener missing — best effort */ }
  }

  // Patch send once: rewrite outgoing payloads in-place for any tracked
  // socket. Untracked sockets pass straight through.
  try {
    const patchedSend = function (data) {
      const info = trackedSockets.get(this);
      if (info && typeof data === 'string' && data.startsWith('42')) {
        try {
          const parsed = JSON.parse(data.slice(2));
          if (Array.isArray(parsed)) {
            let changed = false;
            if (state.misc.chatFilterBypass && parsed[0] === 'chatv2:send' && typeof parsed[1]?.message === 'string') {
              parsed[1].message = insertSoftHyphens(parsed[1].message);
              changed = true;
            }
            if (state.appliedMood && parsed[0] === '7001' && parsed[1] && typeof parsed[1] === 'object' && 'mood' in parsed[1]) {
              parsed[1].mood = state.appliedMood;
              changed = true;
            }
            if (state.misc.invisibleJoin && parsed[0] === '7001' &&
                parsed[1] && typeof parsed[1] === 'object' && parsed[1].position &&
                typeof parsed[1].position === 'object') {
              const p = parsed[1].position;
              if (typeof p.x === 'number') p.x = p.x - 1110;
              if (typeof p.y === 'number') p.y = p.y + 110;
              if (typeof p.z === 'number') p.z = p.z + 127;
              changed = true;
            }
            if (changed) return _nativeWSSend.call(this, `42${JSON.stringify(parsed)}`);
          }
        } catch { /* not a structured packet */ }
      }
      return _nativeWSSend.call(this, data);
    };
    makeNativeToString(patchedSend, _nativeWSSend);
    _wsProto.send = patchedSend;
  } catch { /* read-only — give up */ }

  // Patch addEventListener once: wrap 'message' listeners for tracked
  // sockets only. All other listeners pass through unchanged.
  try {
    const patchedAEL = function (type, listener, options) {
      if (type === 'message' && trackedSockets.has(this) && typeof listener === 'function') {
        const ws = this;
        const wrapped = async function (event) {
          try { await onSocketMessage(ws, event.data); } catch { /* swallow */ }
          return listener.call(this, event);
        };
        return _nativeWSAddEL.call(this, 'message', wrapped, options);
      }
      return _nativeWSAddEL.call(this, type, listener, options);
    };
    makeNativeToString(patchedAEL, _nativeWSAddEL);
    _wsProto.addEventListener = patchedAEL;
  } catch { /* read-only — give up */ }

  // Patch the onmessage accessor pair once. For tracked sockets we install
  // a single relay (lazily) that calls our handler before the page's
  // assigned function. Reads/writes always look like normal accessor calls.
  if (_nativeWSOnMsg && _nativeWSOnMsg.configurable !== false) {
    try {
      Object.defineProperty(_wsProto, 'onmessage', {
        configurable: true,
        enumerable: _nativeWSOnMsg.enumerable,
        get() {
          const info = trackedSockets.get(this);
          if (info) return info.pageOnMsg;
          return _nativeWSOnMsg.get?.call(this) ?? null;
        },
        set(fn) {
          const info = trackedSockets.get(this);
          if (!info) {
            _nativeWSOnMsg.set?.call(this, fn);
            return;
          }
          info.pageOnMsg = fn;
          if (info.onMsgHooked) return;
          info.onMsgHooked = true;
          const ws = this;
          _nativeWSAddEL.call(ws, 'message', async function (event) {
            try { await onSocketMessage(ws, event.data); } catch { /* swallow */ }
            try { info.pageOnMsg?.call(ws, event); } catch { /* page handler error */ }
          });
        },
      });
    } catch { /* leave native accessor in place */ }
  }

  // Proxy-based WebSocket replacement keeps typeof/instanceof correct and
  // gives us a single place to register new sockets.
  const _WSHandler = {
    construct(Target, args) {
      const ws = new Target(...args);
      _trackSocket(ws, args[0]);
      return ws;
    },
    get(Target, prop) {
      return Target[prop];
    },
  };

  const _ProxiedWS = new Proxy(_nativeWS, _WSHandler);

  try {
    Object.defineProperty(window, 'WebSocket', {
      value: _ProxiedWS,
      writable: true,
      configurable: true,
    });
  } catch {
    try { window.WebSocket = _ProxiedWS; } catch { /* read-only WebSocket — skip */ }
  }

  setInterval(() => {
    for (const [ws, info] of trackedSockets) {
      if (ws.readyState !== _nativeWS.CLOSED) continue;
      if (info.isQuiz) activeQuizSockets.delete(ws);
      trackedSockets.delete(ws);
    }
  }, 5000);

  // ─── Quiz socket message handling ─────────────────────────────────────────

  function extractQuizQuestion(eventName, payload) {
    const direct = new Set(['quiz:chal', 'quiz:init', 'quiz:question']);
    if (direct.has(eventName)) return { questionKey: payload.question, answerKeys: payload.answers ?? [] };
    if (eventName === 'message' && direct.has(payload.messageType)) {
      const mc = payload.messageContent ?? {};
      return { questionKey: mc.question, answerKeys: mc.answers ?? [] };
    }
    return null;
  }

  function isQuizRelated(eventName, payload) {
    return QUIZ_EVENT_NAMES.has(eventName) || (eventName === 'message' && (payload.messageType?.startsWith('quiz:') || payload.messageType?.startsWith('game:')));
  }

