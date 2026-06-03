  // ─── Restore Status: list previous WAYDs and revert to a selected one ─────

  let restoreFloatingMenu = null;
  const restoreFloatDrag  = { on: false, ox: 0, oy: 0 };
  const restoreCache = { entries: [], loaded: false, page: 0 };
  const RESTORE_PER_PAGE = 5;

  async function openRestoreFloatingMenu() {
    if (!requireToken()) return;
    buildRestoreFloatingMenu();
    restoreFloatingMenu.style.display = 'flex';
    await loadRestoreEntries();
  }

  function buildRestoreFloatingMenu() {
    if (restoreFloatingMenu) return;

    const win = mk('div', {
      position: 'fixed', bottom: '24px', right: '24px',
      width: '340px', maxWidth: 'calc(100vw - 32px)',
      background: T.bg, border: `1px solid ${T.bdr}`,
      borderRadius: '12px',
      boxShadow: `0 0 0 1px ${T.accGlow} inset, 0 24px 60px rgba(0,0,0,0.85), 0 0 50px ${T.accDim}`,
      zIndex: '2147483646', fontFamily: T.sans,
      display: 'none', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box',
      animation: 'ax-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      maxHeight: 'calc(100vh - 48px)',
    });
    win.id = UID.restoreFloat;

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
    headIcon.innerHTML = ICONS.restore;
    const headTitle = mk('span', {
      fontFamily: T.sans, fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.12em', color: T.txt, textTransform: 'uppercase',
    });
    headTitle.textContent = 'RESTORE STATUS';
    headLeft.appendChild(headIcon);
    headLeft.appendChild(headTitle);

    const headRight = mk('div', { display: 'flex', gap: '4px' });
    const refreshBtn = buildCtrlBtn(
      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
      'Refresh', true
    );
    refreshBtn.addEventListener('click', () => { restoreCache.loaded = false; restoreCache.page = 0; loadRestoreEntries(true); });
    const closeBtn = buildCtrlBtn(
      `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      'Close', true
    );
    closeBtn.addEventListener('click', () => { win.style.display = 'none'; });
    headRight.appendChild(refreshBtn);
    headRight.appendChild(closeBtn);

    head.appendChild(headLeft);
    head.appendChild(headRight);

    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      e.stopImmediatePropagation(); e.preventDefault();
      const rect = win.getBoundingClientRect();
      restoreFloatDrag.on = true;
      restoreFloatDrag.ox = e.clientX - rect.left;
      restoreFloatDrag.oy = e.clientY - rect.top;
      head.style.cursor = 'grabbing';
      const onMove = ev => {
        if (!restoreFloatDrag.on) return;
        win.style.left   = Math.min(Math.max(0, ev.clientX - restoreFloatDrag.ox), innerWidth  - win.offsetWidth)  + 'px';
        win.style.top    = Math.min(Math.max(0, ev.clientY - restoreFloatDrag.oy), innerHeight - win.offsetHeight) + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
      };
      const onUp = () => {
        restoreFloatDrag.on = false;
        head.style.cursor = 'grab';
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup',   onUp,   true);
      };
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('mouseup',   onUp,   true);
    });

    win.appendChild(head);

    const body = mk('div', {
      overflowY: 'hidden', overflowX: 'hidden',
      padding: '8px 14px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: '2px',
    });
    body.id = UID.restoreList;
    win.appendChild(body);
    refs.restoreBody = body;

    // Pagination footer — keeps the panel compact even with dozens of WAYDs.
    const foot = mk('div', {
      display: 'none', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px 10px',
      borderTop: `1px solid ${T.bdrSub}`,
      background: 'transparent', flexShrink: '0',
    });

    const _navBtn = (svg, title) => {
      const b = mk('button', {
        width: '28px', height: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.accDim, border: `1px solid ${T.accBdr}`,
        borderRadius: '6px', color: T.acc, cursor: 'pointer', outline: 'none',
        padding: '0', transition: 'background 0.12s, border-color 0.12s, opacity 0.15s',
      });
      b.innerHTML = svg;
      b.title = title;
      b.addEventListener('mouseenter', () => {
        if (b.disabled) return;
        b.style.background  = T.accGlow;
        b.style.borderColor = T.acc;
      });
      b.addEventListener('mouseleave', () => {
        b.style.background  = T.accDim;
        b.style.borderColor = T.accBdr;
      });
      return b;
    };

    const prevBtn = _navBtn(
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
      'Previous page'
    );
    const nextBtn = _navBtn(
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
      'Next page'
    );
    const pageLabel = mk('span', {
      fontFamily: T.mono, fontSize: '10.5px', color: T.sub,
      letterSpacing: '0.06em', textAlign: 'center', flex: '1',
    });

    prevBtn.addEventListener('click', () => {
      if (restoreCache.page > 0) { restoreCache.page--; _renderRestoreList(); }
    });
    nextBtn.addEventListener('click', () => {
      const max = Math.max(0, Math.ceil(restoreCache.entries.length / RESTORE_PER_PAGE) - 1);
      if (restoreCache.page < max) { restoreCache.page++; _renderRestoreList(); }
    });

    foot.appendChild(prevBtn);
    foot.appendChild(pageLabel);
    foot.appendChild(nextBtn);
    win.appendChild(foot);
    refs.restoreFoot       = foot;
    refs.restorePrevBtn    = prevBtn;
    refs.restoreNextBtn    = nextBtn;
    refs.restorePageLabel  = pageLabel;

    restoreFloatingMenu = win;
    (shRoot() ?? document.body).appendChild(win);
  }

  function _restoreSkeleton() {
    const body = refs.restoreBody;
    if (!body) return;
    body.innerHTML = '';
    if (refs.restoreFoot) refs.restoreFoot.style.display = 'none';
    for (let i = 0; i < 4; i++) {
      const card = mk('div', {
        padding: '8px 4px',
        background: 'transparent',
        border: 'none',
        display: 'flex', alignItems: 'center', gap: '10px',
      });
      const txt = mk('div'); txt.className = 'ax-skel';
      Object.assign(txt.style, { height: '12px', width: '68%' });
      const ico = mk('div'); ico.className = 'ax-skel';
      Object.assign(ico.style, { height: '22px', width: '22px', borderRadius: '6px', flexShrink: '0', marginLeft: 'auto' });
      const meta = mk('div', { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '0' });
      const sub = mk('div'); sub.className = 'ax-skel';
      Object.assign(sub.style, { height: '8px', width: '38%' });
      meta.appendChild(txt); meta.appendChild(sub);
      card.appendChild(meta); card.appendChild(ico);
      body.appendChild(card);
    }
  }

  function _restoreEmpty(msg) {
    const body = refs.restoreBody;
    if (!body) return;
    body.innerHTML = '';
    if (refs.restoreFoot) refs.restoreFoot.style.display = 'none';
    const empty = mk('div', {
      padding: '24px 12px', textAlign: 'center',
      fontFamily: T.sans, fontSize: '12px', color: T.sub,
    });
    empty.textContent = msg;
    body.appendChild(empty);
  }

  async function loadRestoreEntries(force) {
    if (!refs.restoreBody) return;
    if (restoreCache.loaded && !force) { _renderRestoreList(); return; }
    if (force) restoreCache.page = 0;
    _restoreSkeleton();
    try {
      const data = await mspGraphQL('/edgeugc/graphql',
        'query GetUserUGCs($gameId: String!, $profileId: String!, $contentType: String, $page: String, $pageSize: Int) {recentUgcsByProfile(input:{gameId: $gameId, profileId: $profileId, contentType: $contentType, page: $page, pageSize: $pageSize}) {nextPage entries {id title lastEditedDate lifecycleStatus owner type commentCount privacyStatus ...on Movie {duration views} reactions {reactionTypeId count} resources {type id} profile {id name membership {lastTierExpiry} avatar(preferredGameId: $gameId) {gameId}}}}}',
        { gameId: GAME_ID, profileId: state.profileId, contentType: 'WAYD', page: '', pageSize: 50 }
      );
      const entries = data?.data?.recentUgcsByProfile?.entries ?? [];
      if (entries.length === 0) { restoreCache.entries = []; restoreCache.loaded = true; _restoreEmpty('No previous statuses found'); return; }

      // Decode each PgcV1 in parallel (best-effort)
      const BSON = _BSON;
      const decoded = await Promise.all(entries.map(async (e) => {
        const pgcId = (e.resources ?? []).find(r => r.type === 'PgcV1')?.id;
        let text = '';
        if (pgcId && BSON) {
          try {
            const res = await sf(`${CDN_BASE}/${pgcId}`, { method: 'GET' });
            if (res.ok) {
              const doc = BSON.deserialize(new Uint8Array(await res.arrayBuffer()), { promoteValues: false, promoteLongs: false, promoteBuffers: false });
              if (Array.isArray(doc.Texts) && doc.Texts.length > 0) text = String(doc.Texts[0] ?? '');
            }
          } catch { /* leave text blank on failure */ }
        }
        const loveit = (e.reactions ?? []).find(r => r.reactionTypeId === 'loveit')?.count ?? 0;
        return { id: e.id, text, loveit, lastEditedDate: e.lastEditedDate };
      }));

      restoreCache.entries = decoded;
      restoreCache.loaded  = true;
      _renderRestoreList();
    } catch (err) {
      _restoreEmpty(err?.message ?? 'Failed to load statuses');
    }
  }

  function _renderRestoreList() {
    const body = refs.restoreBody;
    if (!body) return;
    body.innerHTML = '';

    // Make sure the footer follows the data state.
    const foot = refs.restoreFoot;
    const total = restoreCache.entries.length;
    const pageCount = Math.max(1, Math.ceil(total / RESTORE_PER_PAGE));
    if (restoreCache.page >= pageCount) restoreCache.page = pageCount - 1;
    if (restoreCache.page < 0) restoreCache.page = 0;

    if (!total) {
      if (foot) foot.style.display = 'none';
      _restoreEmpty('No previous statuses found');
      return;
    }

    const start = restoreCache.page * RESTORE_PER_PAGE;
    const slice = restoreCache.entries.slice(start, start + RESTORE_PER_PAGE);

    for (const entry of slice) {
      const row = mk('div', {
        padding: '8px 4px',
        background: 'transparent',
        border: 'none',
        borderRadius: '0',
        display: 'flex', alignItems: 'center', gap: '10px',
        transition: 'background 0.15s',
        animation: 'ax-fi 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      });
      row.addEventListener('mouseenter', () => {
        row.style.background = 'rgba(255,255,255,0.03)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });

      const meta = mk('div', { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '0' });
      const textEl = mk('div', {
        fontFamily: T.sans, fontSize: '12px', fontWeight: '500', color: T.txt,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      });
      textEl.textContent = entry.text || '(no text)';
      textEl.title = entry.text || '';

      const sub = mk('div', { display: 'flex', alignItems: 'center', gap: '6px', fontFamily: T.mono, fontSize: '10px', color: T.sub });
      const heartSpan = mk('span', { display: 'inline-flex', alignItems: 'center', gap: '3px', color: T.acc });
      heartSpan.innerHTML = ICONS.heart;
      const cnt = mk('span'); cnt.textContent = String(entry.loveit);
      heartSpan.appendChild(cnt);
      sub.appendChild(heartSpan);

      if (entry.lastEditedDate) {
        const d = new Date(entry.lastEditedDate);
        if (!isNaN(d)) {
          const dot = mk('span', { color: T.bdrSub }); dot.textContent = '·';
          const dateEl = mk('span'); dateEl.textContent = d.toLocaleDateString();
          sub.appendChild(dot); sub.appendChild(dateEl);
        }
      }

      meta.appendChild(textEl);
      meta.appendChild(sub);

      const actionBtn = mk('button', {
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.accDim, border: `1px solid ${T.accBdr}`,
        borderRadius: '6px', color: T.acc, cursor: 'pointer', outline: 'none',
        padding: '0', flexShrink: '0',
        transition: 'background 0.12s, border-color 0.12s, transform 0.1s',
      });
      actionBtn.title = 'Restore this status';
      actionBtn.innerHTML = ICONS.restore;
      actionBtn.addEventListener('mouseenter', () => {
        if (actionBtn.disabled) return;
        actionBtn.style.background  = T.accGlow;
        actionBtn.style.borderColor = T.acc;
      });
      actionBtn.addEventListener('mouseleave', () => {
        actionBtn.style.background  = T.accDim;
        actionBtn.style.borderColor = T.accBdr;
      });
      actionBtn.addEventListener('click', () => performRestoreStatus(entry, actionBtn));

      row.appendChild(meta);
      row.appendChild(actionBtn);
      body.appendChild(row);
    }

    // Footer: hide if a single page fits everything, otherwise show arrows
    // + "X / Y" indicator.
    if (foot) {
      if (pageCount > 1) {
        foot.style.display = 'flex';
        refs.restorePageLabel.textContent = `${restoreCache.page + 1} / ${pageCount}`;
        const atFirst = restoreCache.page === 0;
        const atLast  = restoreCache.page >= pageCount - 1;
        refs.restorePrevBtn.disabled = atFirst;
        refs.restoreNextBtn.disabled = atLast;
        refs.restorePrevBtn.style.opacity = atFirst ? '0.35' : '1';
        refs.restoreNextBtn.style.opacity = atLast  ? '0.35' : '1';
        refs.restorePrevBtn.style.cursor  = atFirst ? 'not-allowed' : 'pointer';
        refs.restoreNextBtn.style.cursor  = atLast  ? 'not-allowed' : 'pointer';
      } else {
        foot.style.display = 'none';
      }
    }
  }

  async function performRestoreStatus(entry, actionBtn) {
    if (!requireToken()) return;
    if (actionBtn) {
      actionBtn.disabled = true;
      actionBtn.style.opacity = '0.6';
      actionBtn.style.cursor = 'not-allowed';
    }
    await withOp('restore', async () => {
      await wait(0.5, 1.0);
      const attrs = await getProfileAttrs();
      await wait(0.3, 0.6);
      await putProfileAttrs({ ...attrs, additionalData: { ...(attrs.additionalData ?? {}), WAYD: entry.id } });
      toast('Status restored', 'success');
    }).catch(err => toast(err?.message ?? 'Restore failed', 'error'))
      .finally(() => {
        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.style.opacity = '1';
          actionBtn.style.cursor = 'pointer';
        }
      });
  }

  async function performDailyQuests() {
    if (!requireToken()) return;
    state.ops.quests.progress = 0;
    await withOp('quests', async () => {
      await wait(1.2, 2.4);
      const pid = state.profileId;
      let isVIP = false;
      try {
        const memberships = await apiFetch(
          `${API_BASE}/profilememberships/v1/memberships/summary/profiles/${pid}`,
          { method: 'GET', headers: { 'skip-not-found-items': 'true' } }
        );
        if (Array.isArray(memberships) && memberships.length > 0) {
          const m   = memberships[0];
          const now = new Date();
          const currentExpiry = m.currentTierExpiry ? new Date(m.currentTierExpiry) : null;
          const lastExpiry    = m.lastTierExpiry    ? new Date(m.lastTierExpiry)    : null;
          isVIP = !!currentExpiry && currentExpiry > now && (!lastExpiry || currentExpiry >= lastExpiry);
        }
      } catch { /* best-effort */ }
      const rewardData = await fetchActiveRewards(pid);
      await claimDailyGift(pid, 'normal', rewardData);
      if (isVIP) await claimDailyGift(pid, 'vip', rewardData);
      await wait(1.0, 2.5);
      const qs        = ['EventQuest', 'StaticDailyQuest', 'RandomDailyQuest'].map(t => `questType=${t}`).join('&');
      const questData = await mspGet(`/quests/v2/profiles/${pid}/games/${GAME_ID}/quests?${qs}`);
      const activeQ   = flattenActiveQuests(questData?.quests ?? []);
      for (const quest of activeQ.filter(q => !QUEST_SKIP.has(q.id))) await runQuest(pid, quest);
      await wait(2.0, 4.0);
      const petsOk = await petAllPets(pid);
      if (petsOk > 0) {
        await wait(1.0, 2.0);
        try {
          await mspPut(`/quests/v2/profiles/${pid}/games/${GAME_ID}/quests/daily_pet_pets/state`, { state: 'Complete' });
          state.ops.quests.progress++;
          updateUI();
        } catch { /* already complete */ }
      }
      toast(`${state.ops.quests.progress} quests completed`, 'success');
    }).catch(() => toast('Quest run failed', 'error'));
  }

  async function claimDailyGift(pid, tier, rewardData) {
    const suffix    = tier === 'vip' ? '_vip' : '_normal';
    const rewardKey = tier === 'vip' ? 'daily_pickup_vip' : 'daily_pickup';

    // Determine how many pickups are still uncollected from the live reward state
    const reward    = rewardData?.rewards?.find(r => r.id === rewardKey);
    const remaining = reward ? Math.max(0, reward.targetValue - reward.progress) : 0;

    if (remaining === 0) return; // nothing left to claim

    await wait(2.0, 4.0);
    for (let i = 0; i < remaining; i++) {
      await wait(1.5, 3.0);
      try { await mspPut(`/timelimitedrewards/v2/profiles/${pid}/games/${GAME_ID}/rewards/${rewardKey}`, { state: 'Claimed' }); } catch { /* already claimed */ }
      try { await mspPut(`/quests/v2/profiles/${pid}/games/${GAME_ID}/quests/daily_open_gift${suffix}/progress`, { progress: 1 }); } catch { /* already at max */ }
    }
    await wait(0.5, 1.0);
    try {
      await mspPut(`/quests/v2/profiles/${pid}/games/${GAME_ID}/quests/daily_open_gift${suffix}/state`, { state: 'Complete' });
      state.ops.quests.progress++;
      updateUI();
    } catch { /* already complete */ }
  }

  function flattenActiveQuests(quests) {
    const out = [];
    function walk(q) {
      const hasChildren = q.children?.length > 0;
      if (q.definitionId && q.state === 'Active' && !hasChildren) {
        out.push({ id: q.definitionId, target: q.target ?? 1, needsProgress: (q.progress ?? 0) < (q.target ?? 1) });
      }
      if (hasChildren) q.children.forEach(walk);
    }
    quests.forEach(walk);
    return out;
  }

  async function runQuest(pid, quest) {
    const base = `/quests/v2/profiles/${pid}/games/${GAME_ID}/quests/${quest.id}`;
    if (quest.needsProgress) {
      for (let i = 0; i < quest.target; i++) {
        await wait(0.5, 1.2);
        try { await mspPut(`${base}/progress`, { progress: 1 }); } catch { /* already at target */ }
      }
    }
    await wait(0.8, 1.5);
    try {
      await mspPut(`${base}/state`, { state: 'Complete' });
      state.ops.quests.progress++;
      updateUI();
    } catch { /* already complete */ }
    await wait(1.0, 3.0);
  }

  async function petAllPets(pid) {
    let ok = 0;
    for (const id of PET_IDS) {
      await wait(0.8, 2.0);
      try { await mspPost(`/pets/v1/pets/${id}/interactions`, { profileId: pid, gameId: GAME_ID }); ok++; }
      catch { /* pet unavailable */ }
    }
    return ok;
  }

  async function performCrystalCollection() {
    if (!requireToken()) return;
    state.ops.crystals.collected = 0;
    await withOp('crystals', async () => {
      await waitSp('crystals', 1.2, 2.4);
      const pid = state.profileId;

      // Fetch live reward state so we only collect what's actually remaining
      const rewardData = await fetchActiveRewards(pid);
      const rewardMap  = Object.fromEntries(
        (rewardData?.rewards ?? []).map(r => [r.id, r])
      );

      const entries = Object.entries(CRYSTALS);
      let total     = 0;
      for (let i = 0; i < entries.length; i++) {
        const [type]  = entries[i];
        const reward  = rewardMap[type];
        const remaining = reward ? Math.max(0, reward.targetValue - reward.progress) : 0;

        if (remaining === 0) continue; // already fully collected, skip

        for (let j = 0; j < remaining; j++) {
          await waitSp('crystals', j === 0 ? 1.2 : 0.7, j === 0 ? 2.5 : 1.8);
          try {
            await mspPut(`/timelimitedrewards/v2/profiles/${pid}/games/${GAME_ID}/rewards/${type}`, { state: 'Claimed' });
            total++;
            state.ops.crystals.collected = total;
            updateUI();
          } catch { /* already collected */ }
        }
        if (i < entries.length - 1) await waitSp('crystals', 1.8, 4.0);
      }
      toast(`${total}/${state.ops.crystals.total} crystals collected`, 'success');
    }).catch(() => toast('Collection failed', 'error'));
  }

  async function performAcceptAllFriends() {
    if (!requireToken()) return;
    await withOp('acceptFriends', () => handleFriendRequests('approved', 'acceptFriends')).catch(() => toast('Failed to accept requests', 'error'));
  }

  async function performRejectAllFriends() {
    if (!requireToken()) return;
    await withOp('rejectFriends', () => handleFriendRequests('rejected', 'rejectFriends')).catch(() => toast('Failed to reject requests', 'error'));
  }

  async function getAllFriendIds() {
    const res = await sf(`${API_BASE}/edgerelationships/graphql`, {
      method:  'POST',
      headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'query GetAllRelationships($profileId: String!, $gameId: String!){ relationships(profileId: $profileId) { nodes { profileId labels(gameId: $gameId) } } requestsIn(profileId: $profileId) { nodes { profileId } } requestsOut(profileId: $profileId) { nodes { profileId } } blocked(profileId: $profileId) { nodes { profileId } } labelRequestsIn(profileId: $profileId, gameId: $gameId) { nodes { profileId label } } labelRequestsOut(profileId: $profileId, gameId: $gameId) { nodes { profileId label } } }',
        variables: { profileId: state.profileId, gameId: GAME_ID },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.data?.relationships?.nodes ?? []).map(n => n.profileId);
  }

  async function _friendLevelsBatch(profileIds) {
    // Returns Map<profileId, level>. Empty/failed lookups are omitted.
    const out = new Map();
    if (!profileIds.length) return out;
    const CHUNK = 50;
    for (let i = 0; i < profileIds.length; i += CHUNK) {
      const chunk = profileIds.slice(i, i + CHUNK);
      try {
        const res = await sf(`${API_BASE}/experience/v1/experience/batch`, {
          method:  'POST',
          headers: {
            authorization: `Bearer ${state.accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(chunk.map(pid => ({ gameId: GAME_ID, profileId: pid }))),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
          const exp = entry?.experience;
          if (exp && typeof exp.level === 'number') out.set(exp.profileId, exp.level);
        }
      } catch { /* skip chunk on error */ }
      if (i + CHUNK < profileIds.length) await waitSp('deleteFriendsLevel', 0.6, 1.1);
    }
    return out;
  }

  async function _friendIsVip(profileId) {
    try {
      const res = await sf(
        `${API_BASE}/profilememberships/v1/memberships/summary/profiles/${profileId}`,
        { method: 'GET', headers: { authorization: `Bearer ${state.accessToken}`, 'skip-not-found-items': 'true' } }
      );
      if (!res.ok) return false;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return false;
      const m = data[0];
      const now = new Date();
      const exp = m.currentTierExpiry ? new Date(m.currentTierExpiry) : null;
      return !!exp && exp > now;
    } catch { return false; }
  }

  async function _deleteFriend(profileId) {
    const res = await sf(
      `${API_BASE}/profilerelationships/v2/profiles/${state.profileId}/relationships/${profileId}`,
      { method: 'DELETE', headers: { authorization: `Bearer ${state.accessToken}` } }
    );
    return res.ok;
  }

  async function performDeleteFriendsBelow(level) {
    if (!requireToken()) return;
    await withOp('deleteFriendsLevel', async () => {
      toast('Fetching friend list…', 'info');
      await waitSp('deleteFriendsLevel', 0.8, 1.4);
      const ids = await getAllFriendIds();
      if (!ids.length) { toast('No friends found', 'info'); return; }
      toast(`Checking ${ids.length} friend${ids.length !== 1 ? 's' : ''}…`, 'info');
      const levels = await _friendLevelsBatch(ids);
      const toDelete = [];
      for (const id of ids) {
        const lvl = levels.get(id);
        if (typeof lvl === 'number' && lvl < level) toDelete.push(id);
      }
      if (!toDelete.length) { toast(`No friends below level ${level}`, 'info'); return; }
      toast(`Deleting ${toDelete.length} friend${toDelete.length !== 1 ? 's' : ''}…`, 'info');
      let n = 0;
      for (const id of toDelete) {
        await waitSp('deleteFriendsLevel', 0.9, 1.6);
        if (await _deleteFriend(id)) n++;
      }
      toast(`Deleted ${n} friend${n !== 1 ? 's' : ''} below level ${level}`, 'success');
    }).catch(() => toast('Delete operation failed', 'error'));
  }

  async function performDeleteFriendsNoVip() {
    if (!requireToken()) return;
    await withOp('deleteFriendsVip', async () => {
      toast('Fetching friend list…', 'info');
      await waitSp('deleteFriendsVip', 0.8, 1.4);
      const ids = await getAllFriendIds();
      if (!ids.length) { toast('No friends found', 'info'); return; }
      toast(`Checking ${ids.length} friend${ids.length !== 1 ? 's' : ''}…`, 'info');
      const toDelete = [];
      for (const id of ids) {
        await waitSp('deleteFriendsVip', 0.35, 0.7);
        if (!await _friendIsVip(id)) toDelete.push(id);
      }
      if (!toDelete.length) { toast('All friends have VIP', 'info'); return; }
      toast(`Deleting ${toDelete.length} non-VIP friend${toDelete.length !== 1 ? 's' : ''}…`, 'info');
      let n = 0;
      for (const id of toDelete) {
        await waitSp('deleteFriendsVip', 0.9, 1.6);
        if (await _deleteFriend(id)) n++;
      }
      toast(`Deleted ${n} non-VIP friend${n !== 1 ? 's' : ''}`, 'success');
    }).catch(() => toast('Delete operation failed', 'error'));
  }

  async function handleFriendRequests(action, opKey) {
    await waitSp(opKey, 0.8, 1.5);
    const ids = await getFriendRequestIds();
    if (!ids.length) { toast('No pending requests', 'info'); return; }
    let n = 0;
    for (const rid of ids) {
      await waitSp(opKey, 0.3, 0.8);
      try {
        await mspPut(`/profilerelationships/v2/profiles/${rid}/relationships/requests/${state.profileId}`, { profileId: state.profileId, state: action });
        n++;
      } catch { /* request may have been withdrawn */ }
    }
    const verb = action === 'approved' ? 'accepted' : 'rejected';
    toast(`${n} request${n !== 1 ? 's' : ''} ${verb}`, 'success');
  }

  async function performReadMessages() {
    if (!requireToken()) return;
    await withOp('readMessages', async () => {
      if (!capturedMessagingBase) { toast('Open your in-game inbox first, then retry', 'info'); return; }
      await waitSp('messages', 0.5, 1.0);
      const convs = await getUnreadConversations();
      if (!convs.length) { toast('No unread messages', 'info'); return; }
      let n = 0;
      for (const conv of convs) {
        await waitSp('messages', 0.2, 0.5);
        try { if (await markConversationRead(conv)) n++; } catch { /* already read */ }
      }
      toast(`${n} conversation${n !== 1 ? 's' : ''} marked read`, 'success');
    }).catch(err => toast(`Failed: ${err.message}`, 'error'));
  }

