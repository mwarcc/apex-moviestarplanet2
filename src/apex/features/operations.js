  // ─── Operations ───────────────────────────────────────────────────────────

  function requireToken() {
    if (state.accessToken) return true;
    toast('Not connected', 'error');
    return false;
  }

  async function withOp(opKey, fn) {
    state.ops[opKey].loading = true;
    updateUI();
    try { await fn(); }
    finally { state.ops[opKey].loading = false; updateUI(); }
  }

  async function performGenderSwap() {
    if (!requireToken()) return;
    await withOp('gender', async () => {
      await wait(1.0, 2.0);
      const attrs = await getProfileAttrs();
      await wait(0.4, 0.9);
      const next  = attrs.additionalData?.Gender?.toLowerCase() === 'girl' ? 'Boy' : 'Girl';
      await putProfileAttrs({ ...attrs, additionalData: { ...attrs.additionalData, Gender: next } });
      toast(`Gender → ${next}`, 'success');
    }).catch(() => toast('Gender swap failed', 'error'));
  }

  async function performMoodChange(forcedMood) {
    const mood = forcedMood ?? menu.querySelector(`#${UID.mood}`)?.value;
    if (!mood)           { toast('Select a mood', 'error'); return; }
    if (!requireToken()) return;
    await withOp('mood', async () => {
      await wait(1.0, 2.0);
      const attrs = await getProfileAttrs();
      await wait(0.4, 0.9);
      await putProfileAttrs({ ...attrs, additionalData: { ...attrs.additionalData, Mood: mood } });
      // Track for outgoing WebSocket 7001 rewrite.
      state.appliedMood = mood;
      toast(`Mood → ${mood}`, 'success');
    }).catch(() => toast('Mood change failed', 'error'));
  }

  async function performStatusUpdate() {
    const input = menu.querySelector(`#${UID.status}`);
    const text  = input?.value?.trim();
    if (!text)           { toast('Enter status text', 'error'); return; }
    if (!requireToken()) return;
    await withOp('status', async () => {
      await wait(1.0, 2.0);
      const attrs  = await getProfileAttrs();
      const waydId = attrs?.additionalData?.WAYD;
      if (!waydId) throw new Error('No WAYD ID found on profile');
      await wait(0.5, 1.0);
      const meta  = await mspGet(`/profilegeneratedcontent/v2/profiles/content/${waydId}`);
      if (!meta)   throw new Error('UGC metadata not found');
      const pgcId = findResourceId(meta, 'PgcV1');
      if (!pgcId)  throw new Error('PGC resource not found');
      await wait(0.5, 1.0);
      const cdnRes = await sf(`${CDN_BASE}/${pgcId}`, { method: 'GET' });
      if (!cdnRes.ok) throw new Error(`CDN fetch failed: HTTP ${cdnRes.status}`);
      const BSON = _BSON;
      if (!BSON) throw new Error('BSON library not loaded');
      const doc = BSON.deserialize(new Uint8Array(await cdnRes.arrayBuffer()), { promoteValues: false, promoteLongs: false, promoteBuffers: false });
      if (Array.isArray(doc.Texts) && doc.Texts.length > 0) doc.Texts[0] = text;
      else doc.Texts = [text];
      await wait(0.5, 1.0);
      const ugcDoc    = buildUGCDocument(BSON.serialize(doc), meta.title ?? meta.name ?? 'Room', 'WAYD', meta.privacy ?? meta.privacyStatus ?? 'Public');
      const signature = await calculateSignature(ugcDoc);
      await wait(0.5, 1.0);
      const uploadRes = await sf(
        `${API_BASE}/profilegeneratedcontent/v2/profiles/${state.profileId}/games/${GAME_ID}/content/${waydId}`,
        { method: 'PUT', headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/bson', signature }, body: ugcDoc }
      );
      if (!uploadRes.ok) throw new Error(`Upload failed: HTTP ${uploadRes.status}`);
      toast('Status updated', 'success');
      input.value = '';
    }).catch(err => toast(err.message ?? 'Status update failed', 'error'));
  }

