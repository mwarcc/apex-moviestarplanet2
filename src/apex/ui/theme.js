  // ─── Theme ────────────────────────────────────────────────────────────────

  const T = {
    bg:      '#080810',
    sur:     '#0d0d1a',
    surAlt:  '#111122',
    bdr:     'rgba(245,158,11,0.10)',
    bdrSub:  'rgba(255,255,255,0.06)',
    txt:     '#f0eee8',
    sub:     '#5a5570',
    muted:   '#38344a',
    acc:     '#f59e0b',
    accDim:  'rgba(245,158,11,0.08)',
    accBdr:  'rgba(245,158,11,0.22)',
    accGlow: 'rgba(245,158,11,0.14)',
    err:     '#ef4444',
    errDim:  'rgba(239,68,68,0.08)',
    errBdr:  'rgba(239,68,68,0.22)',
    ok:      '#4ade80',
    okDim:   'rgba(74,222,128,0.08)',
    okBdr:   'rgba(74,222,128,0.22)',
    info:    '#60a5fa',
    infoDim: 'rgba(96,165,250,0.08)',
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Geist Mono', 'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  };

  // ─── Theme system ─────────────────────────────────────────────────────────

  const THEMES = {
    yellow: { acc: '#f59e0b', accDim: 'rgba(245,158,11,0.08)',  accBdr: 'rgba(245,158,11,0.22)',  accGlow: 'rgba(245,158,11,0.14)',  bdr: 'rgba(245,158,11,0.10)'  },
    white:  { acc: '#e8e6e0', accDim: 'rgba(232,230,224,0.08)', accBdr: 'rgba(232,230,224,0.22)', accGlow: 'rgba(232,230,224,0.14)', bdr: 'rgba(232,230,224,0.10)' },
    green:  { acc: '#4ade80', accDim: 'rgba(74,222,128,0.08)',  accBdr: 'rgba(74,222,128,0.22)',  accGlow: 'rgba(74,222,128,0.14)',  bdr: 'rgba(74,222,128,0.10)'  },
    purple: { acc: '#a855f7', accDim: 'rgba(168,85,247,0.08)',  accBdr: 'rgba(168,85,247,0.22)',  accGlow: 'rgba(168,85,247,0.14)',  bdr: 'rgba(168,85,247,0.10)'  },
    cyan:   { acc: '#22d3ee', accDim: 'rgba(34,211,238,0.08)',  accBdr: 'rgba(34,211,238,0.22)',  accGlow: 'rgba(34,211,238,0.14)',  bdr: 'rgba(34,211,238,0.10)'  },
    orange: { acc: '#f97316', accDim: 'rgba(249,115,22,0.08)',  accBdr: 'rgba(249,115,22,0.22)',  accGlow: 'rgba(249,115,22,0.14)',  bdr: 'rgba(249,115,22,0.10)'  },
    red:    { acc: '#ef4444', accDim: 'rgba(239,68,68,0.08)',   accBdr: 'rgba(239,68,68,0.22)',   accGlow: 'rgba(239,68,68,0.14)',   bdr: 'rgba(239,68,68,0.10)'   },
  };

  let currentTheme = 'yellow';
  // Restore saved theme before first render
  { const saved = _prefsGet(_PK.theme); if (saved && THEMES[saved]) { currentTheme = saved; Object.assign(T, THEMES[saved]); } }

  function setTheme(key) {
    if (!THEMES[key]) return;
    currentTheme = key;
    _prefsSet(_PK.theme, key);
    Object.assign(T, THEMES[key]);
    // Hover popover lives outside the menu wrap — drop it so the next
    // render picks up the new accent colours.
    if (_hoverPop) { _hoverPop.remove(); _hoverPop = null; _hoverPopProfileId = null; }
    if (menu) {
      const rect = menu.getBoundingClientRect();
      const agWasVisible  = agFloatingMenu  ? agFloatingMenu.style.display  !== 'none' : false;
      const pkgWasVisible = pkgFloatingMenu ? pkgFloatingMenu.style.display !== 'none' : false;
      menu.remove(); menu = null;
      if (agFloatingMenu)  { agFloatingMenu.remove();  agFloatingMenu  = null; delete refs.agFloatBody; }
      if (pkgFloatingMenu) { pkgFloatingMenu.remove(); pkgFloatingMenu = null; delete refs.pkgFloatBody; }
      minimd = false;
      createUI();
      if (menu) {
        menu.style.top    = Math.round(rect.top)  + 'px';
        menu.style.left   = Math.round(rect.left) + 'px';
        menu.style.right  = 'auto';
        menu.style.animation = 'none';
      }
      if (agWasVisible) {
        if (!agFloatingMenu) buildAgFloatingMenu();
        agFloatingMenu.style.display = 'flex';
      }
      if (pkgWasVisible) {
        if (!pkgFloatingMenu) buildPkgFloatingMenu();
        pkgFloatingMenu.style.display = 'flex';
        _syncPkgOpenBtn();
      }
    }
  }

