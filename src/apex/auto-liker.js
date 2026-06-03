  // ─── Automatic Liker ──────────────────────────────────────────────────────
  // Sends a "loveit" reaction to the WAYD of every user we detect — chatroom
  // members, profiles you open, etc. A serial queue with a 3–4 s gap between
  // each request keeps the rate low enough to look natural.

  const _autoLikeQueue = [];
  let _autoLikeProcessing = false;

  async function _maybeAutoLike(profileId, data) {
    if (!state.misc.autoLiker) return;
    if (!state.accessToken || !state.profileId) return;
    if (profileId === state.profileId) return;                  // don't auto-like yourself
    if (state.autoLikerSent.has(profileId)) return;             // already handled this session
    const wayd = data?.additionalData?.WAYD;
    if (!wayd) return;                                          // user has no status set
    state.autoLikerSent.add(profileId);
    _autoLikeQueue.push({ profileId, wayd });
    _processAutoLikeQueue();
  }

  async function _processAutoLikeQueue() {
    if (_autoLikeProcessing) return;
    _autoLikeProcessing = true;
    try {
      while (_autoLikeQueue.length) {
        const job = _autoLikeQueue.shift();
        // Base 3.0–4.0 s gap (decimal precision) scaled by the user's chosen speed.
        await waitSp('autoLiker', 3.0, 4.0);
        if (!state.misc.autoLiker) {
          // Feature was turned off while waiting — drop the queue.
          _autoLikeQueue.length = 0;
          break;
        }
        try {
          const res = await sf(
            `${API_BASE}/profilereactions/v1/profiles/${state.profileId}/reactions/sources/profilegeneratedcontent/entities/${job.wayd}`,
            {
              method:  'POST',
              headers: {
                authorization:  `Bearer ${state.accessToken}`,
                'content-type': 'application/json',
              },
              body: JSON.stringify({ reactionTypeId: 'loveit', entityGameId: GAME_ID }),
            }
          );
          if (res.status === 201) {
            toast('Auto-loveit sent', 'success');
          } else {
            // Allow a retry on the next encounter if the call wasn't accepted.
            state.autoLikerSent.delete(job.profileId);
          }
        } catch {
          state.autoLikerSent.delete(job.profileId);
        }
      }
    } finally {
      _autoLikeProcessing = false;
    }
  }

