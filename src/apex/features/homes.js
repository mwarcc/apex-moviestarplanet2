  // ─── Glitched Homes ───────────────────────────────────────────────────────

  function _b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function performHomeSet(homeName) {
    if (!requireToken()) return;
    const home = HOMES_DB.find(h => h.name === homeName);
    if (!home) { toast('Home not found', 'error'); return; }
    if (!home.bson_data) { toast('Home has no bson_data', 'error'); return; }

    await withOp('homes', async () => {
      await wait(0.8, 1.6);
      const attrs  = await getProfileAttrs();
      const homeId = attrs?.additionalData?.DefaultMyHome;
      if (!homeId) throw new Error('No DefaultMyHome on profile');

      const pgcBytes  = _b64ToBytes(home.bson_data);
      const ugcDoc    = buildUGCDocument(pgcBytes, 'Room', null, 'Public');
      const signature = await calculateSignature(ugcDoc);

      await wait(0.4, 0.9);
      const res = await sf(
        `${API_BASE}/profilegeneratedcontent/v2/profiles/${state.profileId}/games/${GAME_ID}/content/${homeId}`,
        {
          method:  'PUT',
          headers: {
            authorization:  `Bearer ${state.accessToken}`,
            'content-type': 'application/bson',
            signature,
          },
          body: ugcDoc,
        }
      );
      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      toast(`Home set: ${homeName}`, 'success');
    }).catch(err => toast(err.message ?? 'Home update failed', 'error'));
  }

  // Refresh the Homes dropdown once HOMES_DB is populated (or repopulated).
  function _refreshHomesDropdown() {
    const sel = refs.homesSel;
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '';
    const mkOpt = (val, label) => {
      const o = document.createElement('option');
      o.value = val;
      o.textContent = label;
      o.style.background = T.sur;
      o.style.color      = T.txt;
      return o;
    };
    if (!HOMES_DB.length) {
      sel.appendChild(mkOpt('', 'No homes available'));
      sel.disabled = true;
    } else {
      sel.disabled = false;
      sel.appendChild(mkOpt('', 'Choose a home…'));
      for (const h of HOMES_DB) sel.appendChild(mkOpt(h.name, h.name));
      if (prev && HOMES_DB.some(h => h.name === prev)) sel.value = prev;
    }
    if (refs.homesPreviewUpdate) refs.homesPreviewUpdate();
    updateUI();
  }

  // Homes are bootstrapped synchronously from `_apex_data.homes`; no
  // postMessage listener is needed (and no fixed event name is left exposed
  // to the page either way).

