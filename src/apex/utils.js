  // ─── Utilities ────────────────────────────────────────────────────────────

  // Always use the captured native reference so we're never routed through our
  // own hook (avoids infinite loops and is undetectable).
  const sf   = (url, opts) => _nativeFetch.call(window, url, opts);
  const wait = (lo, hi) => new Promise(r => setTimeout(r, (lo + Math.random() * (hi - lo)) * 1000));
  // Speed-scaled wait — multiplies the interval by the per-feature speed multiplier.
  const waitSp = (opKey, lo, hi) => { const m = _speedMult(opKey); return wait(lo * m, hi * m); };

  function _addTraceLog(endpoint) {
    if (!endpoint || traceLogs.includes(endpoint)) return;
    traceLogs.push(endpoint);
    _refreshTraceLogList();
  }

  function _refreshTraceLogList() {
    const list = refs.traceLogList;
    if (!list) return;
    list.innerHTML = '';
    if (refs.traceLogCount) refs.traceLogCount.textContent = String(traceLogs.length);
    if (traceLogs.length === 0) {
      const empty = mk('div', { fontFamily: T.mono, fontSize: '10px', color: T.muted, padding: '4px 0' });
      empty.textContent = 'No detected requests yet.';
      list.appendChild(empty);
    } else {
      for (let i = 0; i < traceLogs.length; i++) {
        const row = mk('div', {
          fontFamily: T.mono, fontSize: '10px', color: T.err,
          padding: '4px 0', lineHeight: '1.5', wordBreak: 'break-all',
          borderBottom: i < traceLogs.length - 1 ? `1px solid ${T.bdrSub}` : 'none',
        });
        row.textContent = traceLogs[i];
        list.appendChild(row);
      }
    }
  }

