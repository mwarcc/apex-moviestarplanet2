  // ─── Player experience (hover popover) ──────────────────────────────────
  // Fetch & cache /experience/v1/profiles/{pid}/games/j68d/experience for
  // arbitrary players. Result is cached for the session (60 s TTL).

  const _experienceCache = new Map();    // profileId -> { data, ts }
  const _experienceInFlight = new Map(); // profileId -> Promise
  const EXPERIENCE_TTL_MS = 60_000;

  async function _fetchPlayerExperience(profileId) {
    if (!profileId || !state.accessToken) return null;
    const cached = _experienceCache.get(profileId);
    if (cached && Date.now() - cached.ts < EXPERIENCE_TTL_MS) return cached.data;
    if (_experienceInFlight.has(profileId)) return _experienceInFlight.get(profileId);
    const p = (async () => {
      try {
        const res = await sf(
          `${API_BASE}/experience/v1/profiles/${profileId}/games/${GAME_ID}/experience`,
          { method: 'GET', headers: { authorization: `Bearer ${state.accessToken}` } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const exp = data?.experience;
        if (!exp || typeof exp.xp !== 'number') return null;
        _experienceCache.set(profileId, { data: exp, ts: Date.now() });
        return exp;
      } catch { return null; }
      finally { _experienceInFlight.delete(profileId); }
    })();
    _experienceInFlight.set(profileId, p);
    return p;
  }


  async function onSocketMessage(ws, data) {
    if (typeof data !== 'string' || !data.startsWith('42')) return;
    let parsed;
    try { parsed = JSON.parse(data.slice(2)); } catch { return; }
    if (!Array.isArray(parsed) || parsed.length < 1) return;
    const eventName = parsed[0];
    const payload   = parsed[1] ?? {};
    const info      = trackedSockets.get(ws);
    if (!info) return;

    // ── Incoming chat messages ────────────────────────────────────────────
    // We don't know the canonical event name across game versions, so we
    // accept a few common shapes and probe for { profileId, message }.
    if (eventName === 'chatv2:receive' || eventName === 'chat:receive' || eventName === 'chatv2:message') {
      const pid  = payload.profileId ?? payload.senderId;
      const text = payload.message ?? payload.text;
      if (pid && typeof text === 'string') {
        const u = state.chatroomUsers.get(pid);
        _addFeed({ type: 'chat', profileId: pid, name: u?.name ?? payload.name ?? 'Unknown', faceUrl: u?.faceUrl ?? null, text });
      }
    }

    // ── Generic chat detector ─────────────────────────────────────────────
    // Many "message"-wrapped packets carry chat as { messageContent: { sessionId|profileId, message } }
    // without a stable messageType across versions. If we see a non-empty
    // string `message` field, treat it as chat.
    if (eventName === 'message') {
      const mc2 = payload.messageContent ?? {};
      const txt = typeof mc2.message === 'string' ? mc2.message
                : typeof mc2.text    === 'string' ? mc2.text
                : typeof mc2.chatMessage === 'string' ? mc2.chatMessage
                : null;
      if (txt && txt.length > 0) {
        let pid  = mc2.profileId ?? mc2.senderId ?? null;
        let user = pid ? state.chatroomUsers.get(pid) : null;
        if (!user && mc2.sessionId != null) {
          const ref = _profileFromSession(mc2.sessionId);
          if (ref) { pid = ref.pid; user = ref.user; }
        }
        if (pid || user || mc2.name) {
          _addFeed({
            type: 'chat',
            profileId: pid,
            name:      user?.name ?? mc2.name ?? 'Unknown',
            faceUrl:   user?.faceUrl ?? null,
            text:      txt,
          });
        }
      }
    }

    // ── Chatroom roster + state tracking ──────────────────────────────────
    if (eventName === 'message') {
      const mt = payload.messageType;
      const mc = payload.messageContent ?? {};

      // Synthetic packets that WE dispatched (Hide / Show Players) are
      // tagged with `_axSynthetic`. The game still consumes them, but we
      // must not let them mutate our own roster cache — otherwise Show
      // Players would lose the data it needs to replay.
      const isSynthetic = mc && mc._axSynthetic === 1;

      if (mt === '2000' && mc.success === true && !isSynthetic) {
        // Joined a new room — reset roster & feed
        state.chatroomUsers.clear();
        state.sessionIdToProfileId.clear();
        state.chatroomRawJoins.clear();
        state.chatroomRoomId = mc.roomId ?? null;
        state.chatroomSocket = ws;
        // Reset hide state so the Hide Players button is usable in the new room
        crHidden.active = false;
        crHidden.users  = null;
        _refreshCrSettingsUI();
        // Self
        if (mc.profileId) {
          _setUserFromMsg(mc.profileId, mc.sessionId, { name: state.profileName ?? 'You' });
        }
        if (Array.isArray(mc.otherUsers)) {
          for (const u of mc.otherUsers) {
            _setUserFromMsg(u.profileId, u.sessionId, u.profileData);
            // Cache the raw join shape so Show Players can replay it.
            state.chatroomRawJoins.set(u.profileId, {
              profileId: u.profileId,
              sessionId: u.sessionId,
              profileData: u.profileData,
            });
          }
        }
        _addFeed({ type: 'room', text: `Joined chatroom (${Math.max(0, state.chatroomUsers.size - 1)} other player${state.chatroomUsers.size - 1 !== 1 ? 's' : ''})` });
        _refreshAgUserCount();
        _refreshChatroomPane();
      } else if (mt === '20000' && !isSynthetic) {
        _setUserFromMsg(mc.profileId, mc.sessionId, mc.profileData);
        state.chatroomRawJoins.set(mc.profileId, {
          profileId: mc.profileId,
          sessionId: mc.sessionId,
          profileData: mc.profileData,
        });
        const u = state.chatroomUsers.get(mc.profileId);
        _addFeed({ type: 'join', profileId: mc.profileId, name: u?.name ?? 'Unknown', faceUrl: u?.faceUrl ?? null });
        _refreshAgUserCount();
        _refreshChatroomPlayers();
        // Fetch their current mood from attributes — no 7000 fires for late joiners.
        _fetchPlayerMood(mc.profileId);
      } else if (mt === '20090' && !isSynthetic) {
        const u = state.chatroomUsers.get(mc.profileId);
        if (u) _addFeed({ type: 'leave', profileId: mc.profileId, name: u.name, faceUrl: u.faceUrl });
        _removeUser(mc.profileId);
        state.chatroomRawJoins.delete(mc.profileId);
        _refreshAgUserCount();
        _refreshChatroomPlayers();
      } else if (mt === '7105') {
        // Mood change — { mood, sessionId }
        const ref = _profileFromSession(mc.sessionId);
        if (ref?.user) {
          ref.user.mood = mc.mood ?? ref.user.mood;
          state.chatroomUsers.set(ref.pid, ref.user);
          _addFeed({ type: 'mood', profileId: ref.pid, name: ref.user.name, faceUrl: ref.user.faceUrl, mood: mc.mood });
          _refreshChatroomPlayers();
        }
      } else if (mt === '7000') {
        // Bulk roster snapshot — { avatars: [{ ownerSessionId, mood, ... }] }
        if (Array.isArray(mc.avatars)) {
          for (const av of mc.avatars) {
            const ref = _profileFromSession(av.ownerSessionId);
            if (ref?.user && typeof av.mood === 'string') {
              ref.user.mood = av.mood;
              state.chatroomUsers.set(ref.pid, ref.user);
            }
          }
          _refreshChatroomPlayers();
          _refreshAgUserCount();
        }
      } else if (mt === '7001') {
        // Position + mood broadcast from another player — capture mood
        const ref = _profileFromSession(mc.sessionId);
        if (ref?.user && typeof mc.mood === 'string' && ref.user.mood !== mc.mood) {
          ref.user.mood = mc.mood;
          state.chatroomUsers.set(ref.pid, ref.user);
          _refreshChatroomPlayers();
        }
      }
    }

    if (isQuizRelated(eventName, payload) && !info.isQuiz) {
      info.isQuiz = true;
      activeQuizSockets.add(ws);
    }
    if (!state.quizBot.enabled || !info.isQuiz) return;
    const question = extractQuizQuestion(eventName, payload);
    if (!question?.questionKey) return;
    if (info.lastQuestion === question.questionKey || info.answering) return;
    info.lastQuestion = question.questionKey;
    info.answering    = true;
    try { await answerQuestion(ws, question.questionKey); }
    finally { info.answering = false; }
  }

  async function answerQuestion(ws, questionKey) {
    if (ws.readyState !== _nativeWS.OPEN) return;
    await wait(2, 7);
    if (ws.readyState !== _nativeWS.OPEN) return;
    const known = Object.hasOwn(QUESTIONS_DB, questionKey);
    const answerIndex = known ? parseInt(QUESTIONS_DB[questionKey], 10) : Math.floor(Math.random() * 3) + 1;
    if (known) state.quizBot.stats.correct++;
    else       state.quizBot.stats.wrong++;
    state.quizBot.stats.totalAnswered++;
    _refreshQuizStats();
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
    if (ws.readyState !== _nativeWS.OPEN) return;
    ws.send(`42${JSON.stringify(['quiz:answer', { answer: answerIndex }])}`);
  }

  function toggleQuizBot(enabled) {
    state.quizBot.enabled = enabled;
    if (enabled) {
      state.quizBot.stats = { totalAnswered: 0, correct: 0, wrong: 0, startTime: Date.now() };
      for (const [, info] of trackedSockets) { info.lastQuestion = null; info.answering = false; }
      _refreshQuizStats();
      toast(`Quiz bot active — ${activeQuizSockets.size} socket(s)`, 'success');
      return;
    }
    const { totalAnswered, correct } = state.quizBot.stats;
    _refreshQuizStats();
    if (totalAnswered > 0) {
      const acc = Math.round((correct / totalAnswered) * 100);
      toast(`Bot off — ${totalAnswered} answered · ${acc}% accuracy`, 'info');
    } else {
      toast('Quiz bot disabled', 'info');
    }
  }

  function _refreshQuizStats() {
    const s = state.quizBot.stats;
    if (refs.qbBadge) refs.qbBadge.textContent = `${s.totalAnswered} answered`;
  }

