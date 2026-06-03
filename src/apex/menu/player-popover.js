  // ─── Player profile hover popover ────────────────────────────────────────
  // Singleton popover shown when the cursor hovers over a chatroom user row.
  // Displays experience info (level, XP, progress to next level) fetched on
  // demand and cached. Stays open while the cursor is over the row OR the
  // popover itself (persistent behaviour), with a small grace period.

  let _hoverPop = null;
  let _hoverPopHideTimer = null;
  let _hoverPopProfileId = null;

  function _ensureHoverPop() {
    if (_hoverPop) return _hoverPop;
    const pop = mk('div', {
      position: 'fixed', zIndex: '2147483647',
      minWidth: '240px', maxWidth: '280px',
      background: 'rgba(8,8,16,0.97)',
      border: `1px solid ${T.bdr}`, borderRadius: '8px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
      padding: '11px 12px', display: 'none', flexDirection: 'column', gap: '8px',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      pointerEvents: 'auto',
    });
    pop.addEventListener('mouseenter', () => {
      if (_hoverPopHideTimer) { clearTimeout(_hoverPopHideTimer); _hoverPopHideTimer = null; }
    });
    pop.addEventListener('mouseleave', () => _hoverPopScheduleHide());
    (shRoot() ?? document.body).appendChild(pop);
    _hoverPop = pop;
    return pop;
  }

  function _hoverPopScheduleHide() {
    if (_hoverPopHideTimer) clearTimeout(_hoverPopHideTimer);
    _hoverPopHideTimer = setTimeout(() => {
      if (_hoverPop) _hoverPop.style.display = 'none';
      _hoverPopProfileId = null;
      _hoverPopHideTimer = null;
    }, 180);
  }

  function _renderHoverPop(profileId, user, exp, loading) {
    const pop = _ensureHoverPop();
    pop.innerHTML = '';

    // Header row: avatar + name + level pill
    const head = mk('div', { display: 'flex', alignItems: 'center', gap: '9px' });
    const av = mk('div', {
      width: '36px', height: '36px', borderRadius: '50%',
      background: T.surAlt, flexShrink: '0', overflow: 'hidden',
      border: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    if (user.faceUrl) {
      const img = document.createElement('img');
      Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' });
      img.src = user.faceUrl;
      img.onerror = () => img.remove();
      av.appendChild(img);
    } else {
      const ph = mk('span', { fontFamily: T.mono, fontSize: '11px', color: T.muted });
      ph.textContent = '?';
      av.appendChild(ph);
    }
    head.appendChild(av);

    const titleCol = mk('div', { flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' });
    const nameEl = mk('div', {
      fontFamily: T.sans, fontSize: '12.5px', fontWeight: '600',
      color: user.isVip ? '#f59e0b' : T.txt,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    });
    nameEl.textContent = user.name ?? 'Unknown';
    titleCol.appendChild(nameEl);
    const idEl = mk('div', {
      fontFamily: T.mono, fontSize: '9.5px', color: T.muted,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    });
    idEl.textContent = profileId;
    titleCol.appendChild(idEl);
    head.appendChild(titleCol);

    const lvlPill = mk('span', {
      fontFamily: T.mono, fontSize: '10px', fontWeight: '600',
      color: T.acc, background: T.accDim, border: `1px solid ${T.accBdr}`,
      borderRadius: '4px', padding: '3px 7px', flexShrink: '0', letterSpacing: '0.03em',
    });
    lvlPill.textContent = exp ? `LVL ${exp.level}` : 'LVL —';
    head.appendChild(lvlPill);
    pop.appendChild(head);

    // Body — experience progress
    const body = mk('div', { display: 'flex', flexDirection: 'column', gap: '6px' });

    if (loading && !exp) {
      const sk1 = mk('div', { width: '60%', height: '8px', borderRadius: '3px' });
      sk1.className = 'ax-skel';
      const sk2 = mk('div', { width: '100%', height: '6px', borderRadius: '3px' });
      sk2.className = 'ax-skel';
      const sk3 = mk('div', { width: '40%', height: '8px', borderRadius: '3px' });
      sk3.className = 'ax-skel';
      body.appendChild(sk1); body.appendChild(sk2); body.appendChild(sk3);
    } else if (!exp) {
      const err = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.muted });
      err.textContent = state.accessToken ? 'Experience unavailable for this player.' : 'Connect to the game first.';
      body.appendChild(err);
    } else {
      const { xp, level, currentLevelXpMin, currentLevelXpMax } = exp;
      const span = Math.max(1, currentLevelXpMax - currentLevelXpMin);
      const gained = Math.max(0, xp - currentLevelXpMin);
      const pct = Math.max(0, Math.min(100, (gained / span) * 100));
      const toNext = Math.max(0, currentLevelXpMax - xp);

      const headerLine = mk('div', {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: T.sans, fontSize: '10.5px', color: T.sub,
      });
      const left = mk('span'); left.textContent = `Level ${level} → ${level + 1}`;
      const right = mk('span', { fontFamily: T.mono, color: T.txt });
      right.textContent = `${pct.toFixed(1)}%`;
      headerLine.appendChild(left); headerLine.appendChild(right);
      body.appendChild(headerLine);

      const track = mk('div', {
        width: '100%', height: '6px', borderRadius: '3px',
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      });
      const bar = mk('div', {
        height: '100%', width: `${pct}%`,
        background: T.acc, borderRadius: '3px',
        transition: 'width 0.3s ease',
      });
      track.appendChild(bar);
      body.appendChild(track);

      const stats = mk('div', {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
        fontFamily: T.mono, fontSize: '10px', color: T.sub, marginTop: '2px',
      });
      const _stat = (k, v) => {
        const row = mk('div', { display: 'flex', justifyContent: 'space-between', gap: '6px' });
        const ke = mk('span'); ke.textContent = k; ke.style.color = T.muted;
        const ve = mk('span'); ve.textContent = v; ve.style.color = T.txt;
        row.appendChild(ke); row.appendChild(ve);
        return row;
      };
      stats.appendChild(_stat('XP', xp.toLocaleString()));
      stats.appendChild(_stat('Next', currentLevelXpMax.toLocaleString()));
      stats.appendChild(_stat('In level', gained.toLocaleString()));
      stats.appendChild(_stat('To next', toNext.toLocaleString()));
      body.appendChild(stats);
    }
    pop.appendChild(body);
  }

  function _positionHoverPop(anchorEl) {
    const pop = _ensureHoverPop();
    pop.style.display = 'flex';
    // Place to the left of the anchor (chatroom rows live in the right
    // sidebar). Fallback to right side if there isn't enough room.
    const r = anchorEl.getBoundingClientRect();
    const pw = pop.offsetWidth || 260;
    const ph = pop.offsetHeight || 140;
    let left = r.left - pw - 10;
    if (left < 8) left = r.right + 10;
    if (left + pw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pw - 8);
    let top = r.top + (r.height / 2) - (ph / 2);
    top = Math.max(8, Math.min(top, window.innerHeight - ph - 8));
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top  = `${Math.round(top)}px`;
  }

  async function _showHoverPopFor(profileId, anchorEl) {
    if (_hoverPopHideTimer) { clearTimeout(_hoverPopHideTimer); _hoverPopHideTimer = null; }
    const user = state.chatroomUsers.get(profileId);
    if (!user) return;
    _hoverPopProfileId = profileId;
    const cached = _experienceCache.get(profileId);
    const exp = cached && Date.now() - cached.ts < EXPERIENCE_TTL_MS ? cached.data : null;
    _renderHoverPop(profileId, user, exp, !exp);
    _positionHoverPop(anchorEl);
    if (!exp) {
      const fetched = await _fetchPlayerExperience(profileId);
      // Only update if the same row is still being hovered.
      if (_hoverPopProfileId === profileId) {
        _renderHoverPop(profileId, state.chatroomUsers.get(profileId) ?? user, fetched, false);
        _positionHoverPop(anchorEl);
      }
    }
  }

  function _buildPlayerRow(profileId, user) {
    const row = mk('div', {
      display: 'flex', alignItems: 'center', gap: '9px',
      padding: '6px 8px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
    });
    row.dataset.pid = profileId;

    const avatar = mk('div', {
      width: '32px', height: '32px', borderRadius: '50%',
      background: T.surAlt, flexShrink: '0', overflow: 'hidden',
      border: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    const ph = mk('span', { fontFamily: T.mono, fontSize: '10px', color: T.muted });
    ph.textContent = '?';
    avatar.appendChild(ph);
    const img = document.createElement('img');
    Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', display: 'none' });
    img.onload  = () => { img.style.display = 'block'; ph.style.display = 'none'; };
    img.onerror = () => { img.style.display = 'none'; ph.style.display = 'flex'; };
    avatar.appendChild(img);
    if (user.faceUrl) img.src = user.faceUrl;
    row.appendChild(avatar);
    row._avatarImg = img;

    const info = mk('div', { flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '1px' });
    const nameEl = mk('div', {
      fontFamily: T.sans, fontSize: '11.5px', fontWeight: '600',
      color: user.isVip ? '#f59e0b' : T.txt,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    });
    nameEl.textContent = user.name ?? 'Unknown';
    row._nameEl = nameEl;
    const metaEl = mk('div', {
      fontFamily: T.mono, fontSize: '10px', color: T.sub,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      display: 'flex', alignItems: 'center', gap: '4px',
    });
    const moodTxt = mk('span');
    const moodSkel = mk('span');
    moodSkel.className = 'ax-skel';
    Object.assign(moodSkel.style, {
      display: 'inline-block', width: '88px', height: '8px',
      borderRadius: '3px',
    });
    metaEl.appendChild(moodTxt);
    metaEl.appendChild(moodSkel);
    row._moodTxt  = moodTxt;
    row._moodSkel = moodSkel;
    row._metaEl   = metaEl;
    info.appendChild(nameEl);
    info.appendChild(metaEl);
    row.appendChild(info);

    // Copy profileId button (left of the mirror-mood button).
    const copyBtn = mk('button', {
      width: '26px', height: '26px', flexShrink: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: `1px solid ${T.bdrSub}`,
      borderRadius: '5px', color: T.sub, cursor: 'pointer', outline: 'none', padding: '0',
      transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    });
    copyBtn.innerHTML = ICONS.copy;
    copyBtn.title = `Copy ${user.name ?? 'player'}'s profileId`;
    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.background  = T.accDim;
      copyBtn.style.borderColor = T.accBdr;
      copyBtn.style.color       = T.acc;
    });
    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.background  = 'transparent';
      copyBtn.style.borderColor = T.bdrSub;
      copyBtn.style.color       = T.sub;
    });
    copyBtn.addEventListener('click', async e => {
      e.stopImmediatePropagation();
      const u = state.chatroomUsers.get(profileId);
      try {
        await navigator.clipboard.writeText(profileId);
        toast(`Copied ${u?.name ?? 'player'}'s profileId`, 'success');
      } catch {
        toast('Clipboard write blocked', 'error');
      }
    });
    row.appendChild(copyBtn);
    row._copyBtn = copyBtn;

    // Mirror-mood button — looks up the *current* user state on every click,
    // so the closure stays valid even after roster updates.
    const mirrorBtn = mk('button', {
      width: '26px', height: '26px', flexShrink: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', border: `1px solid ${T.bdrSub}`,
      borderRadius: '5px', color: T.sub, cursor: 'pointer', outline: 'none', padding: '0',
      transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    });
    mirrorBtn.innerHTML = ICONS.mood;
    mirrorBtn.addEventListener('mouseenter', () => {
      if (mirrorBtn.disabled) return;
      mirrorBtn.style.background  = T.accDim;
      mirrorBtn.style.borderColor = T.accBdr;
      mirrorBtn.style.color       = T.acc;
    });
    mirrorBtn.addEventListener('mouseleave', () => {
      mirrorBtn.style.background  = 'transparent';
      mirrorBtn.style.borderColor = T.bdrSub;
      mirrorBtn.style.color       = T.sub;
    });
    mirrorBtn.addEventListener('click', e => {
      e.stopImmediatePropagation();
      if (mirrorBtn.disabled) return;
      const u = state.chatroomUsers.get(profileId);
      if (!u?.mood) { toast(`${u?.name ?? 'Player'} has no mood yet`, 'info'); return; }
      performMoodChange(u.mood);
    });
    row.appendChild(mirrorBtn);
    row._mirrorBtn = mirrorBtn;

    // Hover popover — show experience info for this player.
    row.addEventListener('mouseenter', () => { _showHoverPopFor(profileId, row); });
    row.addEventListener('mouseleave', () => { _hoverPopScheduleHide(); });

    _updatePlayerRow(row, user);
    return row;
  }

  function _updatePlayerRow(row, user) {
    if (!row) return;
    if (row._nameEl) {
      if (row._nameEl.textContent !== (user.name ?? 'Unknown')) row._nameEl.textContent = user.name ?? 'Unknown';
      row._nameEl.style.color = user.isVip ? '#f59e0b' : T.txt;
    }
    // Mood: skeleton shimmer while unknown, real text once it lands.
    if (row._moodTxt && row._moodSkel) {
      if (user.mood) {
        const next = `mood: ${user.mood}`;
        if (row._moodTxt.textContent !== next) row._moodTxt.textContent = next;
        row._moodTxt.style.display  = '';
        row._moodSkel.style.display = 'none';
      } else {
        row._moodTxt.textContent = '';
        row._moodTxt.style.display  = 'none';
        row._moodSkel.style.display = 'inline-block';
      }
    }
    if (row._avatarImg && user.faceUrl && row._avatarImg.src !== user.faceUrl) {
      row._avatarImg.src = user.faceUrl;       // browser cache deduplicates by URL
    }
    if (row._mirrorBtn) {
      const btn = row._mirrorBtn;
      btn.title = `Apply ${user.name ?? 'player'}'s mood`;
      btn.disabled = !state.accessToken;
      btn.style.cursor  = btn.disabled ? 'not-allowed' : 'pointer';
      btn.style.opacity = btn.disabled ? '0.4' : (user.mood ? '1' : '0.6');
    }
    if (row._copyBtn) {
      row._copyBtn.title = `Copy ${user.name ?? 'player'}'s profileId`;
    }
  }

  function _buildFeedRow(entry) {
    const row = mk('div', {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '5px 6px', borderRadius: '4px',
      fontFamily: T.sans, fontSize: '11px', color: T.txt,
      borderBottom: `1px solid ${T.bdrSub}`,
    });
    const av = mk('div', {
      width: '20px', height: '20px', borderRadius: '50%',
      background: T.surAlt, flexShrink: '0', overflow: 'hidden',
      border: `1px solid ${T.bdrSub}`, boxSizing: 'border-box',
    });
    if (entry.faceUrl) {
      const img = document.createElement('img');
      img.src = entry.faceUrl;
      Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' });
      img.onerror = () => img.remove();
      av.appendChild(img);
    }
    row.appendChild(av);

    const body = mk('div', { flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '0' });
    if (entry.type === 'chat') {
      const head = mk('div', { fontFamily: T.sans, fontSize: '11px', fontWeight: '600', color: T.txt });
      head.textContent = entry.name;
      const txt  = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.sub, wordBreak: 'break-word' });
      txt.textContent = entry.text;
      body.appendChild(head);
      body.appendChild(txt);
    } else if (entry.type === 'join' || entry.type === 'leave') {
      const head = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.txt });
      head.innerHTML = `<span style="color:${entry.type === 'join' ? T.ok : T.err};font-weight:600">${entry.type === 'join' ? '+' : '−'}</span> <span style="font-weight:600">${entry.name}</span> <span style="color:${T.sub}">${entry.type === 'join' ? 'joined' : 'left'}</span>`;
      body.appendChild(head);
    } else if (entry.type === 'mood') {
      const head = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.txt });
      head.innerHTML = `<span style="font-weight:600">${entry.name}</span> <span style="color:${T.sub}">changed mood →</span> <span style="font-family:${T.mono};color:${T.acc}">${entry.mood}</span>`;
      body.appendChild(head);
    } else if (entry.type === 'room') {
      const head = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.sub });
      head.textContent = entry.text;
      body.appendChild(head);
    }
    row.appendChild(body);

    const tEl = mk('span', { fontFamily: T.mono, fontSize: '9.5px', color: T.muted, flexShrink: '0' });
    const d = new Date(entry.ts);
    tEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    row.appendChild(tEl);
    return row;
  }

  // Diff-based player roster update — preserves existing rows so the browser
  // doesn't have to refetch face images on every event.
  function _refreshChatroomPlayers() {
    if (!refs.crPlayersList || !refs.crCountBadge) return;
    const list = refs.crPlayersList;
    const rowMap = (refs.crPlayerRows ??= new Map());

    const others = [...state.chatroomUsers.entries()]
      .filter(([pid]) => pid !== state.profileId)
      .sort((a, b) => (a[1].name ?? '').localeCompare(b[1].name ?? ''));
    const n = others.length;
    refs.crCountBadge.textContent = `${n} player${n !== 1 ? 's' : ''}`;

    if (n === 0) {
      if (list.firstChild?.dataset?.empty !== '1') {
        list.innerHTML = '';
        rowMap.clear();
        const empty = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.muted, padding: '8px 6px', textAlign: 'center' });
        empty.dataset.empty = '1';
        empty.textContent = 'No other players in this chatroom.';
        list.appendChild(empty);
      }
      return;
    }

    // Remove empty placeholder if present.
    if (list.firstChild?.dataset?.empty === '1') list.innerHTML = '';

    // Remove rows for users no longer present — animate then drop.
    const presentIds = new Set(others.map(o => o[0]));
    for (const [pid, row] of rowMap) {
      if (!presentIds.has(pid)) {
        rowMap.delete(pid);
        if (row._leaving) continue;
        row._leaving = true;
        row.style.overflow = 'hidden';
        row.style.animation = 'ax-row-out 0.32s ease forwards';
        setTimeout(() => row.remove(), 320);
      }
    }

    // Add or update rows, preserving DOM order matching `others`.
    let prevNode = null;
    for (const [pid, user] of others) {
      let row = rowMap.get(pid);
      let isNew = false;
      if (!row) {
        row = _buildPlayerRow(pid, user);
        rowMap.set(pid, row);
        isNew = true;
      } else {
        _updatePlayerRow(row, user);
      }
      // Skip leaving rows — they're being animated out.
      // Find next non-leaving sibling at the correct position.
      let expectedNext = prevNode ? prevNode.nextSibling : list.firstChild;
      while (expectedNext && expectedNext._leaving) expectedNext = expectedNext.nextSibling;
      if (expectedNext !== row) list.insertBefore(row, expectedNext);
      if (isNew) {
        row.style.animation = 'ax-row-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both';
      }
      prevNode = row;
    }
  }

  // Append a single feed row at the top; trim from bottom if over the cap.
  function _appendFeedRow(entry) {
    const list = refs.crFeedList;
    if (!list) return;
    if (list.firstChild?.dataset?.empty === '1') list.innerHTML = '';
    const row = _buildFeedRow(entry);
    list.insertBefore(row, list.firstChild);
    while (list.children.length > state.chatroomFeedMax) list.lastChild?.remove();
  }

  // Full refresh — called on tab switch / theme change, when we need to
  // reflect the current state from scratch.
  function _refreshChatroomPane() {
    if (!refs.crCountBadge) return;
    refs.crPlayerRows = new Map();
    refs.crPlayersList.innerHTML = '';
    _refreshChatroomPlayers();

    refs.crFeedList.innerHTML = '';
    if (state.chatroomFeed.length === 0) {
      const empty = mk('div', { fontFamily: T.sans, fontSize: '11px', color: T.muted, padding: '8px 6px', textAlign: 'center' });
      empty.dataset.empty = '1';
      empty.textContent = 'No activity yet.';
      refs.crFeedList.appendChild(empty);
    } else {
      // Newest at top
      for (let i = state.chatroomFeed.length - 1; i >= 0; i--) {
        refs.crFeedList.appendChild(_buildFeedRow(state.chatroomFeed[i]));
      }
    }
  }

