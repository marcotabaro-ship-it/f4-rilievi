// ================================================================
// FILE: api.js v3 — fix login + cache sicura
// ================================================================

var API = (function() {

  var BASE_URL = 'https://script.google.com/macros/s/AKfycbxZAQn_4lpl_jaFUG4yJOQ8F0uDVZZAHV25XHRfS9avhwNBeFljX6eFU1Twn-fzLo7qCg/exec';
  var CACHE_KEY = 'f4r_static_v1';
  var CACHE_TTL = 30 * 60 * 1000; // 30 min

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
  function get(params) {
    var parts = [];
    Object.keys(params).forEach(function(k) {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    });
    var url = BASE_URL + '?' + parts.join('&');
    return fetch(url, { method: 'GET', redirect: 'follow' })
      .then(function(res) { return res.text(); })
      .then(function(text) { return JSON.parse(text); })
      .catch(function(e) { return { success: false, error: 'Errore rete: ' + e.message }; });
  }

  function getToken() { return localStorage.getItem('f4r_token') || ''; }

  function withAuth(params) {
    var p = { token: getToken() };
    Object.keys(params).forEach(function(k) { p[k] = params[k]; });
    return p;
  }

  // ── INIT DATA (singola chiamata, cache 30 min) ────────────────
  function getInitData(idRilievo) {
    var cached = cacheGet();
    if (!cached) {
      // Prima volta: chiama GAS con tutto
      var params = withAuth({ action: 'getInitData' });
      if (idRilievo) params.idRilievo = idRilievo;
      return get(params).then(function(res) {
        if (!res.success) return res;
        var staticData = {
          lookups:      res.data.lookups      || {},
          datiComuni:   res.data.datiComuni   || [],
          regoleLati:   res.data.regoleLati   || [],
          dbSerramento: res.data.dbSerramento || [],
          dbPorte:      res.data.dbPorte      || []
        };
        cacheSet(staticData);
        return { success: true, data: res.data };
      });
    }
    // Cache valida: solo il rilievo specifico
    if (idRilievo) {
      return get(withAuth({ action: 'getRilievo', idRilievo: idRilievo })).then(function(res2) {
        var data = {};
        Object.keys(cached).forEach(function(k) { data[k] = cached[k]; });
        data.rilievo = res2.success ? res2.data : null;
        data.rilievoError = res2.success ? null : res2.error;
        return { success: true, data: data };
      });
    }
    return Promise.resolve({ success: true, data: cached });
  }

  // ── METODI INDIVIDUALI ────────────────────────────────────────
  function login(username, password) {
    cacheClear();
    return get({ action: 'login', username: username, password: password });
  }
  function logout() { cacheClear(); return get(withAuth({ action: 'logout' })); }
  function checkAuth() { return get(withAuth({ action: 'checkAuth' })); }

  function getRilievo(id) { return get(withAuth({ action: 'getRilievo', idRilievo: id })); }
  function updateRilievo(id, data) {
    var p = withAuth({ action: 'updateRilievo', idRilievo: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function cloneRilievo(id, tipo) { return get(withAuth({ action: 'cloneRilievo', idRilievo: id, tipo: tipo })); }

  function getLookup(table) { return get(withAuth({ action: 'getLookup', table: table })); }
  function getLookupMulti(tables) { return get(withAuth({ action: 'getLookupMulti', tables: tables.join(',') })); }
  function getDatiComuni() { return get(withAuth({ action: 'getDatiComuni' })); }
  function getRegoleLati() { return get(withAuth({ action: 'getRegoleLati' })); }
  function getDbSerramento() { return get(withAuth({ action: 'getDbSerramento' })); }
  function getDbPorte() { return get(withAuth({ action: 'getDbPorte' })); }

  function getPosizioniSerr(idR) { return get(withAuth({ action: 'getPosizioniSerr', idRilievo: idR })); }
  function createPosizioneSerr(data) {
    var p = withAuth({ action: 'createPosizioneSerr' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function updatePosizioneSerr(id, data) {
    var p = withAuth({ action: 'updatePosizioneSerr', idPos: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function deletePosizioneSerr(id) { return get(withAuth({ action: 'deletePosizioneSerr', idPos: id })); }
  function copyPosizioneSerr(id, n) { return get(withAuth({ action: 'copyPosizioneSerr', idPos: id, n: n })); }

  function getPosizioniPorte(idR) { return get(withAuth({ action: 'getPosizioniPorte', idRilievo: idR })); }
  function createPosizionePorte(data) {
    var p = withAuth({ action: 'createPosizionePorte' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function updatePosizionePorte(id, data) {
    var p = withAuth({ action: 'updatePosizionePorte', idPos: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function deletePosizionePorte(id) { return get(withAuth({ action: 'deletePosizionePorte', idPos: id })); }
  function copyPosizionePorte(id, n) { return get(withAuth({ action: 'copyPosizionePorte', idPos: id, n: n })); }

  function getStratigrafie(idR) { return get(withAuth({ action: 'getStratigrafie', idRilievo: idR })); }
  function createStratigrafia(data) {
    var p = withAuth({ action: 'createStratigrafia' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function updateStratigrafia(id, data) {
    var p = withAuth({ action: 'updateStratigrafia', idStrat: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function deleteStratigrafia(id) { return get(withAuth({ action: 'deleteStratigrafia', idStrat: id })); }
  function setDefaultStrat(id, idR) { return get(withAuth({ action: 'setDefaultStrat', idStrat: id, idRilievo: idR })); }

  function getClienti() { return get(withAuth({ action: 'getClienti' })); }
  function createCliente(data) {
    var p = withAuth({ action: 'createCliente' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function updateCliente(id, data) {
    var p = withAuth({ action: 'updateCliente', idCliente: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function deleteCliente(id) { return get(withAuth({ action: 'deleteCliente', idCliente: id })); }

  function getCantieri(idC) { return get(withAuth({ action: 'getCantieri', idCliente: idC })); }
  function createCantiere(data) {
    var p = withAuth({ action: 'createCantiere' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function updateCantiere(id, data) {
    var p = withAuth({ action: 'updateCantiere', idCantiere: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function deleteCantiere(id) { return get(withAuth({ action: 'deleteCantiere', idCantiere: id })); }
  function getRilievi(idC) { return get(withAuth({ action: 'getRilievi', idCantiere: idC })); }
  function createRilievo(data) {
    var p = withAuth({ action: 'createRilievo' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function deleteRilievo(id) { return get(withAuth({ action: 'deleteRilievo', idRilievo: id })); }

  function checkVersionePosa(idR) { return get(withAuth({ action: 'checkVersionePosa', idRilievo: idR })); }
  function aggiornaVersionePosa(idR) { return get(withAuth({ action: 'aggiornaVersionePosa', idRilievo: idR })); }
  function getDashboard() { return get(withAuth({ action: 'getDashboard' })); }
  function getUtenti() { return get(withAuth({ action: 'getUtenti' })); }
  function createUtente(data) {
    var p = withAuth({ action: 'createUtente' });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function updateUtente(id, data) {
    var p = withAuth({ action: 'updateUtente', idUtente: id });
    Object.keys(data).forEach(function(k) { p[k] = data[k]; });
    return get(p);
  }
  function invalidaCache() { cacheClear(); }

  // ── EXPORT ───────────────────────────────────────────────────
  return {
    getInitData: getInitData,
    login: login, logout: logout, checkAuth: checkAuth,
    getRilievo: getRilievo, updateRilievo: updateRilievo, cloneRilievo: cloneRilievo,
    getLookup: getLookup, getLookupMulti: getLookupMulti,
    getDatiComuni: getDatiComuni, getRegoleLati: getRegoleLati,
    getDbSerramento: getDbSerramento, getDbPorte: getDbPorte,
    getPosizioniSerr: getPosizioniSerr, createPosizioneSerr: createPosizioneSerr,
    updatePosizioneSerr: updatePosizioneSerr, deletePosizioneSerr: deletePosizioneSerr,
    copyPosizioneSerr: copyPosizioneSerr,
    getPosizioniPorte: getPosizioniPorte, createPosizionePorte: createPosizionePorte,
    updatePosizionePorte: updatePosizionePorte, deletePosizionePorte: deletePosizionePorte,
    copyPosizionePorte: copyPosizionePorte,
    getStratigrafie: getStratigrafie, createStratigrafia: createStratigrafia,
    updateStratigrafia: updateStratigrafia, deleteStratigrafia: deleteStratigrafia,
    setDefaultStrat: setDefaultStrat,
    getClienti: getClienti, createCliente: createCliente,
    updateCliente: updateCliente, deleteCliente: deleteCliente,
    getCantieri: getCantieri, createCantiere: createCantiere,
    updateCantiere: updateCantiere, deleteCantiere: deleteCantiere,
    getRilievi: getRilievi, createRilievo: createRilievo, deleteRilievo: deleteRilievo,
    checkVersionePosa: checkVersionePosa, aggiornaVersionePosa: aggiornaVersionePosa,
    getDashboard: getDashboard,
    getUtenti: getUtenti, createUtente: createUtente, updateUtente: updateUtente,
    invalidaCache: invalidaCache
  };

})();
