  // ─── Autographer panel content builder ────────────────────────────────────

  function _buildAutographerPanelContent() {
    const panel = refs.autographerPanel;
    if (!panel) return;
    panel.innerHTML = '';
    const ag = state.autographer;
    const pad = mk('div', { padding: '12px' });

    if (!ag.targetProfile) {
      // Waiting state
      const banner = buildInfoBanner('Open the target player profile in-game — APEX will detect it automatically.');
      pad.appendChild(banner);
      panel.appendChild(pad);
      return;
    }

    // ── Profile card ──────────────────────────────────────────────────────
    const card = mk('div', {
      display: 'flex', gap: '10px', alignItems: 'center',
      padding: '10px 12px',
      background: T.accDim, borderBottom: `1px solid ${T.bdr}`,
    });

    // Info
    const info = mk('div', { flex: '1', minWidth: '0', overflow: 'hidden' });
    const nameEl = mk('div', {
      fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px',
    });
    nameEl.textContent = ag.targetProfile.name;
    info.appendChild(nameEl);

    const idEl = mk('div', {
      fontFamily: T.mono, fontSize: '10px', color: T.muted,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px',
    });
    idEl.textContent = ag.targetProfile.id;
    info.appendChild(idEl);

    if (ag.targetProfile.created) {
      const dateEl = mk('div', { fontFamily: T.sans, fontSize: '10px', color: T.sub });
      const d = new Date(ag.targetProfile.created);
      dateEl.textContent = `Created ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
      info.appendChild(dateEl);
    }
    card.appendChild(info);

    // Clear target btn
    const clearBtn = mk('button', {
      fontFamily: T.sans, fontSize: '10px', fontWeight: '500', color: T.sub,
      background: 'transparent', border: `1px solid ${T.bdrSub}`,
      borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', outline: 'none', flexShrink: '0',
    });
    clearBtn.textContent = '✕';
    clearBtn.title = 'Clear target';
    clearBtn.addEventListener('click', () => {
      if (ag.running) { toast('Stop the autographer first', 'error'); return; }
      ag.targetProfile = null;
      ag.targetFaceUrl = null;
      _buildAutographerPanelContent();
    });
    card.appendChild(clearBtn);
    panel.appendChild(card);

    // ── Controls ─────────────────────────────────────────────────────────
    const controls = mk('div', { padding: '10px 12px' });

    // VIP hint
    const vipHint = mk('div', {
      fontFamily: T.sans, fontSize: '10.5px', color: T.sub,
      marginBottom: '10px', lineHeight: '1.55',
    });
    vipHint.textContent = ag.vipChecked
      ? (ag.isVip
          ? 'VIP membership detected — your account is eligible for the accelerated tier, dispatching one autograph every 2 minutes (30 per hour) until the requested quota is reached.'
          : 'Standard (non-VIP) account detected — the server enforces a strict cooldown of one autograph per hour. Upgrade to VIP to lift the limit up to one every 2 minutes.')
      : 'Delivery rate is gated by your membership: VIP members can send one autograph every 2 minutes (up to 30 per hour), while Standard accounts are throttled to one autograph per hour. Your tier will be detected automatically once dispatch starts.';
    controls.appendChild(vipHint);

    // Count selector
    const countLbl = mk('div', {
      fontFamily: T.sans, fontSize: '11px', fontWeight: '600', color: T.txt, marginBottom: '5px',
    });
    countLbl.textContent = 'Autographs to send';
    controls.appendChild(countLbl);

    const countSel = buildSelect([
      ['1',  '1'],
      ['5',  '5'],
      ['10', '10'],
      ['25', '25'],
      ['50', '50'],
      ['0',  'Unlimited'],
    ]);
    countSel.value = String(ag.maxCount);
    controls.appendChild(countSel);
    refs.autographerCountSel = countSel;

    // Status line
    const statusEl = mk('div', {
      fontFamily: T.mono, fontSize: '10px', color: T.sub,
      marginBottom: '8px', minHeight: '14px',
    });
    if (ag.running) {
      const max = ag.maxCount > 0 ? `/ ${ag.maxCount}` : '/ ∞';
      statusEl.textContent = `Sent ${ag.sentCount} ${max} · Next in ${_fmtSec(ag.nextInSec)}`;
    }
    controls.appendChild(statusEl);
    refs.autographerStatus = statusEl;

    // Start / Stop button
    const startStopBtn = ag.running
      ? buildBtn('Stop Autographer', 'stop', 'danger')
      : buildBtn('Start Autographer', 'autograph');

    startStopBtn.addEventListener('click', () => {
      if (ag.running) autographerStop(false);
      else            autographerStart();
    });
    controls.appendChild(startStopBtn);
    refs.autographerStartStopBtn = startStopBtn;

    panel.appendChild(controls);
  }

