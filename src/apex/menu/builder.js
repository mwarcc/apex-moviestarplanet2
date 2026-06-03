  // ─── Menu ─────────────────────────────────────────────────────────────────

  let menu      = null;
  let minimd    = false;
  let activeTab = 'profile';

  const drag  = { on: false, ox: 0, oy: 0 };
  const refs  = {};

  // First row of tabs.
  const TAB_DEFS = [
    ['profile', 'Profile', `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`],
    ['auto',    'Auto',    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`],
    ['friends', 'Friends', `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`],
    ['bots',    'Bots',    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>`],
    ['misc',    'Misc',    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>`],
  ];
  // Tabs displayed on a second row (to keep the first row from overflowing).
  const TAB_DEFS_ROW2 = [
    ['chatroom', 'Chatroom', `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>`],
  ];
  const ALL_TAB_IDS = [...TAB_DEFS, ...TAB_DEFS_ROW2].map(d => d[0]);

  function buildMenu() {
    const wrap = mk('div', {
      position: 'fixed', top: '16px', right: '16px', left: 'auto',
      width: '370px', maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 32px)',
      background: T.bg, border: `1px solid ${T.bdr}`,
      borderRadius: '12px',
      boxShadow: `0 0 0 1px ${T.accGlow} inset, 0 32px 80px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.5), 0 0 60px ${T.accDim}`,
      zIndex: '2147483647', fontFamily: T.sans,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box',
      animation: 'ax-in 0.24s cubic-bezier(0.16, 1, 0.3, 1) both',
    });
    // Random ID — not "ax-wrap" or any static string
    wrap.id = UID.wrap;

    for (const ev of ['mousedown', 'mouseup', 'mousemove', 'click', 'touchstart', 'touchend', 'touchmove', 'wheel']) {
      wrap.addEventListener(ev, e => e.stopImmediatePropagation(), { passive: ev.startsWith('touch') || ev === 'wheel' });
    }

    const accentBar = mk('div', {
      position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px',
      background: `linear-gradient(180deg, transparent 0%, ${T.acc} 30%, ${T.accBdr} 70%, transparent 100%)`,
      borderRadius: '2px 0 0 2px', opacity: '0.6', pointerEvents: 'none',
    });
    wrap.appendChild(accentBar);
    wrap.appendChild(buildHeader(wrap));

    // Absolute-positioned settings overlay (below the 52px header)
    const sPanel = buildSettingsPanel();
    wrap.appendChild(sPanel);
    refs.settingsPanel = sPanel;

    wrap.appendChild(buildTabBar());
    wrap.appendChild(buildBody());
    return wrap;
  }

  function buildHeader(wrap) {
    const head = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', height: '52px',
      background: T.sur, borderBottom: `1px solid ${T.bdrSub}`,
      cursor: 'grab', userSelect: 'none', flexShrink: '0',
    });

    const wordmark = mk('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', flex: '1' });
    const nameRow  = mk('div', { display: 'flex', alignItems: 'center', gap: '7px' });
    const nameText = mk('span', { fontFamily: T.sans, fontSize: '13px', fontWeight: '700', letterSpacing: '0.16em', color: T.acc, textTransform: 'uppercase' });
    nameText.textContent = 'APEX';
    const versionPill = mk('span', {
      fontFamily: T.mono, fontSize: '9px', fontWeight: '400', color: T.sub, letterSpacing: '0.05em',
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.bdrSub}`, borderRadius: '3px', padding: '1px 5px',
    });
    versionPill.textContent = 'v3';
    const subtitle = mk('span', { fontFamily: T.sans, fontSize: '10px', fontWeight: '400', color: T.sub, letterSpacing: '0.01em', lineHeight: '1' });
    subtitle.textContent = 'MSP2 Toolkit by 0xFen';
    nameRow.appendChild(nameText);
    nameRow.appendChild(versionPill);
    wordmark.appendChild(nameRow);
    wordmark.appendChild(subtitle);

    const settBtn  = buildCtrlBtn(
      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
      'Settings', true
    );
    const minBtn   = buildCtrlBtn(
      `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      'Minimise', true
    );
    const ctrl = mk('div', { display: 'flex', gap: '5px', flexShrink: '0' });
    ctrl.appendChild(settBtn);
    ctrl.appendChild(minBtn);
    head.appendChild(wordmark);
    head.appendChild(ctrl);

    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      drag.on = true;
      drag.ox = e.clientX - rect.left;
      drag.oy = e.clientY - rect.top;
      head.style.cursor = 'grabbing';
      const onMove = ev => {
        if (!drag.on) return;
        wrap.style.left  = Math.min(Math.max(0, ev.clientX - drag.ox), innerWidth  - wrap.offsetWidth)  + 'px';
        wrap.style.top   = Math.min(Math.max(0, ev.clientY - drag.oy), innerHeight - wrap.offsetHeight) + 'px';
        wrap.style.right = 'auto';
      };
      const onUp = () => {
        drag.on = false;
        head.style.cursor = 'grab';
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup',   onUp,   true);
      };
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('mouseup',   onUp,   true);
    });

    settBtn.addEventListener('click', () => {
      if (!refs.settingsPanel) return;
      const isOpen = refs.settingsPanel.style.display !== 'none';
      refs.settingsPanel.style.display = isOpen ? 'none' : 'block';
      settBtn.style.color      = isOpen ? T.sub    : T.acc;
      settBtn.style.background = isOpen ? 'transparent' : T.accDim;
    });

    minBtn.addEventListener('click', () => {
      minimd = !minimd;
      refs.tabBar.style.display = minimd ? 'none' : 'flex';
      refs.body.style.display   = minimd ? 'none' : 'block';
      wrap.style.maxHeight      = minimd ? 'none' : 'calc(100vh - 32px)';
      minBtn.innerHTML = minimd
        ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
        : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    });

    refs.minBtn = minBtn;
    return head;
  }

  function buildCtrlBtn(svgStr, title, noBorder) {
    const btn = mk('button', {
      width: '28px', height: '28px',
      border: noBorder ? 'none' : `1px solid ${T.bdrSub}`,
      outline: 'none',
      background: 'transparent', borderRadius: '5px', color: T.sub, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.12s, border-color 0.12s, color 0.12s',
      flexShrink: '0', padding: '0', boxSizing: 'border-box',
    });
    btn.title     = title;
    btn.innerHTML = svgStr;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.06)';
      if (!noBorder) btn.style.borderColor = 'rgba(255,255,255,0.12)';
      btn.style.color = T.txt;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      if (!noBorder) btn.style.borderColor = T.bdrSub;
      btn.style.color = T.sub;
    });
    return btn;
  }

  function buildTabBar() {
    const container = mk('div', {
      background: T.sur, borderBottom: `1px solid ${T.bdrSub}`,
      flexShrink: '0', display: 'flex', flexDirection: 'column',
    });
    const tabBtns = {};
    const mkTabBtn = (id, label, iconSvg) => {
      const tab = mk('button', {
        flex: '1', padding: '9px 2px', background: 'none', border: 'none',
        borderBottom: `2px solid transparent`, outline: 'none',
        fontFamily: T.sans, fontSize: '10px', fontWeight: '500', color: T.sub, cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '-1px', whiteSpace: 'nowrap',
      });
      tab.innerHTML = `${iconSvg}<span>${label}</span>`;
      tabBtns[id] = tab;
      tab.addEventListener('click',      () => switchTab(id));
      tab.addEventListener('mouseenter', () => { if (activeTab !== id) tab.style.color = 'rgba(240,238,232,0.6)'; });
      tab.addEventListener('mouseleave', () => { if (activeTab !== id) tab.style.color = T.sub; });
      return tab;
    };

    const row1 = mk('div', { display: 'flex', padding: '0 14px', gap: '0' });
    for (const [id, label, iconSvg] of TAB_DEFS) row1.appendChild(mkTabBtn(id, label, iconSvg));
    container.appendChild(row1);

    if (TAB_DEFS_ROW2.length) {
      const row2 = mk('div', {
        display: 'flex', padding: '0 14px', gap: '0',
        borderTop: `1px solid ${T.bdrSub}`,
      });
      for (const [id, label, iconSvg] of TAB_DEFS_ROW2) row2.appendChild(mkTabBtn(id, label, iconSvg));
      container.appendChild(row2);
    }

    refs.tabBtns = tabBtns;
    refs.tabBar  = container;
    return container;
  }

  function buildBody() {
    const body = mk('div', {
      flex: '1', overflowY: 'auto', overflowX: 'hidden',
      padding: '0 14px', background: T.bg,
      minHeight: '0', boxSizing: 'border-box',
    });
    body.id = UID.body;

    const makeSkel = rows => {
      const d = mk('div', { display: 'none', flexDirection: 'column' });
      for (let i = 0; i < rows; i++) d.appendChild(buildSkeletonCard(i === 0 ? 0 : 1));
      return d;
    };

    const skels = {
      profile:  makeSkel(3), auto:     makeSkel(3),
      friends:  makeSkel(2), bots:     makeSkel(1), misc: makeSkel(1),
      chatroom: makeSkel(2),
    };

    const panes = {
      profile:  buildProfilePane(),
      auto:     buildAutoPane(),
      friends:  buildFriendsPane(),
      bots:     buildBotsPane(),
      misc:     buildMiscPane(),
      chatroom: buildChatroomPane(),
    };

    for (const skel of Object.values(skels)) body.appendChild(skel);
    for (const pane of Object.values(panes)) body.appendChild(pane);

    refs.skelPanes = skels;
    refs.panes     = panes;
    refs.body      = body;
    return body;
  }

  function buildProfilePane() {
    const pane = mk('div', { display: 'none', flexDirection: 'column' });

    const gBtn = buildBtn('Exchange Gender', 'gender');
    gBtn.addEventListener('click', performGenderSwap);
    pane.appendChild(buildSection(buildSectionHead('Gender', 'Switch your avatar between masculine and feminine appearances instantly. All equipped items and customizations remain unchanged.'), gBtn));

    const moodSel = buildSelect([['', 'Choose a mood…'], ...MOODS.map(m => [m, m])]);
    moodSel.id = UID.mood;
    const mBtn = buildBtn('Apply Mood', 'mood');
    mBtn.addEventListener('click', () => performMoodChange());
    pane.appendChild(buildSection(buildSectionHead('Mood', 'Set the emotion your avatar uses in chatrooms.'), moodSel, mBtn));

    const statusInput = buildInput('What are you doing?');
    statusInput.id    = UID.status;
    statusInput.maxLength = 100;
    const sBtn = buildBtn('Update Status', 'status');
    sBtn.addEventListener('click', performStatusUpdate);
    const rBtn = buildBtn('Restore Status', 'restore');
    rBtn.addEventListener('click', openRestoreFloatingMenu);
    const sRow = mk('div', { display: 'flex', gap: '8px', width: '100%' });
    sBtn.style.flex = '1 1 0';
    sBtn.style.minWidth = '0';
    rBtn.style.flex = '1 1 0';
    rBtn.style.minWidth = '0';
    sRow.appendChild(sBtn);
    sRow.appendChild(rBtn);
    pane.appendChild(buildSection(buildSectionHead('Status', 'Update your "What Are You Doing" message without losing Loveits or Comments. Keeps your social engagement history intact.'), statusInput, sRow));

    const avatarSection = buildSection(
      buildSectionHead(
        'Custom Profile Picture',
        'Upload any image format and APEX automatically compresses and optimizes it to meet platform requirements.'
      )
    );
    avatarSection.style.borderBottom = 'none';

    let pendingAvatarFile = null;

    const dropzone = buildDropzone(file => {
      pendingAvatarFile = file;
      syncAvatarBtn();
    });

    const avatarBtn = buildBtn('Set as Profile Picture', 'upload');
    avatarBtn.style.marginTop = '10px';
    avatarBtn.addEventListener('click', () => {
      if (!pendingAvatarFile) { toast('Drop or select an image first', 'error'); return; }
      performAvatarUpload(pendingAvatarFile);
    });

    function syncAvatarBtn() {
      const connected = !!state.accessToken;
      if (!connected) { avatarBtn.setDisabled(true); return; }
      avatarBtn.setDisabled(!pendingAvatarFile);
    }

    avatarSection.appendChild(dropzone);
    avatarSection.appendChild(avatarBtn);
    pane.appendChild(avatarSection);

    refs.gBtn           = gBtn;
    refs.mBtn           = mBtn;
    refs.sBtn           = sBtn;
    refs.rBtn           = rBtn;
    refs.avatarBtn      = avatarBtn;
    refs.avatarDropzone = dropzone;
    refs.syncAvatarBtn  = syncAvatarBtn;
    return pane;
  }

  function buildAutoPane() {
    const pane = mk('div', { display: 'none', flexDirection: 'column' });

    const { row: qRow, badge: qBadge } = buildSectionHeadWithBadge('Daily Quests', 'Automatically complete all daily quests including gifts, pet interactions, and challenges. Works for both VIP and non-VIP accounts.');
    qBadge.textContent = '0 done';
    const qBtn = buildBtn('Run Quests', 'quests');
    qBtn.addEventListener('click', performDailyQuests);
    pane.appendChild(buildSection(qRow, qBtn));

    const { row: cRow, badge: cBadge } = buildSectionHeadWithBadge(
      'Spring Crystals',
      'Claim all 40 spring event crystals from plaza, forest, beach, and diamond shop locations in a single run.',
      buildSpeedGear('crystals', 'Crystals')
    );
    cBadge.textContent = '0 / 40';
    const { track: cTrack, bar: cBar } = buildProgress();
    cTrack.style.display = 'none';
    const cBtn = buildBtn('Collect All', 'crystal');
    cBtn.addEventListener('click', performCrystalCollection);
    pane.appendChild(buildSection(cRow, cTrack, cBtn));

    const msgBanner = buildInfoBanner('Open your in-game inbox first so APEX can locate the messaging service.');
    const rmBtn     = buildBtn('Mark All Read', 'message');
    rmBtn.addEventListener('click', performReadMessages);
    pane.appendChild(buildSection(
      buildSectionHead(
        'Unread Messages',
        'Mark all unread conversations as read instantly. Clears notification badges without opening each thread.',
        buildSpeedGear('messages', 'Messages')
      ),
      msgBanner,
      rmBtn
    ));

    refs.qBtn      = qBtn;
    refs.qBadge    = qBadge;
    refs.cBtn      = cBtn;
    refs.cBadge    = cBadge;
    refs.cBar      = cBar;
    refs.rmBtn     = rmBtn;
    refs.msgBanner = msgBanner;
    return pane;
  }

  function buildFriendsPane() {
    const pane = mk('div', { display: 'none', flexDirection: 'column' });

    const afBtn = buildBtn('Accept All Requests', 'accept');
    afBtn.addEventListener('click', performAcceptAllFriends);
    pane.appendChild(buildSection(
      buildSectionHead(
        'Accept Requests',
        'Accept all pending friend requests at once. Bulk-approves every invitation with one click.',
        buildSpeedGear('acceptFriends', 'Accept')
      ),
      afBtn
    ));

    const rfBtn = buildBtn('Reject All Requests', 'reject', 'danger');
    rfBtn.addEventListener('click', performRejectAllFriends);
    pane.appendChild(buildSection(
      buildSectionHead(
        'Reject Requests',
        'Decline all friend requests in one operation. Clears your pending list without affecting existing friends.',
        buildSpeedGear('rejectFriends', 'Reject')
      ),
      rfBtn
    ));

    // ── Delete Friends Below Level ────────────────────────────────────────
    const dfLevelSel = buildSelect([
      ['5',  'Below Level 5'],
      ['15', 'Below Level 15'],
      ['25', 'Below Level 25'],
      ['50', 'Below Level 50'],
    ]);
    dfLevelSel.value = '5';

    const dfBtn = buildBtn('Delete Low-Level Friends', 'reject', 'danger');
    dfBtn.addEventListener('click', () => {
      const lvl = parseInt(dfLevelSel.value, 10);
      if (!Number.isFinite(lvl)) return;
      performDeleteFriendsBelow(lvl);
    });
    pane.appendChild(buildSection(
      buildSectionHead(
        'Delete Low-Level Friends',
        'Removes every friend whose level is below the selected threshold. Useful for trimming inactive or low-tier accounts in bulk.',
        buildSpeedGear('deleteFriendsLevel', 'Delete')
      ),
      dfLevelSel,
      dfBtn
    ));

    // ── Delete Friends With No VIP ────────────────────────────────────────
    const dvBtn = buildBtn('Delete Non-VIP Friends', 'reject', 'danger');
    dvBtn.addEventListener('click', performDeleteFriendsNoVip);
    pane.appendChild(buildSection(
      buildSectionHead(
        'Delete Non-VIP Friends',
        'Removes every friend without an active VIP membership. Keeps only VIP-tier friends on your list.',
        buildSpeedGear('deleteFriendsVip', 'Delete')
      ),
      dvBtn
    ));

    refs.afBtn = afBtn;
    refs.rfBtn = rfBtn;
    refs.dfBtn = dfBtn;
    refs.dvBtn = dvBtn;
    return pane;
  }

  function buildBotsPane() {
    const pane = mk('div', { display: 'none', flexDirection: 'column' });

    // ── StarQuiz Bot ──────────────────────────────────────────────────────
    const { row: quizHeadRow, badge: quizBadge } = buildSectionHeadWithBadge(
      'StarQuiz Bot',
      'Auto-answers quiz questions using a built-in knowledge base. Improves your scores automatically.'
    );
    quizBadge.textContent = '0 answered';

    const quizBtn = buildBtn('Enable Quiz Bot', 'bot');
    quizBtn.addEventListener('click', () => {
      const next = !state.quizBot.enabled;
      toggleQuizBot(next);
      quizBtn._lbl.textContent  = next ? 'Disable Quiz Bot' : 'Enable Quiz Bot';
      quizBtn.style.background  = next ? T.errDim : T.accDim;
      quizBtn.style.borderColor = next ? T.errBdr : T.accBdr;
      quizBtn.style.color       = next ? T.err    : T.acc;
    });

    // ── Knowledge-base file loader ────────────────────────────────────────
    const kbFileInput = document.createElement('input');
    kbFileInput.type   = 'file';
    kbFileInput.accept = 'application/json,.json';
    Object.assign(kbFileInput.style, { display: 'none' });
    for (const ev of ['mousedown', 'click', 'keydown', 'keypress', 'keyup']) {
      kbFileInput.addEventListener(ev, e => e.stopImmediatePropagation());
    }

    const kbLoadBtn = mk('button', {
      width: '26px', height: '26px', flexShrink: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: `1px solid ${T.bdrSub}`,
      borderRadius: '5px', color: T.sub, cursor: 'pointer', outline: 'none', padding: '0',
      transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    });
    kbLoadBtn.title = 'Load custom questions (JSON knowledge base)';
    kbLoadBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="9 14 12 17 15 14"/></svg>`;
    kbLoadBtn.addEventListener('mouseenter', () => {
      kbLoadBtn.style.background  = T.accDim;
      kbLoadBtn.style.borderColor = T.accBdr;
      kbLoadBtn.style.color       = T.acc;
    });
    kbLoadBtn.addEventListener('mouseleave', () => {
      kbLoadBtn.style.background  = 'transparent';
      kbLoadBtn.style.borderColor = T.bdrSub;
      kbLoadBtn.style.color       = T.sub;
    });
    kbLoadBtn.addEventListener('click', e => {
      e.stopImmediatePropagation();
      kbFileInput.value = '';
      kbFileInput.click();
    });
    kbFileInput.addEventListener('change', () => {
      const file = kbFileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object');
          const entries = Object.entries(parsed);
          Object.assign(QUESTIONS_DB, parsed);
          kbLoadBtn.style.color = T.ok;
          kbLoadBtn.style.borderColor = T.okBdr;
          kbLoadBtn.style.background  = T.okDim;
          toast(`Loaded ${entries.length} question${entries.length !== 1 ? 's' : ''} from ${file.name}`, 'success');
        } catch (err) {
          toast(`KB load failed: ${err.message}`, 'error');
        }
      };
      reader.readAsText(file);
    });

    // Append the hidden file input and load button after the quiz button
    const kbRow = mk('div', {
      display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
    });
    const kbLabel = mk('span', {
      fontFamily: T.sans, fontSize: '11px', color: T.sub, flex: '1',
    });
    kbLabel.textContent = 'Custom knowledge base';
    kbRow.appendChild(kbLabel);
    kbRow.appendChild(kbLoadBtn);
    kbRow.appendChild(kbFileInput);

    pane.appendChild(buildSection(quizHeadRow, quizBtn, kbRow));

    refs.quizToggleBtn = quizBtn;
    refs.qbBadge       = quizBadge;
    _refreshQuizStats();

    // ── Automatic Liker ────────────────────────────────────────────────────
    const autoLikerRow = buildToggleRow(
      'Automatic Liker',
      'Automatically sends a loveit to the WAYD of every user in your chatroom (and profiles you open). Throttled to one like every 3–4 s and only fires once per profile per session.',
      state.misc.autoLiker,
      checked => {
        state.misc.autoLiker = checked;
        _prefsSet(_PK.autoLiker, checked ? '1' : '0');
        if (!checked) { state.autoLikerSent.clear(); _autoLikeQueue.length = 0; }
        toast(`Automatic liker ${checked ? 'enabled' : 'disabled'}`, checked ? 'success' : 'info');
      },
      buildSpeedGear('autoLiker', 'Auto Liker')
    );
    pane.appendChild(autoLikerRow);

    // ── Autographer ────────────────────────────────────────────────────────
    const autographerOuter = mk('div', { paddingTop: '16px', paddingBottom: '16px', boxSizing: 'border-box' });
    const agHead = buildSectionHead(
      'Autographer',
      'Opens a floating panel to send autographs and chatroom greetings. Visit a player profile first to set the autograph target.'
    );
    autographerOuter.appendChild(agHead);
    const openAgBtn = buildBtn('Open Autographer Panel', 'autograph');
    openAgBtn.addEventListener('click', () => {
      if (!agFloatingMenu) buildAgFloatingMenu();
      const isVisible = agFloatingMenu.style.display !== 'none';
      agFloatingMenu.style.display = isVisible ? 'none' : 'flex';
      openAgBtn._lbl.textContent  = isVisible ? 'Open Autographer Panel' : 'Close Autographer Panel';
      openAgBtn.style.background  = isVisible ? T.accDim : T.errDim;
      openAgBtn.style.borderColor = isVisible ? T.accBdr : T.errBdr;
      openAgBtn.style.color       = isVisible ? T.acc    : T.err;
      if (!isVisible) _buildAgFloatingContent();
    });
    autographerOuter.appendChild(openAgBtn);
    pane.appendChild(autographerOuter);

    refs.autographerPanel   = null;
    refs.autographerOpenBtn = openAgBtn;

    return pane;
  }

  function buildMiscPane() {
    const pane = mk('div', { display: 'none', flexDirection: 'column' });

    const head = mk('div', { paddingTop: '16px', boxSizing: 'border-box' });
    const lbl  = mk('div', {
      fontFamily: T.sans, fontSize: '11px', fontWeight: '600',
      color: T.sub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px',
    });
    lbl.textContent = 'Miscellaneous';
    head.appendChild(lbl);
    pane.appendChild(head);

    const chatFilterRow = buildToggleRow(
      'Chat Filter Bypass',
      'Inserts soft hyphens between each character of your outgoing chat messages, making them invisible to the word filter.',
      state.misc.chatFilterBypass,
      checked => {
        state.misc.chatFilterBypass = checked;
        _prefsSet(_PK.chat, checked ? '1' : '0');
        toast(`Chat filter bypass ${checked ? 'enabled' : 'disabled'}`, checked ? 'success' : 'info');
      }
    );
    pane.appendChild(chatFilterRow);

    const cleanConsoleRow = buildToggleRow(
      'Cleaner Console',
      'Hides Unity / browser noise from devtools (asset cache, GC, crash reports, BoxCollider warnings, etc.). Your own logs and real errors stay visible.',
      state.misc.cleanConsole,
      checked => {
        state.misc.cleanConsole = checked;
        _prefsSet(_PK.cleanConsole, checked ? '1' : '0');
        toast(`Cleaner console ${checked ? 'enabled' : 'disabled'}`, checked ? 'success' : 'info');
      }
    );
    pane.appendChild(cleanConsoleRow);

    // ─── Glitched Homes ────────────────────────────────────────────────────
    const homesSection = mk('div', {
      paddingTop: '16px', paddingBottom: '16px',
      borderBottom: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
    });

    const homesHead = buildSectionHead(
      'Glitched Homes',
      'Overwrite your default home with a pre-built room layout. Pick a home below and APEX will upload it to your profile.'
    );
    homesSection.appendChild(homesHead);

    const homeOptions = HOMES_DB.length
      ? [['', 'Choose a home…'], ...HOMES_DB.map(h => [h.name, h.name])]
      : [['', 'No homes available']];
    const homesSel = buildSelect(homeOptions);
    homesSel.id    = UID.homes;
    if (!HOMES_DB.length) homesSel.disabled = true;
    homesSection.appendChild(homesSel);

    // ── Preview image (shown after a home is selected) ──────────────────────
    const homesPrev = mk('div', {
      display: 'none', width: '100%', marginBottom: '10px',
      background: T.sur, border: `1px solid ${T.bdrSub}`, borderRadius: '7px',
      overflow: 'hidden', boxSizing: 'border-box',
    });
    const homesPrevImg = mk('img', {
      display: 'block', width: '100%', height: 'auto', maxHeight: '180px',
      objectFit: 'contain', background: T.bg,
    });
    homesPrevImg.alt = 'Home preview';
    homesPrev.appendChild(homesPrevImg);
    homesSection.appendChild(homesPrev);

    const _imgSrcFromB64 = raw => {
      if (!raw || typeof raw !== 'string') return '';
      if (raw.startsWith('data:')) return raw;
      // Detect common image magic-number prefixes (PNG / JPEG / GIF / WebP)
      let mime = 'image/png';
      if (raw.startsWith('/9j/'))      mime = 'image/jpeg';
      else if (raw.startsWith('R0lGOD')) mime = 'image/gif';
      else if (raw.startsWith('UklGR'))  mime = 'image/webp';
      return `data:${mime};base64,${raw}`;
    };

    const _updateHomesPreview = () => {
      const home = HOMES_DB.find(h => h.name === homesSel.value);
      if (home?.img) {
        homesPrevImg.src = _imgSrcFromB64(home.img);
        homesPrev.style.display = 'block';
      } else {
        homesPrevImg.removeAttribute('src');
        homesPrev.style.display = 'none';
      }
    };
    homesSel.addEventListener('change', _updateHomesPreview);
    homesPrevImg.onerror = () => { homesPrev.style.display = 'none'; };

    const homesBtn = buildBtn('Apply Home', 'home');
    homesBtn.style.marginTop = '10px';
    homesBtn.addEventListener('click', () => {
      const name = homesSel.value;
      if (!name) { toast('Select a home first', 'error'); return; }
      performHomeSet(name);
    });
    homesSection.appendChild(homesBtn);
    pane.appendChild(homesSection);
    refs.homesBtn = homesBtn;
    refs.homesSel = homesSel;
    refs.homesPreviewUpdate = _updateHomesPreview;

    const pkgSection = mk('div', {
      paddingTop: '16px', paddingBottom: '16px',
      borderBottom: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
    });

    pkgSection.appendChild(buildSectionHead(
      'Cheap Packages',
      'Opens a dedicated floating panel listing discounted VIP subscription offers for your region. The cheapest deals are surfaced first — click any offer to open the checkout flow.'
    ));

    const pkgOpenBtn = buildBtn('Open Packages Panel', 'pkg');
    pkgOpenBtn.addEventListener('click', () => {
      if (!pkgFloatingMenu) buildPkgFloatingMenu();
      const isVisible = pkgFloatingMenu.style.display !== 'none';
      pkgFloatingMenu.style.display = isVisible ? 'none' : 'flex';
      _syncPkgOpenBtn();
      if (!isVisible) _buildPkgFloatingContent();
    });
    pkgSection.appendChild(pkgOpenBtn);
    pane.appendChild(pkgSection);

    refs.pkgOpenBtn = pkgOpenBtn;

    return pane;
  }

