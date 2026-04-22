// ================================================================
// FILE: js/api.js
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// ================================================================
// Gestisce tutte le chiamate al backend GAS.
// Usa GET per letture, POST per scritture.
// ================================================================

const API = {

  // Azioni in lettura (GET) — piu' veloci, no preflight CORS
  READ_ACTIONS: new Set([
    'login','getCurrentUser','getLookup','getLookupMulti','getComuni',
    'getDatiComuni','getRegoleLati','getClienti','getCliente',
    'getAlberoCliente','getCantiere','getRilieviCantiere','getRilievo',
    'getPosizioniSerr','getPosizioniPorte','getStratigrafie',
    'calcolaDimensioniTelaio','calcolaReportAccessori','calcolaReportPosa',
    'checkVersionePosa','getLogOre','getDbSerramento','getDbPorte',
    'adminGetLookup','adminGetPosa','adminGetDatiComuni',
    'adminGetRegoleLati','adminGetUtenti'
  ]),

  // ================================================================
  // Chiamata principale al backend
  // ================================================================
  async call(action, data = {}) {
    const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    const payload = token ? { token, ...data } : { ...data };

    try {
      let response;

      if (this.READ_ACTIONS.has(action)) {
        // GET con payload URL-encoded
        const url = `${APP_CONFIG.GAS_URL}?action=${encodeURIComponent(action)}&payload=${encodeURIComponent(JSON.stringify(payload))}`;
        response = await fetch(url, { redirect: 'follow' });
      } else {
        // POST con body JSON
        response = await fetch(APP_CONFIG.GAS_URL, {
          method: 'POST',
          body: JSON.stringify({ action, ...payload }),
          redirect: 'follow'
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Risposta non JSON:', text);
        return { success: false, error: 'Risposta server non valida.' };
      }

    } catch (err) {
      console.error(`API error [${action}]:`, err);
      return { success: false, error: err.message || 'Errore di rete. Verifica la connessione.' };
    }
  },

  // ================================================================
  // Shortcut per azioni comuni
  // ================================================================

  // AUTH
  async login(email, password)    { return this.call('login', { email, password }); },
  async logout()                   { return this.call('logout'); },
  async getUser()                  { return this.call('getCurrentUser'); },

  // LOOKUP
  async getLookup(table)           { return this.call('getLookup', { table }); },
  async getLookupMulti(tables)     { return this.call('getLookupMulti', { tables }); },
  async getComuni(query)           { return this.call('getComuni', { query }); },
  async getDatiComuni()            { return this.call('getDatiComuni'); },
  async getRegoleLati()            { return this.call('getRegoleLati'); },

  // CLIENTI
  async getClienti()               { return this.call('getClienti'); },
  async getCliente(id)             { return this.call('getCliente', { id }); },
  async createCliente(data)        { return this.call('createCliente', { data }); },
  async updateCliente(id, data)    { return this.call('updateCliente', { id, data }); },
  async toggleCliente(id)          { return this.call('toggleStatoCliente', { id }); },

  // CANTIERI
  async getAlbero(idCliente)       { return this.call('getAlberoCliente', { idCliente }); },
  async getCantiere(id)            { return this.call('getCantiere', { id }); },
  async createCantiere(data)       { return this.call('createCantiere', { data }); },
  async updateCantiere(id, data)   { return this.call('updateCantiere', { id, data }); },
  async toggleCantiere(id)         { return this.call('toggleStatoCantiere', { id }); },

  // RILIEVI
  async getRilievi(idCantiere)     { return this.call('getRilieviCantiere', { idCantiere }); },
  async getRilievo(id)             { return this.call('getRilievo', { id }); },
  async createRilievo(data)        { return this.call('createRilievo', { data }); },
  async updateRilievo(id, data)    { return this.call('updateRilievo', { id, data }); },
  async cloneRilievo(id, tipoClone){ return this.call('cloneRilievo', { id, tipoClone }); },
  async deleteRilievo(id)          { return this.call('deleteRilievo', { id }); },

  // STRATIGRAFIE
  async getStratigrafie(idRilievo) { return this.call('getStratigrafie', { idRilievo }); },
  async createStratigrafia(data)   { return this.call('createStratigrafia', { data }); },
  async updateStratigrafia(id, data){ return this.call('updateStratigrafia', { id, data }); },
  async deleteStratigrafia(id)     { return this.call('deleteStratigrafia', { id }); },
  async setDefaultStrat(id, idRilievo){ return this.call('setDefaultStratigrafia', { id, idRilievo }); },

  // POSIZIONI SERRAMENTI
  async getPosizioniSerr(idRilievo){ return this.call('getPosizioniSerr', { idRilievo }); },
  async createPosizioneSerr(data)  { return this.call('createPosizioneSerr', { data }); },
  async updatePosizioneSerr(id, data){ return this.call('updatePosizioneSerr', { id, data }); },
  async copyPosizioneSerr(id, count){ return this.call('copyPosizioneSerr', { id, count }); },
  async deletePosizioneSerr(id)    { return this.call('deletePosizioneSerr', { id }); },

  // POSIZIONI PORTE
  async getPosizioniPorte(idRilievo){ return this.call('getPosizioniPorte', { idRilievo }); },
  async createPosizionePorta(data) { return this.call('createPosizionePorta', { data }); },
  async updatePosizionePorta(id, data){ return this.call('updatePosizionePorta', { id, data }); },
  async copyPosizionePorta(id, count){ return this.call('copyPosizionePorta', { id, count }); },
  async deletePosizionePorta(id)   { return this.call('deletePosizionePorta', { id }); },

  // CALCOLI
  async calcolaDim(posizione)      { return this.call('calcolaDimensioniTelaio', { posizione }); },
  async calcolaAcc(posizione)      { return this.call('calcolaAccessoriPosizione', { posizione }); },
  async reportAccessori(idRilievo) { return this.call('calcolaReportAccessori', { idRilievo }); },
  async reportPosa(idRilievo, tipo){ return this.call('calcolaReportPosa', { idRilievo, tipo }); },

  // ORE POSA
  async aggiornaOre(idRilievo, servizio, delta, note){ return this.call('aggiornaOre', { idRilievo, servizio, delta, note }); },
  async getLogOre(idRilievo)       { return this.call('getLogOre', { idRilievo }); },
  async checkVersionePosa(idRilievo){ return this.call('checkVersionePosa', { idRilievo }); },
  async aggiornaVersionePosa(idRilievo){ return this.call('aggiornaVersionePosa', { idRilievo }); },

  // ADMIN
  async adminGetLookup(table)      { return this.call('adminGetLookup', { table }); },
  async adminAddLookup(table, data){ return this.call('adminAddLookup', { table, data }); },
  async adminUpdateLookup(table, rowId, data){ return this.call('adminUpdateLookup', { table, rowId, data }); },
  async adminToggleLookup(table, id){ return this.call('adminToggleLookup', { table, id }); },
  async adminGetPosa(tipo)         { return this.call('adminGetPosa', { tipo }); },
  async adminUpdatePosa(tipo, id, data){ return this.call('adminUpdatePosa', { tipo, id, data }); },
  async adminNuovaVersionePosa(tipo, note){ return this.call('adminNuovaVersionePosa', { tipo, note }); },
  async adminGetDatiComuni()       { return this.call('adminGetDatiComuni'); },
  async adminUpdateDatiComuni(id, valore){ return this.call('adminUpdateDatiComuni', { id, valore }); },
  async adminGetRegoleLati()       { return this.call('adminGetRegoleLati'); },
  async adminUpdateRegoleLati(sigla, data){ return this.call('adminUpdateRegoleLati', { sigla, data }); },
  async adminGetUtenti()           { return this.call('adminGetUtenti'); },
  async getDbSerramento()          { return this.call('getDbSerramento'); },
  async getDbPorte()               { return this.call('getDbPorte'); }
};
