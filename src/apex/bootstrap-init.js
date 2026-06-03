  // ─── Bootstrap ────────────────────────────────────────────────────────────

  function createUI() {
    if (menu) return;
    injectFonts();
    injectKeyframes();
    installUnityKeyBlocker();
    menu = buildMenu();
    (shRoot() ?? document.body).appendChild(menu);
    switchTab('profile');
    updateUI();
    buildAgFloatingMenu();
    // Homes are already populated from _apex_data; this just refreshes the UI.
    _refreshHomesDropdown();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createUI);
  else createUI();

  // No console.log — removed entirely to avoid leaving a fingerprint in the
