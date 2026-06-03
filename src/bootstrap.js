(() => {
  try {
    if (window.__axBs) return;
    Object.defineProperty(window, '__axBs', {
      value: true, configurable: false, enumerable: false, writable: false,
    });

    const rnd = crypto.getRandomValues(new Uint8Array(16));
    const KEY = Array.from(rnd, b => b.toString(16).padStart(2, '0')).join('');

    chrome.runtime.sendMessage({ type: 'apex:bootstrap' }, (reply) => {
      void chrome.runtime.lastError;
      if (!reply || !reply.ok) return;

      const envelope = {};
      envelope[KEY] = {
        nonce:     KEY,
        homes:     Array.isArray(reply.homes) ? reply.homes : [],
        questions: (reply.questions && typeof reply.questions === 'object') ? reply.questions : {},
      };

      let tries = 0;
      const fire = () => {
        try { window.postMessage(envelope, window.location.origin); } catch { /* ignore */ }
        if (++tries < 6) setTimeout(fire, 50);
      };
      fire();
    });
  } catch {
  }
})();
