  // ─── Persistent preferences ───────────────────────────────────────────────
  // Every preference is serialised into ONE localStorage entry so the
  // extension's footprint in storage is indistinguishable from any other
  // random JSON cache the host page might keep. The key looks like a
  // generic hex blob and contains no recognisable substring.

  const _PK_ROOT = '_c7f3d2'; // single namespace key in localStorage
  const _PK = {
    theme:       'th',
    chat:        'cf',
    autoLiker:   'al',
    cleanConsole:'cc',
    hidePlayers: 'hp',
    invisJoin:   'iv',
    spCrystals:  'sc',
    spMessages:  'sm',
    spAccept:    'sa',
    spReject:    'sr',
    spDelLvl:    'sdl',
    spDelVip:    'sdv',
    spAutoLiker: 'sal',
  };
  let _PK_CACHE = null;
  function _prefsLoad() {
    if (_PK_CACHE) return _PK_CACHE;
    try {
      const raw = localStorage.getItem(_PK_ROOT);
      _PK_CACHE = raw ? (JSON.parse(raw) || {}) : {};
    } catch { _PK_CACHE = {}; }
    return _PK_CACHE;
  }
  function _prefsFlush() {
    try { localStorage.setItem(_PK_ROOT, JSON.stringify(_PK_CACHE || {})); } catch { /* storage blocked */ }
  }
  const _prefsGet = k => {
    const blob = _prefsLoad();
    return Object.prototype.hasOwnProperty.call(blob, k) ? blob[k] : null;
  };
  const _prefsSet = (k, v) => {
    const blob = _prefsLoad();
    blob[k] = v;
    _prefsFlush();
  };

  // ─── Speed presets ────────────────────────────────────────────────────────
  // Multiplier applied to wait() intervals — higher = slower.
  const SPEED_KEYS   = ['very_slow', 'slow', 'normal', 'fast', 'very_fast'];
  const SPEED_MULT   = { very_slow: 2.0, slow: 1.5, normal: 1.0, fast: 0.5, very_fast: 0.25 };
  const SPEED_LABELS = { very_slow: 'Very Slow', slow: 'Slow', normal: 'Normal', fast: 'Fast', very_fast: 'Very Fast' };
  const SPEED_OP_PK  = {
    crystals:      _PK.spCrystals,
    messages:      _PK.spMessages,
    acceptFriends: _PK.spAccept,
    rejectFriends: _PK.spReject,
    deleteFriendsLevel: _PK.spDelLvl,
    deleteFriendsVip:   _PK.spDelVip,
    autoLiker:     _PK.spAutoLiker,
  };
  function _loadSpeed(opKey) {
    const v = _prefsGet(SPEED_OP_PK[opKey]);
    return SPEED_KEYS.includes(v) ? v : 'normal';
  }
  function _saveSpeed(opKey, val) {
    if (SPEED_KEYS.includes(val)) _prefsSet(SPEED_OP_PK[opKey], val);
  }
  function _speedMult(opKey) {
    return SPEED_MULT[state.speeds[opKey]] ?? 1.0;
  }

