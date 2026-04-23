// ================================================================
// FILE: js/api.js
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// VERSIONE: 2.2 (completo, tutti i metodi shorthand)
// ================================================================
// ISTRUZIONI GITHUB:
//   Repository f4-rilievi → js/ → api.js
//   Matita ✏️ → Ctrl+A → Cancella → Incolla → Commit
//   Messaggio: "fix: api.js v2.2 tutti i metodi shorthand"
// ================================================================

const API = {

  // ----------------------------------------------------------------
  // CORE: LOGIN — params diretti nell'URL
  // ----------------------------------------------------------------
  async login(email, password) {
    const url = APP_CONFIG.GAS_URL
      + '?action=login'
      + '&email='    + encodeURIComponent((email    || '').trim())
      + '&password=' + encodeURIComponent(password  || '');
    try {
      const res   = await fetch(url, { method: 'GET', redirect: 'follow' });
      const text  = await res.text();
      const clean = text.trim().replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      return JSON.parse(clean);
    } catch (err) {
      if (err.message && err.message.includes('Failed to fetch'))
        return { success: false, error: 'Impossibile contattare il server.' };
      return { success: false, error: err.message };
    }
  },

  // ----------------------------------------------------------------
  // CORE: CHIAMATA GENERICA
  // ----------------------------------------------------------------
  async call(action, data) {
    data = data || {};
    if (action === 'login') return this.login(data.email, data.password);

    const token   = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    const payload = token ? Object.assign({ token: token }, data) : Object.assign({}, data);
    const url = APP_CONFIG.GAS_URL
      + '?action='  + encodeURIComponent(action)
      + '&payload=' + encodeURIComponent(JSON.stringify(payload));

    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text  = await res.text();
      const clean = text.trim().replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      try { return JSON.parse(clean); }
      catch (e) {
        console.error('[API] non-JSON [' + action + ']:', text.substring(0, 200));
        return { success: false, error: 'Risposta server non valida.' };
      }
    } catch (err) {
      console.error('[API] error [' + action + ']:', err);
      if (err.message && err.message.includes('Failed to fetch'))
        return { success: false, error: 'Impossibile contattare il server.' };
      return { success: false, error: err.message };
    }
  },

  // ----------------------------------------------------------------
  // SESSIONE
  // ----------------------------------------------------------------
  async getCurrentUser()       { return this.call('getCurrentUser'); },
  async logout()               { return this.call('logout'); },

  // ----------------------------------------------------------------
  // LOOKUP / TABELLE DI RIFERIMENTO
  // ----------------------------------------------------------------
  async getLookup(table)       { return this.call('getLookup',      { table }); },
  async getLookupMulti(tables) { return this.call('getLookupMulti', { tables }); },
  async getComuni(query)       { return this.call('getComuni',      { query }); },
  async getDatiComuni()        { return this.call('getDatiComuni'); },
  async getRegoleLati()        { return this.call('getRegoleLati'); },
  async getInitData(idRilievo) { return this.call('getInitData',    { idRilievo: idRilievo || '' }); },

  // ----------------------------------------------------------------
  // CLIENTI
  // ----------------------------------------------------------------
  async getClienti()                     { return this.call('getClienti'); },
  async getCliente(id)                   { return this.call('getCliente',       { id }); },
  async createCliente(data)              { return this.call('createCliente',    { data }); },
  async updateCliente(id, data)          { return this.call('updateCliente',    { id, data }); },
  async toggleStatoCliente(id)           { return this.call('toggleStatoCliente', { id }); },
  async getAlberoCliente(idCliente)      { return this.call('getAlberoCliente', { idCliente }); },

  // ----------------------------------------------------------------
  // CANTIERI
  // ----------------------------------------------------------------
  async getCantiere(id)                  { return this.call('getCantiere',         { id }); },
  async createCantiere(data)             { return this.call('createCantiere',      { data }); },
  async updateCantiere(id, data)         { return this.call('updateCantiere',      { id, data }); },
  async toggleStatoCantiere(id)          { return this.call('toggleStatoCantiere', { id }); },

  // ----------------------------------------------------------------
  // RILIEVI
  // ----------------------------------------------------------------
  async getRilieviCantiere(idCantiere)   { return this.call('getRilieviCantiere',  { idCantiere }); },
  async getRilievo(id)                   { return this.call('getRilievo',           { id }); },
  async createRilievo(data)              { return this.call('createRilievo',        { data }); },
  async updateRilievo(id, data)          { return this.call('updateRilievo',        { id, data }); },
  async cloneRilievo(id, tipoClone)      { return this.call('cloneRilievo',         { id, tipoClone }); },
  async deleteRilievo(id)                { return this.call('deleteRilievo',         { id }); },

  // ----------------------------------------------------------------
  // STRATIGRAFIE
  // ----------------------------------------------------------------
  async getStratigrafie(idRilievo)              { return this.call('getStratigrafie',        { idRilievo }); },
  async createStratigrafia(data)                { return this.call('createStratigrafia',     { data }); },
  async updateStratigrafia(id, data)            { return this.call('updateStratigrafia',     { id, data }); },
  async deleteStratigrafia(id)                  { return this.call('deleteStratigrafia',     { id }); },
  async setDefaultStratigrafia(id, idRilievo)   { return this.call('setDefaultStratigrafia', { id, idRilievo }); },

  // ----------------------------------------------------------------
  // POSIZIONI SERRAMENTI
  // ----------------------------------------------------------------
  async getPosizioniSerr(idRilievo)      { return this.call('getPosizioniSerr',      { idRilievo }); },
  async createPosizioneSerr(data)        { return this.call('createPosizioneSerr',   { data }); },
  async updatePosizioneSerr(id, data)    { return this.call('updatePosizioneSerr',   { id, data }); },
  async copyPosizioneSerr(id, count)     { return this.call('copyPosizioneSerr',     { id, count }); },
  async deletePosizioneSerr(id)          { return this.call('deletePosizioneSerr',   { id }); },

  // ----------------------------------------------------------------
  // POSIZIONI PORTE
  // ----------------------------------------------------------------
  async getPosizioniPorte(idRilievo)     { return this.call('getPosizioniPorte',     { idRilievo }); },
  async createPosizionePorta(data)       { return this.call('createPosizionePorta',  { data }); },
  async updatePosizionePorta(id, data)   { return this.call('updatePosizionePorta',  { id, data }); },
  async copyPosizionePorta(id, count)    { return this.call('copyPosizionePorta',    { id, count }); },
  async deletePosizionePorta(id)         { return this.call('deletePosizionePorta',  { id }); },

  // ----------------------------------------------------------------
  // CALCOLI E REPORT
  // ----------------------------------------------------------------
  async calcolaDimensioniTelaio(posizione)     { return this.call('calcolaDimensioniTelaio',     { posizione }); },
  async calcolaAccessoriPosizione(posizione)   { return this.call('calcolaAccessoriPosizione',   { posizione }); },
  async calcolaReportAccessori(idRilievo)      { return this.call('calcolaReportAccessori',      { idRilievo }); },
  async calcolaReportPosa(idRilievo, tipo)     { return this.call('calcolaReportPosa',           { idRilievo, tipo }); },

  // ----------------------------------------------------------------
  // ORE POSA
  // ----------------------------------------------------------------
  async aggiornaOre(idRilievo, servizio, delta, note) {
    return this.call('aggiornaOre', { idRilievo, servizio, delta, note });
  },
  async getLogOre(idRilievo)             { return this.call('getLogOre',            { idRilievo }); },
  async checkVersionePosa(idRilievo)     { return this.call('checkVersionePosa',    { idRilievo }); },
  async aggiornaVersionePosa(idRilievo)  { return this.call('aggiornaVersionePosa', { idRilievo }); },

  // ----------------------------------------------------------------
  // DB SERRAMENTO / PORTE
  // ----------------------------------------------------------------
  async getDbSerramento()               { return this.call('getDbSerramento'); },
  async addDbSerrRecord(data)           { return this.call('addDbSerrRecord',    { data }); },
  async updateDbSerrRecord(codice, data){ return this.call('updateDbSerrRecord', { codice, data }); },
  async getDbPorte()                    { return this.call('getDbPorte'); },
  async updateDbPorteRecord(codice, data){ return this.call('updateDbPorteRecord',{ codice, data }); },

  // ----------------------------------------------------------------
  // ADMIN: LOOKUP
  // ----------------------------------------------------------------
  async adminGetLookup(table)                      { return this.call('adminGetLookup',    { table }); },
  async adminAddLookup(table, data)                { return this.call('adminAddLookup',    { table, data }); },
  async adminUpdateLookup(table, rowId, data)      { return this.call('adminUpdateLookup', { table, rowId, data }); },
  async adminToggleLookup(table, id)               { return this.call('adminToggleLookup', { table, id }); },

  // ----------------------------------------------------------------
  // ADMIN: POSA
  // ----------------------------------------------------------------
  async adminGetPosa(tipo)                         { return this.call('adminGetPosa',           { tipo }); },
  async adminUpdatePosa(tipo, id, data)            { return this.call('adminUpdatePosa',        { tipo, id, data }); },
  async adminNuovaVersionePosa(tipo, note)         { return this.call('adminNuovaVersionePosa', { tipo, note }); },

  // ----------------------------------------------------------------
  // ADMIN: DATI COMUNI / REGOLE / UTENTI
  // ----------------------------------------------------------------
  async adminGetDatiComuni()                       { return this.call('adminGetDatiComuni'); },
  async adminUpdateDatiComuni(id, valore)          { return this.call('adminUpdateDatiComuni', { id, valore }); },
  async adminGetRegoleLati()                       { return this.call('adminGetRegoleLati'); },
  async adminUpdateRegoleLati(sigla, data)         { return this.call('adminUpdateRegoleLati', { sigla, data }); },
  async adminGetUtenti()                           { return this.call('adminGetUtenti'); }

};
