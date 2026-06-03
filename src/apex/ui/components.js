  // ─── UI components ────────────────────────────────────────────────────────

  function injectFonts() {
    const root = shRoot(); if (!root) return;
    if (root.getElementById(UID.fonts)) return;
    const link = document.createElement('link');
    link.id   = UID.fonts;
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500;600&display=swap';
    root.appendChild(link);
  }

  function injectKeyframes() {
    const root = shRoot(); if (!root) return;
    let s = root.getElementById(UID.kf);
    if (!s) {
      s    = document.createElement('style');
      s.id = UID.kf;
      root.appendChild(s);
    }
    s.textContent = [
      '@keyframes ax-spin{to{transform:rotate(360deg)}}',
      '@keyframes ax-in{from{opacity:0;transform:scale(.96) translateY(-10px)}to{opacity:1;transform:none}}',
      '@keyframes ax-fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes ax-fo{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(4px)}}',
      '@keyframes ax-sk{0%{background-position:200% center}100%{background-position:-200% center}}',
      '@keyframes ax-pulse{0%,100%{opacity:.4}50%{opacity:.8}}',
      `@keyframes ax-dz-pulse{0%,100%{border-color:${T.accBdr}}50%{border-color:${T.acc}}}`,
      `#${UID.body}::-webkit-scrollbar{width:2px}`,
      `#${UID.body}::-webkit-scrollbar-track{background:transparent}`,
      `#${UID.body}::-webkit-scrollbar-thumb{background:${T.accDim};border-radius:2px}`,
      '.ax-skel{background:linear-gradient(90deg,rgba(255,255,255,.02) 25%,rgba(255,255,255,.055) 50%,rgba(255,255,255,.02) 75%);background-size:200% 100%;animation:ax-sk 2s ease infinite;border-radius:4px;}',
      `#${UID.wrap}::before{content:"";position:absolute;inset:0;border-radius:14px;pointer-events:none;opacity:.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:128px 128px;z-index:0;}`,
      `#${UID.pkgList}::-webkit-scrollbar{width:3px}`,
      `#${UID.pkgList}::-webkit-scrollbar-track{background:transparent}`,
      `#${UID.pkgList}::-webkit-scrollbar-thumb{background:${T.accBdr};border-radius:2px}`,
      `#${UID.agFloat} > div:last-child::-webkit-scrollbar{width:2px}`,
      `#${UID.agFloat} > div:last-child::-webkit-scrollbar-track{background:transparent}`,
      `#${UID.agFloat} > div:last-child::-webkit-scrollbar-thumb{background:${T.accDim};border-radius:2px}`,
      `#${UID.pkgFloat} > div:last-child::-webkit-scrollbar{width:2px}`,
      `#${UID.pkgFloat} > div:last-child::-webkit-scrollbar-track{background:transparent}`,
      `#${UID.pkgFloat} > div:last-child::-webkit-scrollbar-thumb{background:${T.accDim};border-radius:2px}`,
      `.${UID.crScroll}::-webkit-scrollbar{width:5px}`,
      `.${UID.crScroll}::-webkit-scrollbar-track{background:rgba(255,255,255,0.02);border-radius:3px}`,
      `.${UID.crScroll}::-webkit-scrollbar-thumb{background:${T.accBdr};border-radius:3px;border:1px solid transparent;background-clip:content-box}`,
      `.${UID.crScroll}::-webkit-scrollbar-thumb:hover{background:${T.acc};background-clip:content-box}`,
      `.${UID.crScroll}{scrollbar-width:thin;scrollbar-color:${T.accBdr} transparent}`,
      // Chatroom row enter / exit animations
      '@keyframes ax-row-in{from{opacity:0;transform:translateY(-6px) scale(0.98)}to{opacity:1;transform:none}}',
      '@keyframes ax-row-out{from{opacity:1;transform:none;max-height:60px;margin-top:0;padding-top:6px;padding-bottom:6px}to{opacity:0;transform:translateX(-14px);max-height:0;padding-top:0;padding-bottom:0;border-width:0}}',
    ].join('');
  }

  function buildSkeletonCard(rows) {
    const card = mk('div', { padding: '16px 0', borderBottom: `1px solid ${T.bdrSub}`, boxSizing: 'border-box' });
    const skel = (w, h, mb) => {
      const d = mk('div');
      d.className = 'ax-skel';
      Object.assign(d.style, { height: h, width: w, marginBottom: mb });
      card.appendChild(d);
    };
    skel('38%', '9px', '6px');
    skel('60%', '7px', '16px');
    for (let i = 0; i < rows; i++) skel('100%', '32px', '8px');
    skel('100%', '34px', '0');
    return card;
  }

  function buildBtn(label, iconKey, variant) {
    const isDanger = variant === 'danger';
    const isOk     = variant === 'ok';
    const bg     = isDanger ? T.errDim : isOk ? T.okDim  : T.accDim;
    const bdr    = isDanger ? T.errBdr : isOk ? T.okBdr  : T.accBdr;
    const clr    = isDanger ? T.err    : isOk ? T.ok     : T.acc;
    const bgHov  = isDanger ? 'rgba(239,68,68,0.15)' : isOk ? 'rgba(74,222,128,0.15)' : T.accGlow;
    const bdrHov = isDanger ? 'rgba(239,68,68,0.40)' : isOk ? 'rgba(74,222,128,0.40)' : T.accBdr;
    const glow   = isDanger ? '0 0 14px rgba(239,68,68,0.12)' : isOk ? '0 0 14px rgba(74,222,128,0.12)' : `0 0 14px ${T.accGlow}`;
    const spinBdr = isDanger ? 'rgba(239,68,68,0.18)' : isOk ? 'rgba(74,222,128,0.18)' : T.accBdr;

    const btn = mk('button', {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
      width: '100%', padding: '8px 14px',
      background: bg, border: `1px solid ${bdr}`, borderRadius: '6px',
      color: clr, fontFamily: T.sans, fontSize: '11.5px', fontWeight: '500',
      letterSpacing: '0.02em', cursor: 'pointer', outline: 'none',
      position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.1s, opacity 0.15s',
    });

    const iconEl = iconKey ? mkSVG(iconKey) : null;
    const lbl    = mk('span', { transition: 'opacity 0.12s', pointerEvents: 'none' });
    lbl.textContent = label;

    const spin = mk('span', { display: 'none', position: 'absolute', inset: '0', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' });
    const ring = mk('span', {
      display: 'block', width: '12px', height: '12px',
      border: `1.5px solid ${spinBdr}`, borderTopColor: clr,
      borderRadius: '50%', animation: 'ax-spin 0.5s linear infinite',
    });
    spin.appendChild(ring);

    if (iconEl) btn.appendChild(iconEl);
    btn.appendChild(lbl);
    btn.appendChild(spin);

    btn.addEventListener('mouseenter', () => {
      if (btn.disabled) return;
      btn.style.background  = bgHov;
      btn.style.borderColor = bdrHov;
      btn.style.boxShadow   = glow;
      btn.style.transform   = 'translateY(-1px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background  = bg;
      btn.style.borderColor = bdr;
      btn.style.boxShadow   = '';
      btn.style.transform   = '';
    });
    btn.addEventListener('mousedown', () => { if (!btn.disabled) btn.style.transform = 'translateY(0) scale(0.98)'; });
    btn.addEventListener('mouseup',   () => { if (!btn.disabled) btn.style.transform = 'translateY(-1px)'; });

    btn.setLoading = on => {
      btn.disabled         = on;
      btn.style.opacity    = on ? '0.6' : '1';
      btn.style.cursor     = on ? 'not-allowed' : 'pointer';
      lbl.style.opacity    = on ? '0' : '1';
      if (iconEl) iconEl.style.opacity = on ? '0' : '1';
      spin.style.display   = on ? 'flex' : 'none';
    };
    btn.setDisabled = on => {
      btn.disabled      = on;
      btn.style.opacity = on ? '0.28' : '1';
      btn.style.cursor  = on ? 'not-allowed' : 'pointer';
    };

    btn._lbl = lbl;
    return btn;
  }

  function buildInput(placeholder) {
    const inp = mk('input', {
      display: 'block', width: '100%', padding: '8px 10px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${T.bdrSub}`, borderRadius: '6px',
      color: T.txt, fontFamily: T.sans, fontSize: '12px', fontWeight: '400',
      outline: 'none', boxSizing: 'border-box', marginBottom: '8px',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    });
    inp.type = 'text';
    inp.placeholder = placeholder;
    inp.addEventListener('mousedown', e => e.stopImmediatePropagation());
    inp.addEventListener('click', e => { e.stopImmediatePropagation(); inp.focus(); });
    inp.addEventListener('focus', () => {
      inp.style.borderColor = T.accBdr;
      inp.style.boxShadow   = `0 0 0 3px ${T.accGlow}`;
      freezeUnityCanvas();
    });
    inp.addEventListener('blur', () => {
      inp.style.borderColor = T.bdrSub;
      inp.style.boxShadow   = '';
      unfreezeUnityCanvas();
    });
    for (const ev of ['keydown', 'keypress', 'keyup']) inp.addEventListener(ev, e => e.stopImmediatePropagation());
    return inp;
  }

  function buildSelect(options) {
    const sel = mk('select', {
      display: 'block', width: '100%', padding: '8px 28px 8px 10px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${T.bdrSub}`, borderRadius: '6px',
      color: T.txt, fontFamily: T.sans, fontSize: '12px', fontWeight: '400',
      outline: 'none', cursor: 'pointer', boxSizing: 'border-box', marginBottom: '8px',
      appearance: 'none', WebkitAppearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235a5570' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    });
    sel.addEventListener('mousedown', e => e.stopImmediatePropagation());
    sel.addEventListener('click',     e => e.stopImmediatePropagation());
    sel.addEventListener('focus', () => {
      sel.style.borderColor = T.accBdr;
      sel.style.boxShadow   = `0 0 0 3px ${T.accGlow}`;
      freezeUnityCanvas();
    });
    sel.addEventListener('blur', () => {
      sel.style.borderColor = T.bdrSub;
      sel.style.boxShadow   = '';
      unfreezeUnityCanvas();
    });
    for (const ev of ['keydown', 'keypress', 'keyup']) sel.addEventListener(ev, e => e.stopImmediatePropagation());
    for (const [v, label] of options) {
      const opt = document.createElement('option');
      opt.value       = v;
      opt.textContent = label;
      opt.style.background = T.sur;
      sel.appendChild(opt);
    }
    return sel;
  }

  function buildSection(...children) {
    const sec = mk('div', { paddingTop: '16px', paddingBottom: '16px', borderBottom: `1px solid ${T.bdrSub}`, boxSizing: 'border-box' });
    for (const child of children) if (child) sec.appendChild(child);
    return sec;
  }

  function buildSectionHead(label, desc, trailing) {
    const wrap = mk('div', { marginBottom: '11px' });
    const top  = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '8px', marginBottom: desc ? '4px' : '0',
    });
    const lbl = mk('div', {
      fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt,
      letterSpacing: '-0.01em', flex: '1', minWidth: '0',
    });
    lbl.textContent = label;
    top.appendChild(lbl);
    if (trailing) top.appendChild(trailing);
    wrap.appendChild(top);
    if (desc) {
      const d = mk('div', { fontFamily: T.sans, fontSize: '11px', fontWeight: '400', color: T.sub, lineHeight: '1.55' });
      d.textContent = desc;
      wrap.appendChild(d);
    }
    return wrap;
  }

  function buildSectionHeadWithBadge(label, desc, trailing) {
    const row  = mk('div', { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '11px' });
    const left = mk('div', { flex: '1', minWidth: '0' });
    const lbl  = mk('div', { fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt, marginBottom: '4px', letterSpacing: '-0.01em' });
    lbl.textContent = label;
    left.appendChild(lbl);
    if (desc) {
      const d = mk('div', { fontFamily: T.sans, fontSize: '11px', fontWeight: '400', color: T.sub, lineHeight: '1.55' });
      d.textContent = desc;
      left.appendChild(d);
    }
    const badge = mk('span', {
      fontFamily: T.mono, fontSize: '10px', fontWeight: '500',
      color: T.acc, background: T.accDim, border: `1px solid ${T.accBdr}`,
      borderRadius: '4px', padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: '0', letterSpacing: '0.03em',
    });
    badge.textContent = '—';
    row.appendChild(left);
    if (trailing) {
      const trailWrap = mk('div', { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: '0', marginTop: '1px' });
      trailWrap.appendChild(trailing);
      trailWrap.appendChild(badge);
      row.appendChild(trailWrap);
    } else {
      row.appendChild(badge);
    }
    return { row, badge };
  }

