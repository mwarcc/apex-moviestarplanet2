  // ─── JWT / token ──────────────────────────────────────────────────────────

  function parseJWT(token) {
    try {
      let payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  function _getRegion() {
    try {
      const claims = parseJWT(state.accessToken);
      if (claims?.server)    return String(claims.server).toUpperCase();
      if (claims?.iss) {
        const m = claims.iss.match(/-([\w]+)\.msp/i);
        if (m) return m[1].toUpperCase();
      }
    } catch { /* fall through */ }
    return 'FR';
  }

  let hasShownLoginToast = false;

  function captureToken(token) {
    if (state.accessToken === token) return;
    const claims = parseJWT(token);
    if (!claims?.profileId) return;

    const wasDisconnected = !state.accessToken;
    state.accessToken = token;
    state.profileId   = claims.profileId;
    state.profileName = claims.name ?? claims.username ?? 'Unknown';

    updateUI();

    if (wasDisconnected && !hasShownLoginToast) {
      hasShownLoginToast = true;
      toast(`Connected as ${state.profileName}`, 'success');
    }
  }

