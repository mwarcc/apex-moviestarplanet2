  // ─── Chatroom roster / feed helpers ───────────────────────────────────────

  const CDN_FACE_BASE = 'https://cdn.moviestarplanet2.com';

  function _faceUrlFromProfileData(pd) {
    if (!pd) return null;
    const v2 = pd.avatarV2;
    if (v2?.face) return `${CDN_FACE_BASE}/${v2.face}`;
    // Legacy fallback — older clients only have avatarBasePath + avatarFace
    if (pd.avatarBasePath && pd.avatarFace) return `${CDN_FACE_BASE}/${pd.avatarBasePath}${pd.avatarFace}`;
    return null;
  }

  function _addFeed(entry) {
    const list = state.chatroomFeed;
    const full = { ts: Date.now(), ...entry };
    list.push(full);
    if (list.length > state.chatroomFeedMax) list.splice(0, list.length - state.chatroomFeedMax);
    // Incremental UI update — only append the new row, don't rebuild.
    _appendFeedRow(full);
  }

  function _setUserFromMsg(profileId, sessionId, profileData) {
    if (!profileId) return;
    const existing = state.chatroomUsers.get(profileId) ?? {};
    const merged = {
      name:     profileData?.name ?? existing.name ?? 'Unknown',
      sessionId: sessionId ?? existing.sessionId ?? null,
      mood:     existing.mood ?? null,
      faceUrl:  _faceUrlFromProfileData(profileData) ?? existing.faceUrl ?? null,
      isVip:    profileData?.isVip ?? existing.isVip ?? null,
    };
    state.chatroomUsers.set(profileId, merged);
    if (merged.sessionId != null) state.sessionIdToProfileId.set(merged.sessionId, profileId);
  }

  function _removeUser(profileId) {
    const u = state.chatroomUsers.get(profileId);
    if (u?.sessionId != null) state.sessionIdToProfileId.delete(u.sessionId);
    state.chatroomUsers.delete(profileId);
  }

  function _profileFromSession(sessionId) {
    const pid = state.sessionIdToProfileId.get(sessionId);
    return pid ? { pid, user: state.chatroomUsers.get(pid) } : null;
  }

  // Fetch a single player's mood when we don't already know it.
  // Deduped per session so simultaneous joins don't fan out.
  const _moodFetchInFlight = new Set();
  async function _fetchPlayerMood(profileId) {
    if (!profileId || profileId === state.profileId) return;
    if (!state.accessToken) return;
    const existing = state.chatroomUsers.get(profileId);
    if (existing?.mood) return;                  // already known
    if (_moodFetchInFlight.has(profileId)) return;
    _moodFetchInFlight.add(profileId);
    try {
      const res = await sf(
        `${API_BASE}/profileattributes/v1/profiles/${profileId}/games/${GAME_ID}/attributes`,
        { method: 'GET', headers: { authorization: `Bearer ${state.accessToken}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const mood = data?.additionalData?.Mood;
      if (!mood) return;
      const u = state.chatroomUsers.get(profileId);
      if (!u) return;
      u.mood = mood;
      state.chatroomUsers.set(profileId, u);
      _refreshChatroomPlayers();
    } catch { /* ignore */ } finally {
      _moodFetchInFlight.delete(profileId);
    }
  }

