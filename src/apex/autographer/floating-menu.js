  let agFloatingMenu = null;
  const agFloatDrag  = { on: false, ox: 0, oy: 0 };

  function buildAgFloatingMenu() {
    if (agFloatingMenu) return;

    const win = mk('div', {
      position: 'fixed', bottom: '24px', right: '24px',
      width: '310px', maxWidth: 'calc(100vw - 32px)',
      background: T.bg, border: `1px solid ${T.bdr}`,
      borderRadius: '12px',
      boxShadow: `0 0 0 1px ${T.accGlow} inset, 0 24px 60px rgba(0,0,0,0.85), 0 0 50px ${T.accDim}`,
      zIndex: '2147483646', fontFamily: T.sans,
      display: 'none', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box',
      animation: 'ax-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      maxHeight: 'calc(100vh - 48px)',
    });
    win.id = UID.agFloat;

    for (const ev of ['mousedown', 'mouseup', 'mousemove', 'click', 'wheel', 'touchstart', 'touchend', 'touchmove']) {
      win.addEventListener(ev, e => e.stopImmediatePropagation(), { passive: ev.startsWith('touch') || ev === 'wheel' });
    }

    const bar = mk('div', {
      position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px',
      background: `linear-gradient(180deg, transparent 0%, ${T.acc} 30%, ${T.accBdr} 70%, transparent 100%)`,
      borderRadius: '2px 0 0 2px', opacity: '0.6', pointerEvents: 'none',
    });
    win.appendChild(bar);

    const head = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', height: '44px',
      background: T.sur, borderBottom: `1px solid ${T.bdrSub}`,
      cursor: 'grab', userSelect: 'none', flexShrink: '0',
    });

    const headLeft = mk('div', { display: 'flex', alignItems: 'center', gap: '8px' });
    const headIcon = mk('span', { color: T.acc, display: 'flex', alignItems: 'center' });
    headIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    const headTitle = mk('span', {
      fontFamily: T.sans, fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.12em', color: T.txt, textTransform: 'uppercase',
    });
    headTitle.textContent = 'AUTOGRAPHER';
    headLeft.appendChild(headIcon);
    headLeft.appendChild(headTitle);

    const headRight = mk('div', { display: 'flex', gap: '4px' });
    const closeBtn = buildCtrlBtn(
      `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      'Close', true
    );
    closeBtn.addEventListener('click', () => { win.style.display = 'none'; });
    headRight.appendChild(closeBtn);

    head.appendChild(headLeft);
    head.appendChild(headRight);

    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      e.stopImmediatePropagation(); e.preventDefault();
      const rect = win.getBoundingClientRect();
      agFloatDrag.on = true;
      agFloatDrag.ox = e.clientX - rect.left;
      agFloatDrag.oy = e.clientY - rect.top;
      head.style.cursor = 'grabbing';
      const onMove = ev => {
        if (!agFloatDrag.on) return;
        win.style.left   = Math.min(Math.max(0, ev.clientX - agFloatDrag.ox), innerWidth  - win.offsetWidth)  + 'px';
        win.style.top    = Math.min(Math.max(0, ev.clientY - agFloatDrag.oy), innerHeight - win.offsetHeight) + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
      };
      const onUp = () => {
        agFloatDrag.on = false;
        head.style.cursor = 'grab';
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup',   onUp,   true);
      };
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('mouseup',   onUp,   true);
    });

    win.appendChild(head);

    const body = mk('div', {
      overflowY: 'auto', overflowX: 'hidden',
      padding: '12px 14px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: '0',
    });
    win.appendChild(body);
    refs.agFloatBody = body;

    agFloatingMenu = win;
    (shRoot() ?? document.body).appendChild(win);
    _buildAgFloatingContent();
  }

  function _buildAgFloatingContent() {
    const body = refs.agFloatBody;
    if (!body) return;
    body.innerHTML = '';

    const ag  = state.autographer;
    const sec = (title, badge, content) => {
      const wrap = mk('div', { paddingBottom: '14px', marginBottom: '14px', borderBottom: `1px solid ${T.bdrSub}` });
      const hdr  = mk('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' });
      const lbl  = mk('div', { fontFamily: T.sans, fontSize: '10px', fontWeight: '700', letterSpacing: '0.09em', color: T.sub, textTransform: 'uppercase' });
      lbl.textContent = title;
      hdr.appendChild(lbl);
      if (badge) hdr.appendChild(badge);
      wrap.appendChild(hdr);
      for (const el of content) if (el) wrap.appendChild(el);
      return wrap;
    };

    const targetEls = [];

    if (ag.targetProfile) {
      const card = mk('div', {
        display: 'flex', gap: '10px', alignItems: 'center',
        padding: '9px 10px', background: T.accDim,
        border: `1px solid ${T.accBdr}`, borderRadius: '7px', marginBottom: '0',
        position: 'relative',
      });
      if (ag.targetFaceUrl) {
        const img = mk('img', {
          width: '38px', height: '38px', borderRadius: '6px',
          objectFit: 'cover', flexShrink: '0',
          background: T.sur, border: `1px solid ${T.bdrSub}`,
        });
        img.src = ag.targetFaceUrl;
        img.onerror = () => { img.style.display = 'none'; };
        card.appendChild(img);
      }
      const info = mk('div', { flex: '1', minWidth: '0', overflow: 'hidden' });
      const nameRow = mk('div', { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' });
      const nameEl = mk('div', { fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1', minWidth: '0' });
      nameEl.textContent = ag.targetProfile.name;
      const lockBadge = mk('span', {
        fontFamily: T.mono, fontSize: '9px', fontWeight: '600',
        color: T.acc, background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${T.accBdr}`, borderRadius: '4px',
        padding: '1px 6px', flexShrink: '0', letterSpacing: '0.05em',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
      });
      lockBadge.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><span>LOCKED</span>';
      nameRow.appendChild(nameEl);
      nameRow.appendChild(lockBadge);
      const idEl = mk('div', { fontFamily: T.mono, fontSize: '9px', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
      idEl.textContent = ag.targetProfile.id;
      info.appendChild(nameRow);
      info.appendChild(idEl);
      card.appendChild(info);

      const clearBtn = mk('button', {
        fontFamily: T.sans, fontSize: '9px', color: T.sub,
        background: 'transparent', border: `1px solid ${T.bdrSub}`,
        borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', outline: 'none', flexShrink: '0',
      });
      clearBtn.textContent = '✕';
      clearBtn.title = 'Unlock & clear target';
      clearBtn.addEventListener('click', () => {
        if (ag.running) { toast('Stop the autographer first', 'error'); return; }
        ag.targetProfile = null;
        ag.targetFaceUrl = null;
        ag.searchResults = [];
        ag.searchQuery   = '';
        _buildAgFloatingContent();
      });
      card.appendChild(clearBtn);
      targetEls.push(card);
    } else {
      targetEls.push(buildInfoBanner('Search for a player below to lock them as your autograph target.'));

      const searchRow = mk('div', { display: 'flex', gap: '6px', marginTop: '10px', marginBottom: '0', alignItems: 'stretch' });
      const searchInp = buildInput('Search player username…');
      searchInp.style.marginBottom = '0';
      searchInp.style.flex = '1';
      searchInp.value = ag.searchQuery ?? '';

      const searchBtn = mk('button', {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        padding: '8px 12px', background: T.accDim,
        border: `1px solid ${T.accBdr}`, borderRadius: '6px',
        color: T.acc, fontFamily: T.sans, fontSize: '11px', fontWeight: '500',
        cursor: 'pointer', outline: 'none', flexShrink: '0', whiteSpace: 'nowrap',
        transition: 'background 0.15s, border-color 0.15s',
      });
      searchBtn.textContent = ag.searching ? 'Searching…' : 'Search';
      searchBtn.disabled    = ag.searching;
      if (ag.searching) searchBtn.style.opacity = '0.6';
      const _doSearch = () => _autographerSearchPlayers(searchInp.value);
      searchBtn.addEventListener('mouseenter', () => { if (!searchBtn.disabled) { searchBtn.style.background = T.accGlow; searchBtn.style.borderColor = T.accBdr; } });
      searchBtn.addEventListener('mouseleave', () => { searchBtn.style.background = T.accDim; searchBtn.style.borderColor = T.accBdr; });
      searchBtn.addEventListener('click', _doSearch);
      searchInp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); _doSearch(); } });
      searchRow.appendChild(searchInp);
      searchRow.appendChild(searchBtn);
      targetEls.push(searchRow);

      if (ag.searchResults && ag.searchResults.length) {
        const resultsList = mk('div', {
          marginTop: '8px', maxHeight: '230px', overflowY: 'auto',
          background: T.sur, border: `1px solid ${T.bdrSub}`, borderRadius: '7px',
        });
        ag.searchResults.forEach((r, idx) => {
          const row = mk('div', {
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '7px 9px', cursor: 'pointer',
            borderBottom: idx < ag.searchResults.length - 1 ? `1px solid ${T.bdrSub}` : 'none',
            transition: 'background 0.12s',
          });
          const img = mk('img', {
            width: '30px', height: '30px', borderRadius: '5px',
            objectFit: 'cover', flexShrink: '0',
            background: T.bg, border: `1px solid ${T.bdrSub}`,
          });
          img.alt = '';
          img.setAttribute('data-face-id', r.id);
          if (r.faceUrl) img.src = r.faceUrl;
          img.onerror = () => { img.style.opacity = '0.25'; };

          const txt = mk('div', { flex: '1', minWidth: '0' });
          const nm  = mk('div', { fontFamily: T.sans, fontSize: '11.5px', fontWeight: '600', color: T.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
          nm.textContent = r.name;
          const idLine = mk('div', { fontFamily: T.mono, fontSize: '9px', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
          idLine.textContent = r.id;
          txt.appendChild(nm);
          txt.appendChild(idLine);

          row.appendChild(img);
          row.appendChild(txt);

          if (r.vip) {
            const vipBadge = mk('span', {
              fontFamily: T.mono, fontSize: '9px', fontWeight: '600',
              color: T.acc, background: T.accDim, border: `1px solid ${T.accBdr}`,
              borderRadius: '4px', padding: '2px 6px', flexShrink: '0', letterSpacing: '0.04em',
            });
            vipBadge.textContent = 'VIP';
            row.appendChild(vipBadge);
          }

          row.addEventListener('mouseenter', () => { row.style.background = T.accDim; });
          row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
          row.addEventListener('click', () => _autographerSelectSearchResult(r.id));

          resultsList.appendChild(row);
        });
        targetEls.push(resultsList);
      } else if (ag.searching) {
        const hint = mk('div', {
          marginTop: '8px', fontFamily: T.mono, fontSize: '10px',
          color: T.sub, textAlign: 'center', padding: '8px',
        });
        hint.textContent = 'Searching players…';
        targetEls.push(hint);
      }
    }

    body.appendChild(sec('Target', null, targetEls));

    const vipHint = mk('div', {
      fontFamily: T.sans, fontSize: '10.5px', color: T.sub,
      marginBottom: '10px', lineHeight: '1.55',
    });
    vipHint.textContent = ag.vipChecked
      ? (ag.isVip
          ? 'VIP membership detected — your account is eligible for the accelerated tier, dispatching one autograph every 2 minutes (30 per hour) until the requested quota is reached.'
          : 'Standard (non-VIP) account detected — the server enforces a strict cooldown of one autograph per hour. Upgrade to VIP to lift the limit up to one every 2 minutes.')
      : 'Delivery rate is gated by your membership: VIP members can send one autograph every 2 minutes (up to 30 per hour), while Standard accounts are throttled to one autograph per hour. Your tier will be detected automatically once dispatch starts.';

    const countSel = buildSelect([['1','1'],['5','5'],['10','10'],['25','25'],['50','50'],['0','Unlimited']]);
    countSel.value = String(ag.maxCount);
    refs.agFloatCountSel = countSel;

    const instRow = mk('div', {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '10px', marginBottom: '8px', cursor: 'pointer',
    });
    const instText = mk('div', { flex: '1' });
    const instLbl  = mk('div', { fontFamily: T.sans, fontSize: '11px', fontWeight: '600', color: T.txt, marginBottom: '2px' });
    instLbl.textContent = '⚡ Instant Mode';
    const instDesc = mk('div', { fontFamily: T.sans, fontSize: '10px', color: T.sub, lineHeight: '1.5' });
    instDesc.textContent = 'Send without delay between each action';
    instText.appendChild(instLbl); instText.appendChild(instDesc);

    const instTrack = mk('div', {
      position: 'relative', flexShrink: '0', width: '32px', height: '17px', borderRadius: '9px',
      background: ag.instantMode ? T.acc : 'rgba(255,255,255,0.08)',
      border: `1px solid ${ag.instantMode ? T.acc : T.bdrSub}`,
      transition: 'background 0.2s, border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box', marginTop: '2px',
    });
    const instKnob = mk('div', {
      position: 'absolute', top: '2px', left: ag.instantMode ? '15px' : '2px',
      width: '11px', height: '11px', borderRadius: '50%',
      background: ag.instantMode ? T.bg : T.sub,
      transition: 'left 0.2s, background 0.2s',
    });
    instTrack.appendChild(instKnob);
    instRow.appendChild(instText); instRow.appendChild(instTrack);
    instRow.addEventListener('click', () => {
      ag.instantMode = !ag.instantMode;
      instTrack.style.background  = ag.instantMode ? T.acc : 'rgba(255,255,255,0.08)';
      instTrack.style.borderColor = ag.instantMode ? T.acc : T.bdrSub;
      instKnob.style.left         = ag.instantMode ? '15px' : '2px';
      instKnob.style.background   = ag.instantMode ? T.bg : T.sub;
      toast(`Instant Mode ${ag.instantMode ? 'on — no delay' : 'off — 1-2s delay'}`, 'info');
    });

    const statusEl = mk('div', { fontFamily: T.mono, fontSize: '10px', color: T.sub, marginBottom: '8px', minHeight: '14px' });
    if (ag.running) {
      const max = ag.maxCount > 0 ? `/ ${ag.maxCount}` : '/ ∞';
      statusEl.textContent = `Sent ${ag.sentCount} ${max}${ag.instantMode ? '' : ` · Next in ${_fmtSec(ag.nextInSec)}`}`;
    }
    refs.agFloatStatus = statusEl;

    const startStopBtn = ag.running
      ? buildBtn('Stop Autographer', 'stop', 'danger')
      : buildBtn('Start Autographer', 'autograph');
    startStopBtn.addEventListener('click', () => {
      if (ag.running) autographerStop(false);
      else            autographerStart();
    });

    body.appendChild(sec('Autograph to Target', null, [vipHint, countSel, statusEl, startStopBtn]));

    const n = state.chatroomUsers.size;
    const userBadge = mk('span', {
      fontFamily: T.mono, fontSize: '9.5px', fontWeight: '500',
      color: n > 0 ? T.ok : T.sub,
      background: n > 0 ? T.okDim : 'rgba(255,255,255,0.04)',
      border: `1px solid ${n > 0 ? T.okBdr : T.bdrSub}`,
      borderRadius: '4px', padding: '2px 6px',
    });
    userBadge.textContent = `${n} user${n !== 1 ? 's' : ''}`;
    refs.agUserBadge = userBadge;

    const greetNotice = n === 0 ? buildInfoBanner("Join a chatroom \u2014 APEX will track who's there automatically.") : null;

    const spingBtn = buildBtn('Send LoveGreeting to All', 'autograph');
    spingBtn.style.marginBottom = '8px';
    if (ag.greetingAllRunning && ag.greetingAllType === 'LoveGreeting') spingBtn.setLoading(true);
    else spingBtn.setDisabled(n === 0 || ag.greetingAllRunning);
    spingBtn.addEventListener('click', () => _sendGreetingToAll('LoveGreeting'));

    const starBtn = buildBtn('Send StarGreeting to All', 'autograph');
    if (ag.greetingAllRunning && ag.greetingAllType === 'StarGreeting') starBtn.setLoading(true);
    else starBtn.setDisabled(n === 0 || ag.greetingAllRunning);
    starBtn.addEventListener('click', () => _sendGreetingToAll('StarGreeting'));

    const stopGreetBtn = ag.greetingAllRunning ? buildBtn('Stop Sending', 'stop', 'danger') : null;
    if (stopGreetBtn) stopGreetBtn.addEventListener('click', () => { ag.greetingAllAbort = true; });

    const greetProg = mk('div', { fontFamily: T.mono, fontSize: '10px', color: ag.greetingAllRunning ? T.acc : T.sub, marginTop: '8px', minHeight: '14px' });
    if (ag.greetingAllRunning) {
      greetProg.textContent = `${ag.greetingAllType} — ${ag.greetingAllProgress} / ${ag.greetingAllTotal} sent`;
    }
    refs.agGreetProgress = greetProg;

    const greetSec = sec('Chatroom Greetings', userBadge, [greetNotice, spingBtn, starBtn, stopGreetBtn, greetProg]);
    greetSec.style.borderBottom = 'none';
    greetSec.style.marginBottom = '0';
    greetSec.style.paddingBottom = '4px';
    body.appendChild(greetSec);

    instRow.style.marginTop = '12px';
    body.appendChild(instRow);
  }

