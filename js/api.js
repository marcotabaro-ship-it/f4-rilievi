// ================================================================
// FILE: js/api.js — VERSIONE 2 (fix CORS: solo GET per tutto)
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// ================================================================
// ISTRUZIONI:
//   Nel repository GitHub, cartella js/
//   Clicca su api.js → matita ✏️ → seleziona tutto → incolla
//   → Commit changes
// ================================================================
// NOTA TECNICA:
//   Google Apps Script web app accetta chiamate cross-origin
//   SOLO tramite GET con redirect:follow.
//   Tutte le azioni (lettura E scrittura) vengono inviate
//   come GET con i parametri in URL.
// ================================================================

const API = {

  // ================================================================
  // Chiamata principale — SEMPRE GET, payload in URL
  // ================================================================
  async call(action, data = {}) {
    const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    const payload = token ? { token, ...data } : { ...data };

    const url = APP_CONFIG.GAS_URL
      + '?action=' + encodeURIComponent(action)
      + '&payload=' + encodeURIComponent(JSON.stringify(payload));

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const text = await response.text();

      // Rimuovi eventuale BOM o testo extra
      const clean = text.trim().replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');

      try {
        return JSON.parse(clean);
      } catch (e) {
        console.error('Risposta non JSON:', text.substring(0, 200));
        return { success: false, error: 'Risposta server non valida. Verifica il deployment GAS.' };
      }

    } catch (err) {
      console.error('API error [' + action + ']:', err);
      if (err.message && err.message.includes('Failed to fetch')) {
        return { success: false, error: 'Impossibile contattare il server. Verifica la connessione e il deployment GAS.' };
      }
      return { success: false, error: err.message || 'Errore di rete.' };
    }
  },

  // ================================================================
  // AUTH
  // ================================================================
  async login(email, password) { return this.call('login', { email, password }); },
  async logout()               { return this.call('logout'); },
  async getUser()              { return this.call('getCurrentUser'); },

  // ================================================================
  // LOOKUP
  // ================================================================
  async getLookup(table)       { return this.call('getLookup', { table }); },
  async getLookupMulti(tables) { return this.call('getLookupMulti', { tables }); },
  async getComuni(query)       { return this.call('getComuni', { query }); },
  async getDatiComuni()        { return this.call('getDatiComuni'); },
  async getRegoleLati()        { return this.call('getRegoleLati'); },

  // ================================================================
  // CLIENTI
  // ================================================================
  async getClienti()              { return this.call('getClienti'); },
  async getCliente(id)            { return this.call('getCliente', { id }); },
  async createCliente(data)       { return this.call('createCliente', { data }); },
  async updateCliente(id, data)   { return this.call('updateCliente', { id, data }); },
  async toggleCliente(id)         { return this.call('toggleStatoCliente', { id }); },

  // ================================================================
  // CANTIERI
  // ================================================================
  async getAlbero(idCliente)      { return this.call('getAlberoCliente', { idCliente }); },
  async getCantiere(id)           { return this.call('getCantiere', { id }); },
  async createCantiere(data)      { return this.call('createCantiere', { data }); },
  async updateCantiere(id, data)  { return this.call('updateCantiere', { id, data }); },
  async toggleCantiere(id)        { return this.call('toggleStatoCantiere', { id }); },

  // ================================================================
  // RILIEVI
  // ================================================================
  async getRilievi(idCantiere)    { return this.call('getRilieviCantiere', { idCantiere }); },
  async getRilievo(id)            { return this.call('getRilievo', { id }); },
  async createRilievo(data)       { return this.call('createRilievo', { data }); },
  async updateRilievo(id, data)   { return this.call('updateRilievo', { id, data }); },
  async cloneRilievo(id, tipoClone){ return this.call('cloneRilievo', { id, tipoClone }); },
  async deleteRilievo(id)         { return this.call('deleteRilievo', { id }); },

  // ================================================================
  // STRATIGRAFIE
  // ================================================================
  async getStratigrafie(idRilievo)  { return this.call('getStratigrafie', { idRilievo }); },
  async createStratigrafia(data)    { return this.call('createStratigrafia', { data }); },
  async updateStratigrafia(id, data){ return this.call('updateStratigrafia', { id, data }); },
  async deleteStratigrafia(id)      { return this.call('deleteStratigrafia', { id }); },
  async setDefaultStrat(id, idRilievo){ return this.call('setDefaultStratigrafia', { id, idRilievo }); },

  // ================================================================
  // POSIZIONI SERRAMENTI
  // ================================================================
  async getPosizioniSerr(idRilievo)   { return this.call('getPosizioniSerr', { idRilievo }); },
  async createPosizioneSerr(data)     { return this.call('createPosizioneSerr', { data }); },
  async updatePosizioneSerr(id, data) { return this.call('updatePosizioneSerr', { id, data }); },
  async copyPosizioneSerr(id, count)  { return this.call('copyPosizioneSerr', { id, count }); },
  async deletePosizioneSerr(id)       { return this.call('deletePosizioneSerr', { id }); },

  // ================================================================
  // POSIZIONI PORTE
  // ================================================================
  async getPosizioniPorte(idRilievo)   { return this.call('getPosizioniPorte', { idRilievo }); },
  async createPosizionePorta(data)     { return this.call('createPosizionePorta', { data }); },
  async updatePosizionePorta(id, data) { return this.call('updatePosizionePorta', { id, data }); },
  async copyPosizionePorta(id, count)  { return this.call('copyPosizionePorta', { id, count }); },
  async deletePosizionePorta(id)       { return this.call('deletePosizionePorta', { id }); },

  // ================================================================
  // CALCOLI
  // ================================================================
  async calcolaDim(posizione)       { return this.call('calcolaDimensioniTelaio', { posizione }); },
  async calcolaAcc(posizione)       { return this.call('calcolaAccessoriPosizione', { posizione }); },
  async reportAccessori(idRilievo)  { return this.call('calcolaReportAccessori', { idRilievo }); },
  async reportPosa(idRilievo, tipo) { return this.call('calcolaReportPosa', { idRilievo, tipo }); },

  // ================================================================
  // ORE POSA
  // ================================================================
  async aggiornaOre(idRilievo, servizio, delta, note){ return this.call('aggiornaOre', { idRilievo, servizio, delta, note }); },
  async getLogOre(idRilievo)        { return this.call('getLogOre', { idRilievo }); },
  async checkVersionePosa(idRilievo){ return this.call('checkVersionePosa', { idRilievo }); },
  async aggiornaVersionePosa(idRilievo){ return this.call('aggiornaVersionePosa', { idRilievo }); },

  // ================================================================
  // ADMIN
  // ================================================================
  async adminGetLookup(table)           { return this.call('adminGetLookup', { table }); },
  async adminAddLookup(table, data)     { return this.call('adminAddLookup', { table, data }); },
  async adminUpdateLookup(table, rowId, data){ return this.call('adminUpdateLookup', { table, rowId, data }); },
  async adminToggleLookup(table, id)    { return this.call('adminToggleLookup', { table, id }); },
  async adminGetPosa(tipo)              { return this.call('adminGetPosa', { tipo }); },
  async adminUpdatePosa(tipo, id, data) { return this.call('adminUpdatePosa', { tipo, id, data }); },
  async adminNuovaVersionePosa(tipo, note){ return this.call('adminNuovaVersionePosa', { tipo, note }); },
  async adminGetDatiComuni()            { return this.call('adminGetDatiComuni'); },
  async adminUpdateDatiComuni(id, valore){ return this.call('adminUpdateDatiComuni', { id, valore }); },
  async adminGetRegoleLati()            { return this.call('adminGetRegoleLati'); },
  async adminUpdateRegoleLati(sigla, data){ return this.call('adminUpdateRegoleLati', { sigla, data }); },
  async adminGetUtenti()                { return this.call('adminGetUtenti'); },
  async getDbSerramento()               { return this.call('getDbSerramento'); },
  async getDbPorte()                    { return this.call('getDbPorte'); }
};
