  // ─── Tab switching & UI sync ──────────────────────────────────────────────

  function switchTab(id) {
    activeTab = id;
    const connected = !!state.accessToken;

    for (const [t, btn] of Object.entries(refs.tabBtns)) {
      const active      = t === id;
      btn.style.color       = active ? T.acc : T.sub;
      btn.style.borderColor = active ? T.acc : 'transparent';
    }

    for (const t of ALL_TAB_IDS) {
      const show = t === id;
      if (t === 'misc' || t === 'chatroom') {
        refs.skelPanes[t].style.display = 'none';
        refs.panes[t].style.display     = show ? 'flex' : 'none';
      } else {
        refs.skelPanes[t].style.display = show && !connected ? 'flex' : 'none';
        refs.panes[t].style.display     = show && connected  ? 'flex' : 'none';
      }
    }
    if (id === 'chatroom') _refreshChatroomPane();
  }

  function updateUI() {
    if (!menu) return;
    const connected = !!state.accessToken;

    refs.msgBanner.style.display = capturedMessagingBase ? 'none' : 'flex';

    for (const t of ALL_TAB_IDS) {
      const show = t === activeTab;
      if (t === 'misc' || t === 'chatroom') {
        refs.skelPanes[t].style.display = 'none';
        refs.panes[t].style.display     = show ? 'flex' : 'none';
      } else {
        refs.skelPanes[t].style.display = show && !connected ? 'flex' : 'none';
        refs.panes[t].style.display     = show && connected  ? 'flex' : 'none';
      }
    }

    const opBtns = [
      [refs.gBtn,   state.ops.gender],
      [refs.mBtn,   state.ops.mood],
      [refs.sBtn,   state.ops.status],
      [refs.rBtn,   state.ops.restore],
      [refs.qBtn,   state.ops.quests],
      [refs.cBtn,   state.ops.crystals],
      [refs.afBtn,  state.ops.acceptFriends],
      [refs.rfBtn,  state.ops.rejectFriends],
      [refs.dfBtn,  state.ops.deleteFriendsLevel],
      [refs.dvBtn,  state.ops.deleteFriendsVip],
      [refs.rmBtn,  state.ops.readMessages],
    ];
    for (const [btn, op] of opBtns) {
      if (op.loading && connected) btn.setLoading(true);
      else { btn.setLoading(false); btn.setDisabled(!connected); }
    }

    if (refs.pkgOpenBtn) refs.pkgOpenBtn.setDisabled(!connected);
    if (pkgFloatingMenu && pkgFloatingMenu.style.display !== 'none') _buildPkgFloatingContent();

    if (refs.homesBtn) {
      if (state.ops.homes.loading && connected) refs.homesBtn.setLoading(true);
      else { refs.homesBtn.setLoading(false); refs.homesBtn.setDisabled(!connected || !HOMES_DB.length); }
    }

    if (state.ops.avatar.loading && connected) {
      refs.avatarBtn?.setLoading(true);
    } else {
      refs.avatarBtn?.setLoading(false);
      refs.syncAvatarBtn?.();
    }

    refs.qBadge.textContent = `${state.ops.quests.progress} done`;
    const { collected, total } = state.ops.crystals;
    refs.cBadge.textContent = `${collected} / ${total}`;
    refs.cBar.style.width   = `${(collected / total) * 100}%`;
    if (refs.cBar.closest) {
      const track = refs.cBar.parentElement;
      if (track) track.style.display = collected > 0 ? 'block' : 'none';
    }
  }

