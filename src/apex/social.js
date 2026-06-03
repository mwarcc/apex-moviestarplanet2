  // ─── Social queries ───────────────────────────────────────────────────────

  async function getFriendRequestIds() {
    const res = await sf(`${API_BASE}/edgerelationships/graphql`, {
      method:  'POST',
      headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'query GetAllRelationships($profileId: String!, $gameId: String!){ relationships(profileId: $profileId) { nodes { profileId labels(gameId: $gameId) } } requestsIn(profileId: $profileId) { nodes { profileId } } requestsOut(profileId: $profileId) { nodes { profileId } } blocked(profileId: $profileId) { nodes { profileId } } labelRequestsIn(profileId: $profileId, gameId: $gameId) { nodes { profileId label } } labelRequestsOut(profileId: $profileId, gameId: $gameId) { nodes { profileId label } } }',
        variables: {
          profileId: state.profileId,
          gameId:    GAME_ID,
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.data?.requestsIn?.nodes ?? []).map(n => n.profileId);
  }

  async function getUnreadConversations() {
    const data = await messagingGet(`/gamemessaging/v1/participants/${state.profileId}/conversations?page=1&pageSize=200`);
    return Array.isArray(data) ? data.filter(c => (c.numberOfUnreadMessages ?? 0) > 0) : [];
  }

  async function markConversationRead(conv) {
    if (!conv.conversationId) return false;
    await messagingPut(
      `/gamemessaging/v1/conversations/${conv.conversationId}/participants/${state.profileId}`,
      { numUnread: 0, isMuted: conv.muted ?? false }
    );
    return true;
  }

  // ─── Profile attributes helper ────────────────────────────────────────────

  async function getProfileAttrs() {
    return mspGet(`/profileattributes/v1/profiles/${state.profileId}/games/${GAME_ID}/attributes`);
  }
  async function putProfileAttrs(attrs) {
    return mspPut(`/profileattributes/v1/profiles/${state.profileId}/games/${GAME_ID}/attributes`, attrs);
  }

  // ─── Reward state helper ──────────────────────────────────────────────────

  async function fetchActiveRewards(pid) {
    return mspGet(`/timelimitedrewards/v2/profiles/${pid}/games/${GAME_ID}/rewards?state=active`);
  }

