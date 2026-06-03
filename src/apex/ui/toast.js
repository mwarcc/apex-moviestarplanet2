  // ─── Toast ────────────────────────────────────────────────────────────────

  function toast(msg, type = 'info') {
    const host = shRoot() ?? document.body;
    // No class needed — we keep a single container at the shadow-root level
    // and look it up by reference (so no static identifier lands in the DOM).
    let container = host._axToasts;
    if (!container) {
      container = mk('div', {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: '2147483648', display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '5px', pointerEvents: 'none', maxWidth: 'calc(100vw - 40px)',
      });
      host.appendChild(container);
      host._axToasts = container;
    }

    const palettes = {
      success: { fg: T.ok,   bg: T.okDim,   bdr: 'rgba(74,222,128,0.15)',  svg: `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` },
      error:   { fg: T.err,  bg: T.errDim,  bdr: 'rgba(239,68,68,0.15)',   svg: `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` },
      info:    { fg: T.info, bg: T.infoDim, bdr: 'rgba(96,165,250,0.15)',  svg: `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>` },
    };
    const p = palettes[type] ?? palettes.info;

    const icon = mk('span', {
      width: '16px', height: '16px', borderRadius: '50%', flexShrink: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: p.bg, color: p.fg,
    });
    icon.innerHTML = p.svg;

    const pill = mk('div', {
      fontFamily: T.sans, fontSize: '12px', fontWeight: '400',
      padding: '7px 12px 7px 9px', borderRadius: '8px',
      background: 'rgba(8,8,16,0.97)', border: `1px solid ${p.bdr}`,
      color: T.txt, boxShadow: `0 10px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset`,
      display: 'flex', alignItems: 'center', gap: '8px',
      pointerEvents: 'all', whiteSpace: 'nowrap',
      animation: 'ax-fi 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
    });
    pill.appendChild(icon);
    pill.appendChild(document.createTextNode(msg));
    container.appendChild(pill);

    setTimeout(() => {
      pill.style.animation = 'ax-fo 0.18s ease forwards';
      setTimeout(() => pill.remove(), 200);
    }, 2800);
  }

