  // ─── Cheap Packages ───────────────────────────────────────────────────────

  let pkgFloatingMenu = null;
  const pkgFloatDrag  = { on: false, ox: 0, oy: 0 };

  function buildPkgFloatingMenu() {
    if (pkgFloatingMenu) return;

    const win = mk('div', {
      position: 'fixed', bottom: '24px', right: '24px',
      width: '340px', maxWidth: 'calc(100vw - 32px)',
      background: T.bg, border: `1px solid ${T.bdr}`,
      borderRadius: '12px',
      boxShadow: `0 0 0 1px ${T.accGlow} inset, 0 24px 60px rgba(0,0,0,0.85), 0 0 50px ${T.accDim}`,
      zIndex: '2147483646', fontFamily: T.sans,
      display: 'none', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box',
      animation: 'ax-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      maxHeight: 'calc(100vh - 48px)',
    });
    win.id = UID.pkgFloat;

    for (const ev of ['mousedown', 'mouseup', 'mousemove', 'click', 'wheel', 'touchstart', 'touchend', 'touchmove']) {
      win.addEventListener(ev, e => e.stopImmediatePropagation(), { passive: ev.startsWith('touch') || ev === 'wheel' });
    }

    // Accent bar
    const bar = mk('div', {
      position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px',
      background: `linear-gradient(180deg, transparent 0%, ${T.acc} 30%, ${T.accBdr} 70%, transparent 100%)`,
      borderRadius: '2px 0 0 2px', opacity: '0.6', pointerEvents: 'none',
    });
    win.appendChild(bar);

    // Header
    const head = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', height: '44px',
      background: T.sur, borderBottom: `1px solid ${T.bdrSub}`,
      cursor: 'grab', userSelect: 'none', flexShrink: '0',
    });
    const headLeft = mk('div', { display: 'flex', alignItems: 'center', gap: '8px' });
    const headIcon = mk('span', { color: T.acc, display: 'flex', alignItems: 'center' });
    headIcon.innerHTML = ICONS.pkg;
    const headTitle = mk('span', {
      fontFamily: T.sans, fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.12em', color: T.txt, textTransform: 'uppercase',
    });
    headTitle.textContent = 'CHEAP PACKAGES';
    headLeft.appendChild(headIcon);
    headLeft.appendChild(headTitle);

    const headRight = mk('div', { display: 'flex', gap: '4px' });
    const closeBtn = buildCtrlBtn(
      `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      'Close', true
    );
    closeBtn.addEventListener('click', () => {
      win.style.display = 'none';
      _syncPkgOpenBtn();
    });
    headRight.appendChild(closeBtn);

    head.appendChild(headLeft);
    head.appendChild(headRight);

    // Drag logic
    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      e.stopImmediatePropagation(); e.preventDefault();
      const rect = win.getBoundingClientRect();
      pkgFloatDrag.on = true;
      pkgFloatDrag.ox = e.clientX - rect.left;
      pkgFloatDrag.oy = e.clientY - rect.top;
      head.style.cursor = 'grabbing';
      const onMove = ev => {
        if (!pkgFloatDrag.on) return;
        win.style.left   = Math.min(Math.max(0, ev.clientX - pkgFloatDrag.ox), innerWidth  - win.offsetWidth)  + 'px';
        win.style.top    = Math.min(Math.max(0, ev.clientY - pkgFloatDrag.oy), innerHeight - win.offsetHeight) + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
      };
      const onUp = () => {
        pkgFloatDrag.on = false;
        head.style.cursor = 'grab';
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup',   onUp,   true);
      };
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('mouseup',   onUp,   true);
    });

    win.appendChild(head);

    // Scrollable body
    const body = mk('div', {
      overflowY: 'auto', overflowX: 'hidden',
      padding: '12px 14px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: '0',
    });
    win.appendChild(body);
    refs.pkgFloatBody = body;

    pkgFloatingMenu = win;
    (shRoot() ?? document.body).appendChild(win);
    _buildPkgFloatingContent();
  }

  function _buildPkgFloatingContent() {
    const body = refs.pkgFloatBody;
    if (!body) return;
    body.innerHTML = '';

    // Header card — title + description + count badge
    const headerCard = mk('div', { paddingBottom: '14px', marginBottom: '14px', borderBottom: `1px solid ${T.bdrSub}` });
    const topRow = mk('div', {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '8px', marginBottom: '6px',
    });
    const titleEl = mk('div', { fontFamily: T.sans, fontSize: '12px', fontWeight: '600', color: T.txt, letterSpacing: '-0.01em', flex: '1', minWidth: '0' });
    titleEl.textContent = 'Discounted Offers';

    const countBadge = mk('span', {
      fontFamily: T.mono, fontSize: '10px', fontWeight: '500',
      color: T.acc, background: T.accDim, border: `1px solid ${T.accBdr}`,
      borderRadius: '4px', padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: '0', letterSpacing: '0.03em',
    });
    const n = state.pkgs.offers.length;
    if (state.pkgs.loading)        countBadge.textContent = '…';
    else if (state.pkgs.errorMsg)  countBadge.textContent = 'Error';
    else if (state.pkgs.fetched)   countBadge.textContent = `${n} offer${n !== 1 ? 's' : ''}`;
    else                           countBadge.textContent = '—';

    topRow.appendChild(titleEl);
    topRow.appendChild(countBadge);
    headerCard.appendChild(topRow);

    const desc = mk('div', { fontFamily: T.sans, fontSize: '11px', fontWeight: '400', color: T.sub, lineHeight: '1.55' });
    desc.textContent = 'Browse discounted VIP subscription offers tailored to your region. The cheapest deals are surfaced first — click any offer to open the checkout flow.';
    headerCard.appendChild(desc);
    body.appendChild(headerCard);

    // Fetch / Refresh button
    const isConnected = !!state.accessToken;
    const fetchBtn = buildBtn(state.pkgs.fetched ? 'Refresh Packages' : 'Fetch Packages', 'pkg');
    fetchBtn.style.marginBottom = '12px';
    fetchBtn.addEventListener('click', fetchPackages);
    if (state.pkgs.loading) fetchBtn.setLoading(true);
    else                    fetchBtn.setDisabled(!isConnected);
    body.appendChild(fetchBtn);

    // List container
    const listWrap = mk('div', {
      background: T.sur,
      border: `1px solid ${T.bdr}`,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      maxHeight: '420px', overflowY: 'auto',
    });
    listWrap.id = UID.pkgList;

    if (state.pkgs.loading) {
      const loadingEl = mk('div', {
        padding: '20px', fontFamily: T.sans, fontSize: '11px',
        color: T.sub, textAlign: 'center',
      });
      loadingEl.textContent = 'Loading offers for your region…';
      listWrap.appendChild(loadingEl);
    } else if (state.pkgs.errorMsg) {
      const errEl = mk('div', {
        padding: '20px', fontFamily: T.sans, fontSize: '11px',
        color: T.err, textAlign: 'center', lineHeight: '1.55',
      });
      errEl.textContent = `Couldn't load offers: ${state.pkgs.errorMsg}`;
      listWrap.appendChild(errEl);
    } else if (!state.pkgs.fetched) {
      const hintEl = mk('div', {
        padding: '24px 16px', fontFamily: T.sans, fontSize: '11px',
        color: T.sub, textAlign: 'center', lineHeight: '1.6',
      });
      hintEl.textContent = isConnected
        ? 'Click "Fetch Packages" above to load discounted offers available for your region.'
        : 'Connect to the game first, then fetch packages to see available offers.';
      listWrap.appendChild(hintEl);
    } else if (!state.pkgs.offers.length) {
      const emptyEl = mk('div', { padding: '20px', fontFamily: T.sans, fontSize: '11px', color: T.sub, textAlign: 'center' });
      emptyEl.textContent = 'No offers found for your region.';
      listWrap.appendChild(emptyEl);
    } else {
      for (let i = 0; i < state.pkgs.offers.length; i++) {
        const row = buildOfferRow(state.pkgs.offers[i]);
        if (i === state.pkgs.offers.length - 1) row.style.borderBottom = 'none';
        listWrap.appendChild(row);
      }
    }

    body.appendChild(listWrap);
  }

  function _syncPkgOpenBtn() {
    const btn = refs.pkgOpenBtn;
    if (!btn) return;
    const open = pkgFloatingMenu && pkgFloatingMenu.style.display !== 'none';
    btn._lbl.textContent  = open ? 'Close Packages Panel' : 'Open Packages Panel';
    btn.style.background  = open ? T.errDim : T.accDim;
    btn.style.borderColor = open ? T.errBdr : T.accBdr;
    btn.style.color       = open ? T.err    : T.acc;
  }

  async function fetchPackages() {
    if (!requireToken()) return;
    if (state.pkgs.loading) return;

    state.pkgs.loading  = true;
    state.pkgs.errorMsg = null;
    _buildPkgFloatingContent();

    try {
      const server = _getRegion();
      const pid = state.profileId ?? 'NotSet';
      const url = `https://payments.mspapis.com/offers//v2/payment-offer/${server}/MovieStarPlanet2/Web/${pid}/NotSet?country=${server}&isvip=False`;
      const res = await sf(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const all  = Array.isArray(data) ? data : (data.Offers ?? []);

      const filtered = all
        .filter(o => o.Content && TARGET_OFFER_IDS.has(String(o.Content.Id)))
        .filter(o => o.Cost && o.Content?.BundledItems)
        .sort((a, b) => a.Cost.Amount - b.Cost.Amount);

      state.pkgs.offers  = filtered;
      state.pkgs.fetched = true;
    } catch (err) {
      state.pkgs.errorMsg = err?.message ?? 'Request failed';
      state.pkgs.offers   = [];
      toast(`Failed to load packages: ${state.pkgs.errorMsg}`, 'error');
    } finally {
      state.pkgs.loading = false;
      _buildPkgFloatingContent();
    }
  }

  function buildOfferRow(offer) {
    const vip = offer.Content.BundledItems?.find(i => i.ItemReference === 'DaysVip');
    const sc  = offer.Content.BundledItems?.find(i => i.ItemReference === 'SoftCurrency');
    const hc  = offer.Content.BundledItems?.find(i => i.ItemReference === 'HardCurrency');
    const crossedOut = ORIGINAL_PRICES[String(offer.Content.Id)];
    const isCheap    = !!crossedOut;

    const row = mk('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px', cursor: 'pointer', boxSizing: 'border-box',
      borderBottom: `1px solid ${T.bdr}`,
      transition: 'background 0.15s',
      background: 'transparent',
    });

    row.addEventListener('mouseenter', () => { row.style.background = T.accDim; });
    row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });

    const left = mk('div', { flex: '1', minWidth: '0', marginRight: '12px' });

    const name = mk('div', {
      fontFamily: T.sans, fontSize: '12px', fontWeight: '500',
      color: T.txt, marginBottom: '5px',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    });
    name.textContent = offer.Content.Name || 'Special Offer';

    const tags = mk('div', { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' });

    if (vip) {
      const vipTag = mk('span', {
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        fontFamily: T.mono, fontSize: '10px', fontWeight: '600', color: T.acc,
      });
      vipTag.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
      const vipText = mk('span');
      vipText.textContent = `${vip.Amount}d VIP`;
      vipTag.appendChild(vipText);
      tags.appendChild(vipTag);
    }

    if (sc) {
      const scTag = mk('span', { fontFamily: T.mono, fontSize: '10px', color: T.sub });
      scTag.textContent = `${(sc.Amount / 1000).toFixed(1).replace('.0', '')}k SC`;
      tags.appendChild(scTag);
    }

    if (hc) {
      const hcTag = mk('span', { fontFamily: T.mono, fontSize: '10px', color: T.sub });
      hcTag.textContent = `${hc.Amount} 💎`;
      tags.appendChild(hcTag);
    }

    left.appendChild(name);
    left.appendChild(tags);

    const right = mk('div', { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: '0' });

    if (crossedOut) {
      const orig = mk('span', {
        fontFamily: T.sans, fontSize: '10px', color: T.muted,
        textDecoration: 'line-through',
      });
      orig.textContent = crossedOut;
      right.appendChild(orig);
    }

    const price = mk('span', {
      fontFamily: T.sans, fontSize: '12px', fontWeight: '600',
      color: isCheap ? T.ok : T.txt,
    });
    price.textContent = offer.Cost.Formatted;

    const arrow = mk('span', {
      display: 'inline-flex', alignItems: 'center', color: T.sub,
      transition: 'color 0.15s',
    });
    arrow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`;
    row.addEventListener('mouseenter', () => { arrow.style.color = T.acc; });
    row.addEventListener('mouseleave', () => { arrow.style.color = T.sub; });

    right.appendChild(price);
    right.appendChild(arrow);

    row.appendChild(left);
    row.appendChild(right);

    row.addEventListener('click', () => openOffer(offer));

    return row;
  }

  function openOffer(offer) {
    const pid      = state.profileId ?? 'NotSet';
    const username = state.profileName ?? '';
    const token    = state.accessToken ?? '';
    const url = `https://payments.mspapis.com/payments/Initialize?offerId=${offer.Id}&profileId=${pid}&actorName=${encodeURIComponent(username)}&accessToken=${encodeURIComponent(token)}&rp=windows-web&ItemsGender=0`;
    window.open(url, '_blank');
  }

  // ─── Unity input isolation ────────────────────────────────────────────────

  let unityInputBlocked = false;
  const unityKeyHandler = e => { if (unityInputBlocked) e.stopImmediatePropagation(); };

  function installUnityKeyBlocker() {
    window.addEventListener('keydown',  unityKeyHandler, true);
    window.addEventListener('keypress', unityKeyHandler, true);
    window.addEventListener('keyup',    unityKeyHandler, true);
  }

  function freezeUnityCanvas() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas._savedTabIndex = canvas.getAttribute('tabindex');
      canvas.setAttribute('tabindex', '-1');
      canvas.blur();
    }
    unityInputBlocked = true;
  }

  function unfreezeUnityCanvas() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      if (canvas._savedTabIndex != null) canvas.setAttribute('tabindex', canvas._savedTabIndex);
      else canvas.removeAttribute('tabindex');
      delete canvas._savedTabIndex;
    }
    unityInputBlocked = false;
  }

