  // ─── Settings panel ───────────────────────────────────────────────────────

  function buildSettingsPanel() {
    const panel = mk('div', {
      position: 'absolute', top: '52px', left: '0', right: '0',
      background: T.bg, zIndex: '10',
      borderBottom: `1px solid ${T.bdrSub}`,
      padding: '14px 16px 16px', boxSizing: 'border-box',
      display: 'none', overflowY: 'auto', maxHeight: 'calc(100% - 52px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    });

    // ── Theme color ──
    const themeHead = mk('div', {
      fontFamily: T.sans, fontSize: '10px', fontWeight: '600',
      color: T.sub, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '10px',
    });
    themeHead.textContent = 'Theme Color';
    panel.appendChild(themeHead);

    const THEME_META = [
      ['yellow', '#f59e0b', 'Yellow'],
      ['white',  '#e8e6e0', 'White'],
      ['green',  '#4ade80', 'Green'],
      ['purple', '#a855f7', 'Purple'],
      ['cyan',   '#22d3ee', 'Cyan'],
      ['orange', '#f97316', 'Orange'],
      ['red',    '#ef4444', 'Red'],
    ];

    const swatchRow = mk('div', { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' });
    for (const [key, hex, label] of THEME_META) {
      const sw = mk('button', {
        position: 'relative', width: '26px', height: '26px', borderRadius: '50%',
        background: hex,
        border: `2.5px solid ${key === currentTheme ? 'rgba(255,255,255,0.75)' : 'transparent'}`,
        cursor: 'pointer', outline: 'none',
        transition: 'transform 0.14s, border-color 0.14s',
        flexShrink: '0', boxSizing: 'border-box',
        boxShadow: key === currentTheme ? `0 0 0 1px ${hex}` : 'none',
      });
      sw.title = label;
      sw.addEventListener('mouseenter', () => { sw.style.transform = 'scale(1.18)'; });
      sw.addEventListener('mouseleave', () => { sw.style.transform = 'scale(1)'; });
      sw.addEventListener('click', e => { e.stopImmediatePropagation(); setTheme(key); });
      swatchRow.appendChild(sw);
    }
    panel.appendChild(swatchRow);

    // ── Divider ──
    const divider = mk('div', { height: '1px', background: T.bdrSub, marginBottom: '14px' });
    panel.appendChild(divider);

    // ── Trace Logs ──
    const traceHeaderRow = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px',
    });
    const traceLbl = mk('div', {
      fontFamily: T.sans, fontSize: '10px', fontWeight: '600',
      color: T.sub, letterSpacing: '0.09em', textTransform: 'uppercase',
    });
    traceLbl.textContent = 'Trace Logs';
    const traceCount = mk('span', {
      fontFamily: T.mono, fontSize: '10px', fontWeight: '500',
      color: T.err, background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.22)',
      borderRadius: '4px', padding: '1px 6px',
    });
    traceCount.textContent = '0';
    traceHeaderRow.appendChild(traceLbl);
    traceHeaderRow.appendChild(traceCount);
    panel.appendChild(traceHeaderRow);

    const traceDesc = mk('div', {
      fontFamily: T.sans, fontSize: '11px', fontWeight: '400',
      color: T.sub, lineHeight: '1.55', marginBottom: '10px',
    });
    traceDesc.textContent = 'Endpoints where the server returned a traceId — indicating the request was likely flagged or detected.';
    panel.appendChild(traceDesc);

    const traceList = mk('div', {
      maxHeight: '130px', overflowY: 'auto',
      background: T.sur, borderRadius: '6px',
      border: `1px solid ${T.bdrSub}`, padding: '8px 10px',
      boxSizing: 'border-box',
    });
    panel.appendChild(traceList);

    refs.traceLogList  = traceList;
    refs.traceLogCount = traceCount;
    _refreshTraceLogList();
    return panel;
  }

