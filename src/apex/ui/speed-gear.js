  // ─── Speed gear button + popover ──────────────────────────────────────────
  // Renders a small ⚙ icon next to a feature heading. Clicking opens a tiny
  // popover with 5 speed presets. Selection is persisted to localStorage.

  function buildSpeedGear(opKey, featureName) {
    const wrap = mk('div', { position: 'relative', flexShrink: '0' });

    const btn = mk('button', {
      width: '22px', height: '22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: `1px solid ${T.bdrSub}`,
      borderRadius: '4px', color: T.sub, cursor: 'pointer', outline: 'none',
      padding: '0', boxSizing: 'border-box',
      transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    });
    btn.title = `${featureName} speed`;
    btn.setAttribute('aria-label', `${featureName} speed`);
    btn.innerHTML = ICONS.gear;
    btn.addEventListener('mouseenter', () => {
      if (pop.style.display === 'block') return;
      btn.style.background  = T.accDim;
      btn.style.borderColor = T.accBdr;
      btn.style.color       = T.acc;
    });
    btn.addEventListener('mouseleave', () => {
      if (pop.style.display === 'block') return;
      btn.style.background  = 'transparent';
      btn.style.borderColor = T.bdrSub;
      btn.style.color       = T.sub;
    });

    const pop = mk('div', {
      position: 'absolute', top: 'calc(100% + 6px)', right: '0',
      minWidth: '128px', background: T.bg,
      border: `1px solid ${T.bdr}`, borderRadius: '6px',
      boxShadow: `0 10px 26px rgba(0,0,0,0.7), 0 0 0 1px ${T.accGlow} inset`,
      padding: '4px', zIndex: '20', display: 'none', boxSizing: 'border-box',
    });

    function renderItems() {
      pop.innerHTML = '';
      const cur = state.speeds[opKey];
      for (const key of SPEED_KEYS) {
        const active = key === cur;
        const item = mk('button', {
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px', padding: '6px 8px',
          background: active ? T.accDim : 'transparent',
          border: 'none', borderRadius: '4px', outline: 'none',
          color: active ? T.acc : T.txt, cursor: 'pointer',
          fontFamily: T.sans, fontSize: '11px', fontWeight: active ? '600' : '400',
          textAlign: 'left',
        });
        const lab = mk('span'); lab.textContent = SPEED_LABELS[key];
        const mult = mk('span', { fontFamily: T.mono, fontSize: '9.5px', color: active ? T.acc : T.muted, letterSpacing: '0.02em' });
        mult.textContent = `${SPEED_MULT[key]}×`;
        item.appendChild(lab);
        item.appendChild(mult);
        item.addEventListener('mouseenter', () => { if (!active) item.style.background = 'rgba(255,255,255,0.04)'; });
        item.addEventListener('mouseleave', () => { if (!active) item.style.background = 'transparent'; });
        item.addEventListener('click', e => {
          e.stopImmediatePropagation();
          state.speeds[opKey] = key;
          _saveSpeed(opKey, key);
          renderItems();
          closePop();
          toast(`${featureName}: ${SPEED_LABELS[key]}`, 'info');
        });
        pop.appendChild(item);
      }
    }

    function openPop() {
      renderItems();
      pop.style.display = 'block';
      btn.style.background  = T.accDim;
      btn.style.borderColor = T.accBdr;
      btn.style.color       = T.acc;
      const root = shRoot() ?? document;
      setTimeout(() => root.addEventListener('mousedown', onDocDown, true), 0);
    }
    function closePop() {
      pop.style.display = 'none';
      btn.style.background  = 'transparent';
      btn.style.borderColor = T.bdrSub;
      btn.style.color       = T.sub;
      const root = shRoot() ?? document;
      root.removeEventListener('mousedown', onDocDown, true);
    }
    function onDocDown(e) {
      if (!wrap.contains(e.target)) closePop();
    }

    btn.addEventListener('click', e => {
      e.stopImmediatePropagation();
      if (pop.style.display === 'block') closePop();
      else openPop();
    });

    wrap.appendChild(btn);
    wrap.appendChild(pop);
    return wrap;
  }

  function buildProgress() {
    const track = mk('div', { height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' });
    const bar   = mk('div', {
      height: '100%', width: '0%',
      background: `linear-gradient(90deg, ${T.accDim}, ${T.acc}, ${T.acc})`,
      borderRadius: '2px', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      boxShadow: `0 0 6px ${T.accGlow}`,
    });
    track.appendChild(bar);
    return { track, bar };
  }

  function buildInfoBanner(text) {
    const wrap = mk('div', {
      display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '8px 10px', marginBottom: '10px',
      background: T.accDim, border: `1px solid ${T.bdr}`,
      borderRadius: '5px', boxSizing: 'border-box',
    });
    const icon = mk('span', { flexShrink: '0', color: T.acc, lineHeight: '1', marginTop: '1px' });
    icon.innerHTML = ICONS.info;
    const txt = mk('span', { fontFamily: T.sans, fontSize: '11px', fontWeight: '400', color: T.sub, lineHeight: '1.6' });
    txt.textContent = text;
    wrap.appendChild(icon);
    wrap.appendChild(txt);
    return wrap;
  }

  function buildToggleRow(label, desc, checked, onChange, trailing) {
    const row = mk('div', {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '14px', padding: '12px 0',
      borderBottom: `1px solid ${T.bdrSub}`,
      boxSizing: 'border-box', cursor: 'pointer',
    });
    const textBlock = mk('div', { flex: '1', minWidth: '0' });
    const lbl = mk('div', { fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt, marginBottom: '4px', letterSpacing: '-0.01em' });
    lbl.textContent = label;
    textBlock.appendChild(lbl);
    if (desc) {
      const d = mk('div', { fontFamily: T.sans, fontSize: '11px', fontWeight: '400', color: T.sub, lineHeight: '1.55' });
      d.textContent = desc;
      textBlock.appendChild(d);
    }
    const track = mk('div', {
      position: 'relative', flexShrink: '0', width: '34px', height: '18px', borderRadius: '9px',
      background: checked ? T.acc : 'rgba(255,255,255,0.08)',
      border: `1px solid ${checked ? T.acc : T.bdrSub}`,
      transition: 'background 0.2s, border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box', marginTop: '1px',
    });
    const knob = mk('div', {
      position: 'absolute', top: '2px', left: checked ? '16px' : '2px',
      width: '12px', height: '12px', borderRadius: '50%',
      background: checked ? T.bg : T.sub,
      transition: 'left 0.2s, background 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    });
    track.appendChild(knob);
    let _checked = checked;
    function toggle() {
      _checked = !_checked;
      track.style.background  = _checked ? T.acc : 'rgba(255,255,255,0.08)';
      track.style.borderColor = _checked ? T.acc : T.bdrSub;
      knob.style.left         = _checked ? '16px' : '2px';
      knob.style.background   = _checked ? T.bg : T.sub;
      onChange(_checked);
    }
    row.addEventListener('click', toggle);
    row.appendChild(textBlock);
    if (trailing) {
      // Cluster trailing controls with the toggle so they don't get squeezed.
      const rightGroup = mk('div', { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: '0', marginTop: '1px' });
      rightGroup.appendChild(trailing);
      rightGroup.appendChild(track);
      row.appendChild(rightGroup);
    } else {
      row.appendChild(track);
    }
    row._getChecked = () => _checked;
    return row;
  }

  function buildDropzone(onFile) {
    let pendingFile = null;

    const wrap = mk('div', {
      position: 'relative', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden',
      border: `1.5px dashed ${T.accBdr}`, background: T.accDim,
      transition: 'border-color 0.15s, background 0.15s, min-height 0.2s',
      cursor: 'pointer', boxSizing: 'border-box', minHeight: '56px',
    });

    const empty = mk('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '8px', padding: '24px 16px', pointerEvents: 'none',
    });
    const emptyIcon = mk('span', { color: T.sub, lineHeight: '1', opacity: '0.6' });
    emptyIcon.innerHTML = ICONS.image;
    const emptyLabel = mk('span', { fontFamily: T.sans, fontSize: '11.5px', fontWeight: '500', color: T.sub, textAlign: 'center', lineHeight: '1.5' });
    emptyLabel.textContent = 'Drop image here or click to browse';
    const emptyHint = mk('span', { fontFamily: T.mono, fontSize: '10px', fontWeight: '400', color: T.muted, letterSpacing: '0.03em' });
    emptyHint.textContent = 'PNG · JPG · WEBP · GIF';
    empty.appendChild(emptyIcon);
    empty.appendChild(emptyLabel);
    empty.appendChild(emptyHint);
    wrap.appendChild(empty);

    const preview = mk('div', { display: 'none', position: 'relative', width: '100%', height: '100%' });
    const previewImg = mk('img', { width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '6px' });
    const previewOverlay = mk('div', {
      position: 'absolute', inset: '0',
      background: 'linear-gradient(to top, rgba(8,8,16,0.85) 0%, transparent 50%)',
      borderRadius: '6px', pointerEvents: 'none',
    });
    const previewMeta = mk('div', {
      position: 'absolute', bottom: '8px', left: '10px', right: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none',
    });
    const previewName = mk('span', { fontFamily: T.mono, fontSize: '10px', color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' });
    const clearBtn = mk('button', {
      fontFamily: T.sans, fontSize: '10px', fontWeight: '500', color: T.err,
      background: 'rgba(239,68,68,0.12)', border: `1px solid rgba(239,68,68,0.22)`,
      borderRadius: '4px', padding: '2px 7px', cursor: 'pointer', outline: 'none',
      flexShrink: '0', pointerEvents: 'all',
    });
    clearBtn.textContent = 'Remove';
    previewMeta.appendChild(previewName);
    previewMeta.appendChild(clearBtn);
    preview.appendChild(previewImg);
    preview.appendChild(previewOverlay);
    preview.appendChild(previewMeta);
    wrap.appendChild(preview);

    const fileInput = document.createElement('input');
    fileInput.type   = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif,image/*';
    Object.assign(fileInput.style, { display: 'none' });
    for (const ev of ['mousedown', 'click', 'keydown', 'keypress', 'keyup']) {
      fileInput.addEventListener(ev, e => e.stopImmediatePropagation());
    }
    wrap.appendChild(fileInput);

    function showPreview(file) {
      pendingFile = file;
      const reader = new FileReader();
      reader.onload = e => { previewImg.src = e.target.result; };
      reader.readAsDataURL(file);
      previewName.textContent = file.name;
      empty.style.display     = 'none';
      preview.style.display   = 'block';
      wrap.style.minHeight    = '120px';
      wrap.style.borderStyle  = 'solid';
      wrap.style.borderColor  = T.accBdr;
      wrap.style.background   = T.accDim;
      onFile(file);
    }

    function reset() {
      pendingFile = null;
      previewImg.src          = '';
      empty.style.display     = 'flex';
      preview.style.display   = 'none';
      wrap.style.minHeight    = '56px';
      wrap.style.borderStyle  = 'dashed';
      wrap.style.borderColor  = T.accBdr;
      wrap.style.background   = T.accDim;
      fileInput.value = '';
      onFile(null);
    }

    function acceptFile(file) {
      if (!file || !file.type.startsWith('image/')) { toast('Only image files are accepted', 'error'); return; }
      showPreview(file);
    }

    wrap.addEventListener('click', e => {
      if (e.target === clearBtn || clearBtn.contains(e.target)) return;
      e.stopImmediatePropagation();
      fileInput.click();
    });
    clearBtn.addEventListener('click', e => { e.stopImmediatePropagation(); reset(); });
    fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) acceptFile(file); });
    wrap.addEventListener('dragover', e => {
      e.preventDefault(); e.stopImmediatePropagation();
      wrap.style.borderColor = T.acc;
      wrap.style.background  = T.accDim;
      wrap.style.animation   = 'ax-dz-pulse 1s ease infinite';
    });
    wrap.addEventListener('dragleave', e => {
      e.stopImmediatePropagation();
      if (pendingFile) return;
      wrap.style.borderColor = T.accBdr;
      wrap.style.background  = T.accDim;
      wrap.style.animation   = '';
    });
    wrap.addEventListener('drop', e => {
      e.preventDefault(); e.stopImmediatePropagation();
      wrap.style.animation = '';
      const file = e.dataTransfer?.files?.[0];
      if (file) acceptFile(file);
    });

    wrap._reset = reset;
    return wrap;
  }

