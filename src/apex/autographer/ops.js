
  async function _autographerCheckVip() {
    if (state.autographer.vipChecked) return;
    try {
      const pid = state.profileId;
      const memberships = await apiFetch(
        `${API_BASE}/profilememberships/v1/memberships/summary/profiles/${pid}`,
        { method: 'GET', headers: { 'skip-not-found-items': 'true' } }
      );
      if (Array.isArray(memberships) && memberships.length > 0) {
        const m   = memberships[0];
        const now = new Date();
        const exp = m.currentTierExpiry ? new Date(m.currentTierExpiry) : null;
        state.autographer.isVip = !!exp && exp > now;
      }
    } catch { /* assume non-VIP */ }
    state.autographer.vipChecked = true;
  }

  async function _autographerSendOne() {
    const ag     = state.autographer;
    const target = ag.targetProfile?.id;
    if (!target || !state.accessToken) return 0;

    const res = await sf(`${API_BASE}/federationgateway/graphql`, {
      method:  'POST',
      headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/json' },
      body:    JSON.stringify({
        id:        'SendGreetings-159BDD7706D824BB8F14874A7FAE3368',
        variables: { greetingType: 'Autograph', receiverProfileId: target, ignoreDailyCap: false },
      }),
    });

    if (!res.ok) return -1;
    const data = await res.json();
    const send = data?.data?.greetings?.sendGreeting;

    if (send?.success) {
      ag.sentCount++;
      const wait = send?.data?.nextGreetingSecondsRemaining ?? (ag.isVip ? 120 : 3600);
      _refreshAutographerPanel();
      return wait;
    } else {
      const wait = send?.error?.nextGreetingSecondsRemaining ?? (ag.isVip ? 120 : 3600);
      return wait;
    }
  }

  async function autographerStart() {
    if (!requireToken()) return;
    const ag = state.autographer;
    if (!ag.targetProfile) { toast('No target profile captured yet', 'error'); return; }
    if (ag.running) return;

    await _autographerCheckVip();
    ag.running    = true;
    ag.sentCount  = 0;
    ag.maxCount   = refs.agFloatCountSel ? parseInt(refs.agFloatCountSel.value, 10) : 1;
    _refreshAutographerPanel();
    toast(`✉️ Autographer started → ${ag.targetProfile.name}`, 'success');

    const _loop = async () => {
      if (!ag.running) return;
      if (ag.maxCount > 0 && ag.sentCount >= ag.maxCount) {
        autographerStop(true);
        return;
      }
      const nextSec = await _autographerSendOne();
      if (!ag.running) return;
      if (nextSec < 0) {
        autographerStop(false);
        toast('Autographer stopped — send error', 'error');
        return;
      }
      if (ag.maxCount > 0 && ag.sentCount >= ag.maxCount) {
        autographerStop(true);
        return;
      }
      _refreshAutographerPanel();
      _buildAgFloatingContent();
      // Always respect the server-enforced cooldown regardless of instant mode.
      // Instant mode only skips our own artificial delay — it never overrides
      // a nextGreetingSecondsRemaining returned by the API.
      ag.nextInSec = nextSec;
      if (ag.countdownTimer) clearInterval(ag.countdownTimer);
      if (!ag.instantMode) {
        ag.countdownTimer = setInterval(() => {
          ag.nextInSec = Math.max(0, ag.nextInSec - 1);
          if (refs.agFloatStatus) {
            const max = ag.maxCount > 0 ? `/ ${ag.maxCount}` : '/ ∞';
            refs.agFloatStatus.textContent = `Sent ${ag.sentCount} ${max} · Next in ${_fmtSec(ag.nextInSec)}`;
          }
        }, 1000);
      }
      ag.timer = setTimeout(() => {
        if (ag.countdownTimer) { clearInterval(ag.countdownTimer); ag.countdownTimer = null; }
        _loop();
      }, nextSec * 1000);
    };

    _loop();
  }

  function autographerStop(finished) {
    const ag = state.autographer;
    ag.running = false;
    if (ag.timer)         { clearTimeout(ag.timer);         ag.timer = null; }
    if (ag.countdownTimer){ clearInterval(ag.countdownTimer); ag.countdownTimer = null; }
    if (finished) toast(`Autographer done — ${ag.sentCount} sent`, 'success');
    else          toast(`Autographer stopped — ${ag.sentCount} sent`, 'info');
    ag.greetingAllAbort = true;
    _refreshAutographerPanel();
    _buildAgFloatingContent();
  }

  function _fmtSec(s) {
    if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    if (s >= 60)   return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  }
  async function _sendGreetingToAll(greetingType) {
    if (!requireToken()) return;
    const users = [...state.chatroomUsers.keys()];
    if (!users.length) { toast('No users tracked in this chatroom yet', 'error'); return; }
    const ag = state.autographer;
    if (ag.greetingAllRunning) return;
    ag.greetingAllRunning = true;
    ag.greetingAllAbort   = false;
    ag.greetingAllType    = greetingType;
    ag.greetingAllProgress = 0;
    ag.greetingAllTotal   = users.length;
    _buildAgFloatingContent();
    toast(`Sending ${greetingType} to ${users.length} users…`, 'info');

    for (const profileId of users) {
      if (ag.greetingAllAbort) break;
      try {
        const res = await sf(`${API_BASE}/federationgateway/graphql`, {
          method:  'POST',
          headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/json' },
          body:    JSON.stringify({
            id:        'SendGreetings-159BDD7706D824BB8F14874A7FAE3368',
            variables: { greetingType, receiverProfileId: profileId, ignoreDailyCap: false },
          }),
        });
        const data     = await res.json();
        const sendData = data?.data?.greetings?.sendGreeting;
        // Stop entirely if the greeting type is unavailable (no spings/stars left)
        if (sendData?.error?.reason === 'FailedDefinitionNotFound') {
          ag.greetingAllAbort = true;
          toast(`${greetingType}: not enough left — stopping`, 'error');
          break;
        }
        ag.greetingAllProgress++;
        if (refs.agGreetProgress) {
          refs.agGreetProgress.textContent = `${ag.greetingAllProgress} / ${ag.greetingAllTotal} sent`;
        }
      } catch { /* best-effort */ }
      if (!ag.instantMode && !ag.greetingAllAbort) await wait(1, 2);
    }

    const done = ag.greetingAllProgress;
    ag.greetingAllRunning = false;
    ag.greetingAllType    = null;
    if (!ag.greetingAllAbort) {
      toast(`${greetingType} sent to ${done} users`, 'success');
    }
    _buildAgFloatingContent();
  }

