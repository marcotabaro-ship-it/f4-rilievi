// ================================================================
// FILE: js/auth.js
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// ================================================================
// Gestione sessione utente lato client.
// Includi in OGNI pagina (dopo config.js e api.js).
// ================================================================

const Auth = {

  // Restituisce il token salvato (null se non loggato)
  getToken() {
    return localStorage.getItem(APP_CONFIG.TOKEN_KEY);
  },

  // Restituisce i dati utente salvati (null se non loggato)
  getUser() {
    const raw = localStorage.getItem(APP_CONFIG.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  },

  // Salva token e dati utente dopo il login
  saveSession(token, user) {
    localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
  },

  // Cancella sessione e va al login
  logout() {
    const token = this.getToken();
    if (token) API.logout().catch(() => {});
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    window.location.href = 'index.html';
  },

  // Verifica che l'utente sia loggato — se no, redirect al login
  // Da chiamare all'inizio di ogni pagina protetta
  requireLogin() {
    const token = this.getToken();
    const user  = this.getUser();
    if (!token || !user) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  },

  // Verifica che l'utente abbia un ruolo specifico
  hasRole(ruolo) {
    const user = this.getUser();
    return user && user.ruolo === ruolo;
  },

  // Verifica che l'utente possa vedere tutti i rilievi
  canViewAll() {
    const user = this.getUser();
    return user && APP_CONFIG.RUOLI_ACCESSO_TOTALE.includes(user.ruolo);
  },

  // Verifica che l'utente possa modificare le ore
  canModificaOre() {
    const user = this.getUser();
    return user && APP_CONFIG.RUOLI_MODIFICA_ORE.includes(user.ruolo);
  },

  // Verifica che l'utente sia admin
  isAdmin() {
    return this.hasRole('administrator');
  },

  // Popola gli elementi UI con i dati utente (nome, ruolo)
  populateUserUI() {
    const user = this.getUser();
    if (!user) return;
    document.querySelectorAll('[data-user-nome]').forEach(el => {
      el.textContent = user.nome || user.email;
    });
    document.querySelectorAll('[data-user-ruolo]').forEach(el => {
      el.textContent = user.reparto || user.ruolo;
    });
    document.querySelectorAll('[data-user-sigla]').forEach(el => {
      el.textContent = user.sigla || '?';
    });
    // Mostra/nascondi elementi admin
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = this.isAdmin() ? '' : 'none';
    });
    // Mostra/nascondi elementi solo per chi vede tutto
    document.querySelectorAll('[data-view-all-only]').forEach(el => {
      el.style.display = this.canViewAll() ? '' : 'none';
    });
  }
};
