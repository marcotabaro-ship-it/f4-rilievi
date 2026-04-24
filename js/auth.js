// ================================================================
// FILE: js/auth.js
// PROGETTO: F4 Rilievi — Frontend GitHub Pages
// VERSIONE: 2.0 (Supabase Auth)
// ================================================================
// Gestione sessione utente con Supabase Auth.
// Interfaccia IDENTICA alla v1 per compatibilita con i file HTML.
// Includi in ogni pagina DOPO config.js e api.js.
// ================================================================

const Auth = {

  // ================================================================
  // TOKEN / SESSIONE
  // ================================================================

  getToken() {
    return localStorage.getItem(APP_CONFIG.TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(APP_CONFIG.REFRESH_KEY);
  },

  // Salva sessione dopo login (chiamato da API.login)
  saveSession(accessToken, refreshToken, user) {
    localStorage.setItem(APP_CONFIG.TOKEN_KEY,   accessToken);
    localStorage.setItem(APP_CONFIG.REFRESH_KEY, refreshToken);
    localStorage.setItem(APP_CONFIG.USER_KEY,    JSON.stringify(user));
  },

  // Restituisce il profilo utente dalla cache localStorage
  getUser() {
    const raw = localStorage.getItem(APP_CONFIG.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  },

  // ================================================================
  // REFRESH TOKEN
  // Chiamato da api.js quando riceve 401 Unauthorized.
  // ================================================================
  async _refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(
        APP_CONFIG.SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token',
        {
          method:  'POST',
          headers: {
            'apikey':       APP_CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        }
      );
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.access_token) return false;
      localStorage.setItem(APP_CONFIG.TOKEN_KEY,   data.access_token);
      localStorage.setItem(APP_CONFIG.REFRESH_KEY, data.refresh_token || refreshToken);
      return true;
    } catch(e) {
      return false;
    }
  },

  // ================================================================
  // GUARD — da chiamare in cima ad ogni pagina protetta.
  // Sincrono: controlla localStorage.
  // ================================================================
  requireLogin() {
    const token = this.getToken();
    const user  = this.getUser();
    if (!token || !user) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  },

  // ================================================================
  // LOGOUT
  // ================================================================
  async logout() {
    const token = this.getToken();
    // Revoca il token su Supabase (best-effort, non blocca se fallisce)
    if (token) {
      fetch(APP_CONFIG.SUPABASE_URL + '/auth/v1/logout', {
        method:  'POST',
        headers: {
          'apikey':        APP_CONFIG.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + token,
          'Content-Type':  'application/json'
        }
      }).catch(() => {});
    }
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.REFRESH_KEY);
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    window.location.href = 'index.html';
  },

  // ================================================================
  // RUOLI / PERMESSI
  // ================================================================

  hasRole(ruolo) {
    const user = this.getUser();
    return user && user.ruolo === ruolo;
  },

  isAdmin() {
    return this.hasRole('administrator');
  },

  canViewAll() {
    const user = this.getUser();
    return user && APP_CONFIG.RUOLI_ACCESSO_TOTALE.includes(user.ruolo);
  },

  canModificaOre() {
    const user = this.getUser();
    return user && APP_CONFIG.RUOLI_MODIFICA_ORE.includes(user.ruolo);
  },

  canCreaRilievo() {
    const user = this.getUser();
    return user && APP_CONFIG.RUOLI_CREA_RILIEVO.includes(user.ruolo);
  },

  // ================================================================
  // UI — Popola elementi HTML con i dati utente
  // ================================================================
  populateUserUI() {
    const user = this.getUser();
    if (!user) return;

    document.querySelectorAll('[data-user-nome]').forEach(el => {
      el.textContent = user.nome || user.email || '';
    });
    document.querySelectorAll('[data-user-ruolo]').forEach(el => {
      el.textContent = user.reparto || user.ruolo || '';
    });
    document.querySelectorAll('[data-user-sigla]').forEach(el => {
      el.textContent = user.sigla || '?';
    });
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = this.isAdmin() ? '' : 'none';
    });
    document.querySelectorAll('[data-view-all-only]').forEach(el => {
      el.style.display = this.canViewAll() ? '' : 'none';
    });
  }
};
