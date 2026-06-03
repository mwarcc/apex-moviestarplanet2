  async function _autographerFetchFace(profileId) {
    try {
      const verRes = await sf(
        `https://cdn.moviestarplanet2.com/avatars/${profileId}/games/${GAME_ID}/version.txt`,
        { method: 'GET' }
      );
      if (!verRes.ok) return;
      const version = (await verRes.text()).trim();
      state.autographer.targetFaceUrl =
        `https://cdn.moviestarplanet2.com/avatars/${profileId}/games/${GAME_ID}/face/${version}.png`;
      _refreshAutographerPanel();
    } catch { /* best-effort */ }
  }

  async function _resolveFaceUrl(profileId) {
    const cache = state.autographer.faceCache;
    if (cache.has(profileId)) return cache.get(profileId);
    try {
      const verRes = await sf(
        `https://cdn.moviestarplanet2.com/avatars/${profileId}/games/${GAME_ID}/version.txt`,
        { method: 'GET' }
      );
      if (!verRes.ok) return null;
      const version = (await verRes.text()).trim();
      const url = `https://cdn.moviestarplanet2.com/avatars/${profileId}/games/${GAME_ID}/face/${version}.png`;
      cache.set(profileId, url);
      return url;
    } catch { return null; }
  }

  async function _autographerSearchPlayers(query) {
    const ag = state.autographer;
    const q  = (query ?? '').trim();
    if (!q) { toast('Enter a username', 'error'); return; }
    if (!state.accessToken) { toast('Connect to the game first', 'error'); return; }
    if (ag.searching) return;

    ag.searching     = true;
    ag.searchQuery   = q;
    ag.searchResults = [];
    _buildAgFloatingContent();

    try {
      const region = _getRegion();

      const findRes = await sf(`${API_BASE}/edgerelationships/graphql`, {
        method:  'POST',
        headers: {
          authorization: `Bearer ${state.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'query GetProfileSearch($region: String!, $startsWith: String!, $pageSize: Int, $currentPage: Int, $preferredGameId: String!) { findProfiles(region: $region, nameBeginsWith: $startsWith, pageSize: $pageSize, page: $currentPage) { totalCount nodes { id avatar(preferredGameId: $preferredGameId) { gameId } } } }',
          variables: { region, startsWith: q, pageSize: 50, currentPage: 1, preferredGameId: GAME_ID },
        }),
      });
      if (!findRes.ok) throw new Error(`HTTP ${findRes.status}`);
      const findData = await findRes.json();
      const ids = (findData?.data?.findProfiles?.nodes ?? []).map(n => n.id);

      if (!ids.length) {
        ag.searchResults = [];
        toast('No players found', 'info');
        return;
      }

      const profRes = await sf(`${API_BASE}/edgerelationships/graphql`, {
        method:  'POST',
        headers: {
          authorization: `Bearer ${state.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'query GetProfiles($profileIds: [String!]!, $gameId: String!){ profiles(profileIds: $profileIds){ id name culture avatar(preferredGameId: $gameId){ gameId } membership { lastTierExpiry } } }',
          variables: { profileIds: ids, gameId: GAME_ID },
        }),
      });
      if (!profRes.ok) throw new Error(`HTTP ${profRes.status}`);
      const profData = await profRes.json();
      const profiles = profData?.data?.profiles ?? [];

      ag.searchResults = profiles.map(p => ({
        id: p.id, name: p.name ?? 'Unknown', faceUrl: null,
        vip: !!(p.membership && p.membership.lastTierExpiry &&
                new Date(p.membership.lastTierExpiry) > new Date()),
      }));
      _buildAgFloatingContent();

      await Promise.all(ag.searchResults.map(async (r) => {
        const url = await _resolveFaceUrl(r.id);
        if (url) {
          r.faceUrl = url;
          const imgEl = (shRoot() ?? document).querySelector(`[data-face-id="${r.id}"]`);
          if (imgEl) imgEl.src = url;
        }
      }));
    } catch (err) {
      toast(err?.message ?? 'Search failed', 'error');
    } finally {
      ag.searching = false;
      _buildAgFloatingContent();
    }
  }

  function _autographerSelectSearchResult(profileId) {
    const ag = state.autographer;
    if (ag.running) { toast('Stop the autographer first', 'error'); return; }
    const r = ag.searchResults.find(x => x.id === profileId);
    if (!r) return;
    ag.targetProfile = { id: r.id, name: r.name, created: null };
    ag.targetFaceUrl = r.faceUrl;
    ag.searchResults = [];
    ag.searchQuery   = '';
    toast(`Target set: ${r.name}`, 'success');
    _refreshAutographerPanel();
    if (!ag.targetFaceUrl) _autographerFetchFace(r.id).catch(() => {});
  }

  function _refreshAutographerPanel() {
    if (refs.autographerPanel) _buildAutographerPanelContent();
    _buildAgFloatingContent();
  }

  function _refreshAgUserCount() {
    if (refs.agUserBadge) {
      const n = state.chatroomUsers.size;
      refs.agUserBadge.textContent = `${n} user${n !== 1 ? 's' : ''}`;
    }
    _buildAgFloatingContent();
  }

  function insertSoftHyphens(text) {
    return text.split('').join(SOFT_HYPHEN);
  }

