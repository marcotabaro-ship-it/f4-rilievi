// ================================================================
// FILE: js/api.js
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// VERSIONE: 2.1 (fix login params diretti)
// ================================================================
// ISTRUZIONI GITHUB:
//   Repository f4-rilievi → cartella js/ → file api.js
//   Clicca matita ✏️ → Ctrl+A → Cancella → Incolla → Commit
//   Messaggio commit: "fix: api.js v2.1 login params diretti"
// ================================================================

const API = {

  // ================================================================
  // LOGIN — params diretti nell'URL (non JSON annidato)
  // Chiamato sia da API.login() diretto che da API.call('login',...)
  // ================================================================
  async login(email, password) {
    const url = APP_CONFIG.GAS_URL
      + '?action=login'
      + '&email=' + encodeURIComponent((email || '').trim())
      + '&password=' + encodeURIComponent(password || '');

    console.log('[API] login url:', url.replace(encodeURIComponent(password || ''), '***'));

    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      const text = await response.text();
      console.log('[API] login raw response:', text.substring(0, 200));
      const clean = text.trim().replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      return JSON.parse(clean);
    } catch (err) {
      console.error('[API] login error:', err);
      if (err.message && err.message.includes('Failed to fetch')) {
        return { success: false, error: 'Impossibile contattare il server. Verifica la connessione.' };
      }
      return { success: false, error: 'Errore di rete: ' + err.message };
    }
  },

  // ================================================================
  // CHIAMATA GENERICA — gestisce anche 'login' per retrocompatibilita
  // ================================================================
  async call(action, data) {
    data = data || {};

    // Login viene sempre inviato con params diretti
    if (action === 'login') {
      return this.login(data.email, data.password);
    }

    const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    const payload = token ? Object.assign({ token: token }, data) : Object.assign({}, data);

    const url = APP_CONFIG.GAS_URL
      + '?action=' + encodeURIComponent(action)
      + '&payload=' + encodeURIComponent(JSON.stringify(payload));

    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const text = await response.text();
      const clean = text.trim().replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');

      try {
        return JSON.parse(clean);
      } catch (e) {
        console.error('[API] risposta non JSON [' + action + ']:', text.substring(0, 300));
        return { success: false, error: 'Risposta server non valida. Verifica il deployment GAS.' };
      }

    } catch (err) {
      console.error('[API] error [' + action + ']:', err);
      if (err.message && err.message.includes('Failed to fetch')) {
        return { success: false, error: 'Impossibile contattare il server. Verifica la connessione e il deployment GAS.' };
      }
      return { success: false, error: err.message };
    }
  }

};
