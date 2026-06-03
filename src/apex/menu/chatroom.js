  // ─── Chatroom pane ────────────────────────────────────────────────────────

  function buildChatroomPane() {
    const pane = mk('div', { display: 'none', flexDirection: 'column' });

    // Header — player count
    const header = mk('div', {
      paddingTop: '16px', paddingBottom: '12px',
      borderBottom: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
    });
    const headerLeft = mk('div', { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0', flex: '1' });
    const title = mk('div', { fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt, letterSpacing: '-0.01em' });
    title.textContent = 'Current Chatroom';
    const subtitle = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.sub, lineHeight: '1.5' });
    subtitle.textContent = 'Live roster, chat feed and per-player mood mirror.';
    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);

    const countBadge = mk('span', {
      fontFamily: T.mono, fontSize: '10.5px', fontWeight: '500',
      color: T.acc, background: T.accDim, border: `1px solid ${T.accBdr}`,
      borderRadius: '4px', padding: '3px 8px', flexShrink: '0', letterSpacing: '0.03em',
    });
    countBadge.textContent = '0 players';

    const settingsBtn = mk('button', {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '5px 10px',
      background: T.accDim, border: `1px solid ${T.accBdr}`,
      borderRadius: '6px', color: T.acc,
      fontFamily: T.sans, fontSize: '10.5px', fontWeight: '600',
      letterSpacing: '0.03em', cursor: 'pointer', outline: 'none',
      transition: 'background 0.12s, border-color 0.12s',
      flexShrink: '0',
    });
    settingsBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>Settings</span>`;
    settingsBtn.addEventListener('mouseenter', () => {
      settingsBtn.style.background  = T.accGlow;
      settingsBtn.style.borderColor = T.acc;
    });
    settingsBtn.addEventListener('mouseleave', () => {
      settingsBtn.style.background  = T.accDim;
      settingsBtn.style.borderColor = T.accBdr;
    });
    settingsBtn.addEventListener('click', () => openChatroomSettingsMenu());

    header.appendChild(headerLeft);
    header.appendChild(settingsBtn);
    header.appendChild(countBadge);
    pane.appendChild(header);

    // Section: Players
    const playersSec = mk('div', {
      paddingTop: '14px', paddingBottom: '14px',
      borderBottom: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
    });
    const playersLbl = mk('div', {
      fontFamily: T.sans, fontSize: '10px', fontWeight: '600',
      color: T.sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px',
    });
    playersLbl.textContent = 'Players';
    playersSec.appendChild(playersLbl);
    const playersList = mk('div', {
      display: 'flex', flexDirection: 'column', gap: '4px',
      maxHeight: '208px',   // ~4 rows at 48px each (32 avatar + padding + gap)
      overflowY: 'auto',
      paddingRight: '4px',
    });
    playersList.classList.add(UID.crScroll);
    playersSec.appendChild(playersList);
    pane.appendChild(playersSec);

    // Section: Feed
    const feedSec = mk('div', {
      paddingTop: '14px', paddingBottom: '20px', boxSizing: 'border-box',
    });
    const feedLbl = mk('div', {
      fontFamily: T.sans, fontSize: '10px', fontWeight: '600',
      color: T.sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px',
    });
    feedLbl.textContent = 'Activity Feed';
    feedSec.appendChild(feedLbl);
    const feedList = mk('div', {
      display: 'flex', flexDirection: 'column', gap: '4px',
      maxHeight: '280px', overflowY: 'auto',
      paddingRight: '4px',
    });
    feedList.classList.add(UID.crScroll);
    feedSec.appendChild(feedList);
    pane.appendChild(feedSec);

    refs.crCountBadge = countBadge;
    refs.crPlayersList = playersList;
    refs.crFeedList    = feedList;

    return pane;
  }

  // ─── Chatroom Settings (floating panel) ───────────────────────────────────
  // Hide/show the local roster + opt into invisible-join (huge position
  // offsets on outgoing WS 7001).

  let crSettingsMenu  = null;
  const crSettingsDrag = { on: false, ox: 0, oy: 0 };
  // Backup snapshot of the roster while it's "hidden". When restored, we
  // re-merge it into state.chatroomUsers so the UI repopulates instantly.
  const crHidden = { active: false, users: null };

  function openChatroomSettingsMenu() {
    buildChatroomSettingsMenu();
    crSettingsMenu.style.display = 'flex';
    _refreshCrSettingsUI();
  }

  function buildChatroomSettingsMenu() {
    if (crSettingsMenu) return;

    const win = mk('div', {
      position: 'fixed', bottom: '24px', right: '24px',
      width: '320px', maxWidth: 'calc(100vw - 32px)',
      background: T.bg, border: `1px solid ${T.bdr}`,
      borderRadius: '12px',
      boxShadow: `0 0 0 1px ${T.accGlow} inset, 0 24px 60px rgba(0,0,0,0.85), 0 0 50px ${T.accDim}`,
      zIndex: '2147483646', fontFamily: T.sans,
      display: 'none', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box',
      animation: 'ax-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      maxHeight: 'calc(100vh - 48px)',
    });

    for (const ev of ['mousedown', 'mouseup', 'mousemove', 'click', 'wheel', 'touchstart', 'touchend', 'touchmove']) {
      win.addEventListener(ev, e => e.stopImmediatePropagation(), { passive: ev.startsWith('touch') || ev === 'wheel' });
    }

    const head = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', height: '44px',
      background: T.sur, borderBottom: `1px solid ${T.bdrSub}`,
      cursor: 'grab', userSelect: 'none', flexShrink: '0',
    });
    const headLeft = mk('div', { display: 'flex', alignItems: 'center', gap: '8px' });
    const headIcon = mk('span', { color: T.acc, display: 'flex', alignItems: 'center' });
    headIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
      const headTitle = mk('span', {
        fontFamily: T.sans, fontSize: '11px', fontWeight: '700',
        letterSpacing: '0.12em', color: T.txt, textTransform: 'uppercase',
      });
      headTitle.textContent = 'CHATROOM SETTINGS';
      headLeft.appendChild(headIcon);
      headLeft.appendChild(headTitle);

      const closeBtn = buildCtrlBtn(
        `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        'Close', true
      );
      closeBtn.addEventListener('click', () => { win.style.display = 'none'; });
      head.appendChild(headLeft);
      head.appendChild(closeBtn);

      head.addEventListener('mousedown', e => {
        if (e.target.closest('button')) return;
        e.stopImmediatePropagation(); e.preventDefault();
        const rect = win.getBoundingClientRect();
        crSettingsDrag.on = true;
        crSettingsDrag.ox = e.clientX - rect.left;
        crSettingsDrag.oy = e.clientY - rect.top;
        head.style.cursor = 'grabbing';
        const onMove = ev => {
          if (!crSettingsDrag.on) return;
          win.style.left   = Math.min(Math.max(0, ev.clientX - crSettingsDrag.ox), innerWidth  - win.offsetWidth)  + 'px';
          win.style.top    = Math.min(Math.max(0, ev.clientY - crSettingsDrag.oy), innerHeight - win.offsetHeight) + 'px';
          win.style.right  = 'auto';
          win.style.bottom = 'auto';
        };
        const onUp = () => {
          crSettingsDrag.on = false;
          head.style.cursor = 'grab';
          window.removeEventListener('mousemove', onMove, true);
          window.removeEventListener('mouseup',   onUp,   true);
        };
        window.addEventListener('mousemove', onMove, true);
        window.addEventListener('mouseup',   onUp,   true);
      });

      win.appendChild(head);

      const body = mk('div', {
        padding: '14px 14px 16px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '14px',
        overflowY: 'auto',
      });

      // ── Roster visibility ─────────────────────────────────────────────
      const rosterLbl = mk('div', {
        fontFamily: T.sans, fontSize: '10px', fontWeight: '600',
        color: T.sub, letterSpacing: '0.08em', textTransform: 'uppercase',
      });
      rosterLbl.textContent = 'Local Roster';

      const rosterHint = mk('div', {
        fontFamily: T.sans, fontSize: '11px', color: T.sub, lineHeight: '1.5',
        marginTop: '-6px',
      });
      rosterHint.textContent = 'Simulate every player leaving the chatroom from your view. Server-side roster is untouched — only your local UI changes.';

      const rosterBtns = mk('div', { display: 'flex', gap: '8px' });

      const hideBtn = buildBtn('Hide Players', null, 'danger');
      hideBtn.addEventListener('click', () => { _crHideAllPlayers(); _refreshCrSettingsUI(); });

      rosterBtns.appendChild(hideBtn);
      refs.crHideBtn = hideBtn;

      body.appendChild(rosterLbl);
      body.appendChild(rosterHint);
      body.appendChild(rosterBtns);

      // ── Invisible-join toggle ─────────────────────────────────────────
      const invSep = mk('div', { height: '1px', background: T.bdrSub, margin: '4px -14px' });
      body.appendChild(invSep);

      const invRow = buildToggleRow(
        'Join Out Of Map (invisible)',
        'Adds a large offset to your outgoing position (WS 7001) so other clients render you far outside the playable area and effectively can\'t see you.',
        state.misc.invisibleJoin,
        checked => {
          state.misc.invisibleJoin = checked;
          _prefsSet(_PK.invisJoin, checked ? '1' : '0');
          toast(`Invisible join ${checked ? 'enabled' : 'disabled'}`, checked ? 'success' : 'info');
        }
      );
      body.appendChild(invRow);

      win.appendChild(body);

      crSettingsMenu = win;
      (shRoot() ?? document.body).appendChild(win);
    }

  function _refreshCrSettingsUI() {
    if (!refs.crHideBtn) return;
    refs.crHideBtn.setDisabled(crHidden.active);
  }

  function _crHideAllPlayers() {
    if (crHidden.active) return;
    const ws = state.chatroomSocket;
    if (!ws || ws.readyState !== _nativeWS.OPEN) {
      toast('No active chatroom socket', 'warn');
      return;
    }
    // Snapshot every entry so we can restore it later (uses the raw 2000 /
    // 20000 packets we cached so the game receives the exact same shape).
    crHidden.active = true;
    crHidden.users = new Map();
    const self = state.profileId;
    for (const [pid, raw] of state.chatroomRawJoins) {
      if (pid === self) continue;
      crHidden.users.set(pid, raw);
      // Dispatch a synthetic 20090 (user-left) so the game's own roster
      // handler tears down the avatar in Unity. `_axSynthetic` tells our own
      // tracking to ignore the round-trip.
      const packet = '42' + JSON.stringify(['message', {
        messageType: '20090',
        messageContent: { sessionId: raw.sessionId, profileId: pid, _axSynthetic: 1 },
      }]);
      try {
        ws.dispatchEvent(new MessageEvent('message', { data: packet, origin: '' }));
      } catch { /* WS may be in a transitional state */ }
    }
    _refreshChatroomPlayers();
    toast(`Hid ${crHidden.users.size} player${crHidden.users.size === 1 ? '' : 's'}`, 'success');
  }

  function _crShowAllPlayers() {
    if (!crHidden.active) return;
    const ws = state.chatroomSocket;
    if (!ws || ws.readyState !== _nativeWS.OPEN) {
      // No live socket — just clear local state.
      crHidden.users = null;
      crHidden.active = false;
      toast('No active chatroom socket; cleared local state', 'warn');
      _refreshChatroomPlayers();
      return;
    }
    let count = 0;
    if (crHidden.users) {
      for (const [pid, raw] of crHidden.users) {
        // Re-dispatch a 20000 (user-joined) packet with the original profile
        // data so the Unity client re-spawns the avatar.
        const packet = '42' + JSON.stringify(['message', {
          messageType: '20000',
          messageContent: {
            profileId: pid,
            sessionId: raw.sessionId,
            profileData: raw.profileData,
            _axSynthetic: 1,
          },
        }]);
        try {
          ws.dispatchEvent(new MessageEvent('message', { data: packet, origin: '' }));
          count++;
        } catch { /* ignore individual failures */ }
      }
    }
    crHidden.users = null;
    crHidden.active = false;
    _refreshChatroomPlayers();
    toast(`Restored ${count} player${count === 1 ? '' : 's'}`, 'success');
  }

