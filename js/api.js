// ================================================================
// FILE: api.js v3
// PROGETTO: F4 Rilievi — GitHub Pages frontend
// NOVITA': cache sessionStorage per dati statici + getInitData
// ================================================================

const API = (() => {

  const BASE_URL = 'https://script.google.com/macros/s/AKfycbxZAQn_4lpl_jaFUG4yJOQ8F0uDVZZAHV25XHRfS9avhwNBeFljX6eFU1Twn-fzLo7qCg/exec';
  const CACHE_KEY = 'f4r_static_v1';
  const CACHE_TTL = 30 * 60 * 1000; // 30 minuti

  // ── CACHE ────────────────────────────────────────────────────
  function cacheGet() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
      return obj.data;
    } catch(e) { return null; }
  }

  function cacheSet(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); } catch(e) {}
  }

  function cacheClear() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch(e) {}
  }

  // ── HTTP GET ─────────────────────────────────────────────────
  async function get(params) {
    var qs = Object.entries(params).map(function(e) {
      return encodeURIComponent(e[0]) + '=' + encodeURIComponent(e[1]);
    }).join('&');
    var url = BASE_URL + '?' + qs;
    try {
      var res = await fetch(url, { method:'GET', redirect:'follow' });
      var text = await res.text();
      return JSON.parse(text);
    } catch(e) {
      return { success: false, error: 'Errore rete: ' + e.message };
    }
  }

  // ── TOKEN ─────────────────────────────────────────────────────
  function getToken() { return localStorage.getItem('f4r_token') || ''; }

  function withAuth(params) { return Object.assign({ token: getToken() }, params); }

  // ── INIT DATA (nuova chiamata unica) ─────────────────────────
  // Carica TUTTO in una sola richiesta GAS.
  // I dati statici vengono memorizzati in sessionStorage per 30 min.
  // idRilievo è opzionale — se passato include anche i dati del rilievo.
  async function getInitData(idRilievo) {
    // 1. Controlla cache per dati statici
    var cached = cacheGet();

    // 2. Se non in cache, chiama GAS
    if (!cached) {
      var params = withAuth({ action: 'getInitData' });
      if (idRilievo) params.idRilievo = idRilievo;
      var res = await get(params);
      if (!res.success) return res;
      // Salva in cache solo i dati statici (lookup, db, costanti)
      var staticData = {
        lookups:      res.data.lookups      || {},
        datiComuni:   res.data.datiComuni   || [],
        regoleLati:   res.data.regoleLati   || [],
        dbSerramento: res.data.dbSerramento || [],
        dbPorte:      res.data.dbPorte      || []
      };
      cacheSet(staticData);
      return { success: true, data: res.data };
    }

    // 3. Cache valida: integra con dati dinamici del rilievo specifico
    if (idRilievo) {
      var res2 = await get(withAuth({ action: 'getRilievo', idRilievo: idRilievo }));
      return {
        success: true,
        data: Object.assign({}, cached, {
          rilievo:      res2.success ? res2.data : null,
          rilievoError: res2.success ? null : res2.error
        })
      };
    }

    return { success: true, data: cached };
  }

  // ── SINGOLI ENDPOINT (fallback e chiamate specifiche) ─────────

  async function getRilievo(id) { return get(withAuth({ action:'getRilievo', idRilievo:id })); }
  async function updateRilievo(id, data) { return get(withAuth(Object.assign({ action:'updateRilievo', idRilievo:id }, data))); }
  async function cloneRilievo(id, tipo) { return get(withAuth({ action:'cloneRilievo', idRilievo:id, tipo:tipo })); }

  async function getLookup(table) { return get(withAuth({ action:'getLookup', table:table })); }
  async function getLookupMulti(tables) { return get(withAuth({ action:'getLookupMulti', tables:tables.join(',') })); }

  async function getDatiComuni() { return get(withAuth({ action:'getDatiComuni' })); }
  async function getRegoleLati() { return get(withAuth({ action:'getRegoleLati' })); }
  async function getDbSerramento() { return get(withAuth({ action:'getDbSerramento' })); }
  async function getDbPorte() { return get(withAuth({ action:'getDbPorte' })); }

  // Posizioni serramenti
  async function getPosizioniSerr(idRilievo) { return get(withAuth({ action:'getPosizioniSerr', idRilievo:idRilievo })); }
  async function createPosizioneSerr(data) { return get(withAuth(Object.assign({ action:'createPosizioneSerr' }, data))); }
  async function updatePosizioneSerr(id, data) { return get(withAuth(Object.assign({ action:'updatePosizioneSerr', idPos:id }, data))); }
  async function deletePosizioneSerr(id) { return get(withAuth({ action:'deletePosizioneSerr', idPos:id })); }
  async function copyPosizioneSerr(id, n) { return get(withAuth({ action:'copyPosizioneSerr', idPos:id, n:n })); }

  // Posizioni porte
  async function getPosizioniPorte(idRilievo) { return get(withAuth({ action:'getPosizioniPorte', idRilievo:idRilievo })); }
  async function createPosizionePorte(data) { return get(withAuth(Object.assign({ action:'createPosizionePorte' }, data))); }
  async function updatePosizionePorte(id, data) { return get(withAuth(Object.assign({ action:'updatePosizionePorte', idPos:id }, data))); }
  async function deletePosizionePorte(id) { return get(withAuth({ action:'deletePosizionePorte', idPos:id })); }
  async function copyPosizionePorte(id, n) { return get(withAuth({ action:'copyPosizionePorte', idPos:id, n:n })); }

  // Stratigrafie
  async function getStratigrafie(idRilievo) { return get(withAuth({ action:'getStratigrafie', idRilievo:idRilievo })); }
  async function createStratigrafia(data) { return get(withAuth(Object.assign({ action:'createStratigrafia' }, data))); }
  async function updateStratigrafia(id, data) { return get(withAuth(Object.assign({ action:'updateStratigrafia', idStrat:id }, data))); }
  async function deleteStratigrafia(id) { return get(withAuth({ action:'deleteStratigrafia', idStrat:id })); }
  async function setDefaultStrat(id, idRilievo) { return get(withAuth({ action:'setDefaultStrat', idStrat:id, idRilievo:idRilievo })); }

  // Clienti
  async function getClienti() { return get(withAuth({ action:'getClienti' })); }
  async function createCliente(data) { return get(withAuth(Object.assign({ action:'createCliente' }, data))); }
  async function updateCliente(id, data) { return get(withAuth(Object.assign({ action:'updateCliente', idCliente:id }, data))); }
  async function deleteCliente(id) { return get(withAuth({ action:'deleteCliente', idCliente:id })); }

  // Cantieri
  async function getCantieri(idCliente) { return get(withAuth({ action:'getCantieri', idCliente:idCliente })); }
  async function createCantiere(data) { return get(withAuth(Object.assign({ action:'createCantiere' }, data))); }
  async function updateCantiere(id, data) { return get(withAuth(Object.assign({ action:'updateCantiere', idCantiere:id }, data))); }
  async function deleteCantiere(id) { return get(withAuth({ action:'deleteCantiere', idCantiere:id })); }
  async function getRilievi(idCantiere) { return get(withAuth({ action:'getRilievi', idCantiere:idCantiere })); }
  async function createRilievo(data) { return get(withAuth(Object.assign({ action:'createRilievo' }, data))); }
  async function deleteRilievo(id) { return get(withAuth({ action:'deleteRilievo', idRilievo:id })); }

  // Posa
  async function checkVersionePosa(idRilievo) { return get(withAuth({ action:'checkVersionePosa', idRilievo:idRilievo })); }
  async function aggiornaVersionePosa(idRilievo) { return get(withAuth({ action:'aggiornaVersionePosa', idRilievo:idRilievo })); }

  // Auth
  async function login(username, password) {
    cacheClear(); // reset cache al login
    return get({ action:'login', username:username, password:password });
  }
  async function logout() {
    cacheClear();
    return get(withAuth({ action:'logout' }));
  }
  async function checkAuth() { return get(withAuth({ action:'checkAuth' })); }

  // Dashboard
  async function getDashboard() { return get(withAuth({ action:'getDashboard' })); }

  // Admin
  async function getUtenti() { return get(withAuth({ action:'getUtenti' })); }
  async function createUtente(data) { return get(withAuth(Object.assign({ action:'createUtente' }, data))); }
  async function updateUtente(id, data) { return get(withAuth(Object.assign({ action:'updateUtente', idUtente:id }, data))); }

  // Utilità cache (esporta per permettere invalidazione manuale)
  function invalidaCache() { cacheClear(); }

  // ── EXPORT ───────────────────────────────────────────────────
  return {
    getInitData,
    getRilievo, updateRilievo, cloneRilievo,
    getLookup, getLookupMulti,
    getDatiComuni, getRegoleLati, getDbSerramento, getDbPorte,
    getPosizioniSerr, createPosizioneSerr, updatePosizioneSerr, deletePosizioneSerr, copyPosizioneSerr,
    getPosizioniPorte, createPosizionePorte, updatePosizionePorte, deletePosizionePorte, copyPosizionePorte,
    getStratigrafie, createStratigrafia, updateStratigrafia, deleteStratigrafia, setDefaultStrat,
    getClienti, createCliente, updateCliente, deleteCliente,
    getCantieri, createCantiere, updateCantiere, deleteCantiere,
    getRilievi, createRilievo, deleteRilievo,
    checkVersionePosa, aggiornaVersionePosa,
    login, logout, checkAuth,
    getDashboard,
    getUtenti, createUtente, updateUtente,
    invalidaCache
  };
})();
