// ================================================================
// FILE: js/api.js — PARTE 1/2
// PROGETTO: F4 Rilievi — Frontend GitHub Pages
// VERSIONE: 2.1 (aggiunta allarme + note_commerciali)
// ================================================================

const _sb = {
  _headers(extra) {
    const token = Auth.getToken();
    const h = {
      'apikey':       APP_CONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };
    if (token) h['Authorization'] = 'Bearer ' + token;
    if (extra) Object.assign(h, extra);
    return h;
  },

  _url(table, params) {
    let url = APP_CONFIG.SUPABASE_URL + '/rest/v1/' + table;
    if (params) {
      const pairs = [];
      for (const k in params) {
        if (params[k] !== undefined && params[k] !== null)
          pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      }
      if (pairs.length) url += '?' + pairs.join('&');
    }
    return url;
  },

  async _req(method, url, body, extraHeaders) {
    const doFetch = (tok) => fetch(url, {
      method:  method,
      headers: this._headers(Object.assign({}, extraHeaders, tok ? {'Authorization': 'Bearer ' + tok} : {})),
      body:    body !== undefined ? JSON.stringify(body) : undefined
    });

    let res = await doFetch(Auth.getToken());

    if (res.status === 401) {
      const ok = await Auth._refreshToken();
      if (!ok) { Auth.logout(); throw new Error('Sessione scaduta.'); }
      res = await doFetch(Auth.getToken());
    }

    if (res.status === 204) return null;

    const text = await res.text();
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { const j = JSON.parse(text); msg = j.message || j.error || msg; } catch(e) {}
      throw new Error(msg);
    }
    return text ? JSON.parse(text) : null;
  },

  async get(table, params, headers)  { return this._req('GET',    this._url(table, params), undefined, headers); },
  async post(table, body, headers)   { return this._req('POST',   this._url(table), body, Object.assign({'Prefer':'return=representation'}, headers)); },
  async patch(table, params, body)   { return this._req('PATCH',  this._url(table, params), body, {'Prefer':'return=representation'}); },
  async delete_(table, params)       { return this._req('DELETE', this._url(table, params)); },

  async authPost(path, body) {
    const res = await fetch(APP_CONFIG.SUPABASE_URL + '/auth/v1' + path, {
      method:  'POST',
      headers: { 'apikey': APP_CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Errore auth');
    return data;
  },

  async adminCall(action, payload) {
    const token = Auth.getToken();
    if (!token) throw new Error('Non autenticato.');
    const res = await fetch(APP_CONFIG.SUPABASE_URL + '/functions/v1/admin-users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore admin');
    return data;
  }
};

const _map = {
  cliente(row) {
    if (!row) return null;
    return {
      ID_cliente: row.id,
      nome:       row.nome,
      telefono:   row.telefono  || '',
      email:      row.email     || '',
      note:       row.note      || '',
      tipo_via:   row.tipo_via   || '',
      indirizzo:  row.indirizzo  || '',
      comune:     row.comune     || '',
      provincia:  row.provincia  || '',
      cap:        row.cap        || '',
      stato:      row.stato
    };
  },

  cantiere(row, breadcrumb) {
    if (!row) return null;
    return {
      ID_cantiere:   row.id,
      ID_cliente:    row.id_cliente,
      ID_parent:     row.id_parent || '',
      nome_cantiere: row.nome_cantiere,
      tipo_via:      row.tipo_via   || '',
      indirizzo:     row.indirizzo  || '',
      comune:        row.comune     || '',
      provincia:     row.provincia  || '',
      CAP:           row.cap        || '',
      note:          row.note       || '',
      stato:         row.stato,
      breadcrumb:    breadcrumb     || row.nome_cantiere
    };
  },

  rilievo(row, cantierePath) {
    if (!row) return null;
    return {
      ID_rilievo:       row.id,
      ID_cantiere:      row.id_cantiere,
      tipo:             row.tipo,
      revisione:        row.revisione,
      copia:            row.copia,
      codice:           row.codice_completo,
      codice_completo:  row.codice_completo,
      ID_origine:       row.id_origine || '',
      tipo_clone:       row.tipo_clone || '',
      referente:        row.referente  || '',
      data_rilievo:     row.data_rilievo || '',
      data_posa:        row.data_posa   || '',
      intervento:       row.intervento  || '',
      gru:              row.gru ? 'SI' : 'NO',
      versione_posa:    row.versione_posa || 0,
      note:             row.note || '',
      allarme:          row.allarme || false,
      note_commerciali: row.note_commerciali || {},
      stato:            row.stato,
      percorsoCantiere: cantierePath || null
    };
  },

  posSerr(row) {
    if (!row) return null;
    return {
      ID_pos:                   row.id,
      ID_rilievo:               row.id_rilievo,
      numero_pos:               row.numero_pos,
      numero_pos_alfa:          row.numero_pos_alfa || '',
      piano:                    row.piano,
      ambiente:                 row.ambiente              || '',
      tipo_serramento:          row.tipo_serramento       || '',
      n_campi:                  row.n_campi               || '',
      senso_apertura:           row.senso_apertura        || '',
      tipo_foro:                row.tipo_foro             || '',
      L_mm:                     row.l_mm                  || '',
      H_mm:                     row.h_mm                  || '',
      materiale:                row.materiale             || '',
      sistema:                  row.sistema               || '',
      stile_design:             row.stile_design          || '',
      variante_telaio:          row.variante_telaio       || '',
      codice_serramento:        row.codice_serramento     || '',
      n_vetri:                  row.n_vetri               || '',
      colore_int:               row.colore_int            || '',
      colore_est:               row.colore_est            || '',
      coprifilo_int_mat:        row.coprifilo_int_mat     || '',
      coprifilo_int_dim:        row.coprifilo_int_dim     || '',
      coprifilo_est_mat:        row.coprifilo_est_mat     || '',
      coprifilo_est_dim:        row.coprifilo_est_dim     || '',
      schermatura:              row.schermatura           || '',
      oscurante_tipo:           row.oscurante_tipo        || '',
      oscurante_meccanismo:     row.oscurante_meccanismo  || '',
      cassonetto:               row.cassonetto            || '',
      controtelaio:             row.controtelaio          || '',
      zanzariera:               row.zanzariera            || '',
      dinoxill:                 row.dinoxill              || '',
      dinoxill_lati:            row.dinoxill_lati         || '3',
      rimozione:                row.rimozione ? 'SI' : 'NO',
      rimozione_accessori:      row.rimozione_accessori === true,
      taglio_marmo:             row.taglio_marmo === true,
      angolari_pvc:             row.angolari_pvc === true,
      note:                     row.note                  || '',
      ID_stratigrafia_override: row.id_stratigrafia_override || '',
      stato:                    row.stato,
      ordine:                   row.ordine !== undefined ? row.ordine : null,
      id_capitolo:              row.id_capitolo || null
    };
  },

  posPorta(row) {
    if (!row) return null;
    return {
      ID_pos:               row.id,
      ID_rilievo:           row.id_rilievo,
      numero_pos:           row.numero_pos,
      numero_pos_alfa:      row.numero_pos_alfa || '',
      piano:                row.piano,
      ambiente:             row.ambiente             || '',
      fornitore:            row.fornitore            || '',
      tipo_porta:           row.tipo_porta           || '',
      sistema:              row.sistema              || '',
      sopraluce:            row.sopraluce ? 'SI' : 'NO',
      tipo_foro:            row.tipo_foro            || '',
      H_mm:                 row.h_mm                 || '',
      L_mm:                 row.l_mm                 || '',
      sp_muro_mm:           row.sp_muro_mm           || '',
      telaio_decentrato_mm: row.telaio_decentrato_mm || '',
      collezione:           row.collezione           || '',
      modello:              row.modello              || '',
      versione_porta:       row.versione_porta       || '',
      essenza:              row.essenza              || '',
      verso_apertura:       row.verso_apertura       || '',
      vetri:                row.vetri ? 'SI' : 'NO',
      tipo_serratura:       row.tipo_serratura       || '',
      mostrine:             row.mostrine ? 'SI' : 'NO',
      colore_serratura:     row.colore_serratura     || '',
      colore_cerniere:      row.colore_cerniere      || '',
      allargamento_telaio:  row.allargamento_telaio ? 'SI' : 'NO',
      allargamento_mm:      row.allargamento_mm      || '',
      fornitura_ctl_int:    row.fornitura_ctl_int ? 'SI' : 'NO',
      fornitura_ctl_bli:    row.fornitura_ctl_bli ? 'SI' : 'NO',
      fornitura_ctl_rei:    row.fornitura_ctl_rei ? 'SI' : 'NO',
      install_ctl_int:      row.install_ctl_int  ? 'SI' : 'NO',
      install_ctl_bli:      row.install_ctl_bli  ? 'SI' : 'NO',
      install_ctl_rei:      row.install_ctl_rei  ? 'SI' : 'NO',
      maniglia_marca:       row.maniglia_marca       || '',
      maniglia_modello:     row.maniglia_modello     || '',
      maniglia_colore_mat:  row.maniglia_colore_mat  || '',
      rimozione:            row.rimozione ? 'SI' : 'NO',
      note:                 row.note                 || '',
      stato:                row.stato,
      ordine:               row.ordine !== undefined ? row.ordine : null,
      id_capitolo:          row.id_capitolo || null
    };
  },

  stratigrafia(row) {
    if (!row) return null;
    return {
      ID_stratigrafia: row.id,
      ID_rilievo:      row.id_rilievo,
      nome:            row.nome,
      immagine_ref:    row.immagine_ref || '',
      quote_json:      row.quote_json   || {},
      is_default:      row.is_default,
      ordine:          row.ordine,
      stato:           row.stato
    };
  },

  datiComuni(rows) {
    const dict = {};
    (rows || []).forEach(r => {
      if (r) dict[parseInt(r.id)] = parseFloat(r.valore_mm) || 0;
    });
    return dict;
  },

  regoleLati(rows) {
    const dict = {};
    (rows || []).forEach(r => {
      if (r && r.sigla) dict[r.sigla] = r;
    });
    return dict;
  }
};

const _in = {
  rilievo(data) {
    return {
      id_cantiere:      data.ID_cantiere,
      tipo:             data.tipo,
      referente:        data.referente      || null,
      data_rilievo:     data.data_rilievo   || null,
      data_posa:        data.data_posa      || null,
      intervento:       data.intervento     || null,
      gru:              data.gru === 'SI',
      versione_posa:    data.versione_posa  || null,
      note:             data.note           || null,
      allarme:          data.allarme === 'SI' || data.allarme === true,
      note_commerciali: data.note_commerciali || {}
    };
  },

  posSerr(data) {
    return {
      id_rilievo:               data.ID_rilievo,
      numero_pos_alfa:          data.numero_pos_alfa || null,
      piano:                    data.piano !== '' ? parseInt(data.piano) : null,
      ambiente:                 data.ambiente             || null,
      tipo_serramento:          data.tipo_serramento      || null,
      n_campi:                  data.n_campi !== '' ? parseInt(data.n_campi) : null,
      senso_apertura:           data.senso_apertura       || null,
      tipo_foro:                data.tipo_foro            || null,
      l_mm:                     data.L_mm !== '' ? parseInt(data.L_mm) : null,
      h_mm:                     data.H_mm !== '' ? parseInt(data.H_mm) : null,
      materiale:                data.materiale            || null,
      sistema:                  data.sistema              || null,
      stile_design:             data.stile_design         || null,
      variante_telaio:          data.variante_telaio      || null,
      codice_serramento:        data.codice_serramento    || null,
      n_vetri:                  data.n_vetri              || null,
      colore_int:               data.colore_int           || null,
      colore_est:               data.colore_est           || null,
      coprifilo_int_mat:        data.coprifilo_int_mat    || null,
      coprifilo_int_dim:        data.coprifilo_int_dim    || null,
      coprifilo_est_mat:        data.coprifilo_est_mat    || null,
      coprifilo_est_dim:        data.coprifilo_est_dim    || null,
      schermatura:              data.schermatura          || null,
      oscurante_tipo:           data.oscurante_tipo       || null,
      oscurante_meccanismo:     data.oscurante_meccanismo || null,
      cassonetto:               data.cassonetto           || null,
      controtelaio:             data.controtelaio         || null,
      zanzariera:               data.zanzariera           || null,
      dinoxill:                 data.dinoxill             || null,
      dinoxill_lati:            data.dinoxill_lati        || null,
      rimozione:                data.rimozione === 'SI',
      rimozione_accessori:      data.rimozione_accessori === true,
      taglio_marmo:             data.taglio_marmo === true,
      angolari_pvc:             data.angolari_pvc === true,
      note:                     data.note                 || null,
      id_stratigrafia_override: data.ID_stratigrafia_override || null,
      ordine:                   data.ordine !== undefined ? parseFloat(data.ordine) : null,
      id_capitolo:              data.id_capitolo || null
    };
  },

  posPorta(data) {
    const b = v => v === 'SI' || v === true;
    return {
      id_rilievo:           data.ID_rilievo,
      numero_pos_alfa:      data.numero_pos_alfa || null,
      piano:                data.piano !== '' ? parseInt(data.piano) : null,
      ambiente:             data.ambiente              || null,
      fornitore:            data.fornitore             || null,
      tipo_porta:           data.tipo_porta            || null,
      sistema:              data.sistema               || null,
      sopraluce:            b(data.sopraluce),
      tipo_foro:            data.tipo_foro             || null,
      h_mm:                 data.H_mm !== '' ? parseInt(data.H_mm) : null,
      l_mm:                 data.L_mm !== '' ? parseInt(data.L_mm) : null,
      sp_muro_mm:           data.sp_muro_mm            ? parseInt(data.sp_muro_mm)    : null,
      telaio_decentrato_mm: data.telaio_decentrato_mm  ? parseInt(data.telaio_decentrato_mm) : null,
      collezione:           data.collezione            || null,
      modello:              data.modello               || null,
      versione_porta:       data.versione_porta        || null,
      essenza:              data.essenza               || null,
      verso_apertura:       data.verso_apertura        || null,
      vetri:                b(data.vetri),
      tipo_serratura:       data.tipo_serratura        || null,
      mostrine:             b(data.mostrine),
      colore_serratura:     data.colore_serratura      || null,
      colore_cerniere:      data.colore_cerniere       || null,
      allargamento_telaio:  b(data.allargamento_telaio),
      allargamento_mm:      data.allargamento_mm       ? parseInt(data.allargamento_mm) : null,
      fornitura_ctl_int:    b(data.fornitura_ctl_int),
      fornitura_ctl_bli:    b(data.fornitura_ctl_bli),
      fornitura_ctl_rei:    b(data.fornitura_ctl_rei),
      install_ctl_int:      b(data.install_ctl_int),
      install_ctl_bli:      b(data.install_ctl_bli),
      install_ctl_rei:      b(data.install_ctl_rei),
      maniglia_marca:       data.maniglia_marca        || null,
      maniglia_modello:     data.maniglia_modello      || null,
      maniglia_colore_mat:  data.maniglia_colore_mat   || null,
      rimozione:            b(data.rimozione),
      note:                 data.note                  || null
    };
  }
};

// ================================================================
// LOOKUP SORT — ordini esatti da foglio Excel
// ================================================================
function _sortLookup(table, rows) {
  var T = table.toUpperCase();
  var ORDINE = {
    'LK_TIPO_SERR':      ['I','F','PF','FF','VF','S'],
    'LK_TIPO_FORO_SERR': ['A','D','P'],
    'LK_SENSI_APERTURA': ['D','S','W','F'],
    'LK_SCHERMATURA':    ['A','AM','AE','AR','S','TZ','TM','CA','CT'],
    'LK_VETRO':          ['D','T'],
    'LK_COPRIFILI':      ['P','L','A'],
    'LK_CASSONETTO':     ['P','L'],
    'LK_CONTROTELAIO':   ['L','T'],
    'LK_ZANZARIERA':     ['V','O'],
    'LK_DINOXILL':       ['DA','I3','I4'],
    'LK_OSCURANTE':      ['V','D','P'],
    'LK_TIPO_FORO_PORTE':['N','P'],
    'LK_TIPO_PORTA':     ['INT','BLI','REI'],
    'LK_SISTEMA_PORTE':  ['ST','DO','TP','FC','F_','SI','SE','LI','PI']
  };
  var NUMERICO = ['LK_N_CAMPI','LK_PIANO'];
  if (ORDINE[T]) {
    var ord = ORDINE[T];
    return rows.slice().sort(function(a,b) {
      var ka = a.sigla !== undefined ? a.sigla : (a.tipo_porta||'');
      var kb = b.sigla !== undefined ? b.sigla : (b.tipo_porta||'');
      var ia = ord.indexOf(ka), ib = ord.indexOf(kb);
      return (ia<0?999:ia) - (ib<0?999:ib);
    });
  }
  if (NUMERICO.indexOf(T) >= 0) {
    var key = T === 'LK_PIANO' ? 'piano' : 'n_campi';
    return rows.slice().sort(function(a,b){ return (parseFloat(a[key])||0) - (parseFloat(b[key])||0); });
  }
  return rows;
}

const API = {
  _ok(data)  { return { success: true,  data }; },
  _err(e)    {
    const msg = (e && e.message) ? e.message : String(e);
    console.error('API error:', msg);
    return { success: false, error: msg };
  },

  async login(email, password) {
    try {
      const authData = await _sb.authPost('/token?grant_type=password', { email: email.trim(), password });
      const rows = await _sb._req('GET',
        _sb._url('utenti', { auth_uid: 'eq.' + authData.user.id, stato: 'eq.attivo', select: '*' }),
        undefined, { 'Authorization': 'Bearer ' + authData.access_token }
      );
      if (!rows || !rows.length) return { success: false, error: 'Utente non abilitato. Contatta l amministratore.' };
      const profile = rows[0];
      const user = { id: profile.id, email: profile.email, nome: profile.nome, ruolo: profile.ruolo, sigla: profile.sigla || '', reparto: profile.reparto || '' };
      Auth.saveSession(authData.access_token, authData.refresh_token, user);
      return { success: true, token: authData.access_token, user };
    } catch(e) {
      let msg = e.message || 'Errore di accesso.';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) msg = 'Email o password non corretti.';
      return this._err({ message: msg });
    }
  },

  async logout()        { await Auth.logout(); return { success: true }; },
  async getCurrentUser(){ return this._ok(Auth.getUser()); },

  async getLookup(table) {
    try {
      const rows = await _sb.get(table.toLowerCase(), { stato: 'eq.attivo', order: 'id.asc' });
      return this._ok(_sortLookup(table, rows || []));
    } catch(e) { return this._err(e); }
  },

  async getLookupMulti(tables) {
    try {
      const results = await Promise.all(tables.map(t => this.getLookup(t)));
      const out = {};
      tables.forEach((t, i) => { out[t] = results[i].success ? results[i].data : []; });
      return { success: true, data: out };
    } catch(e) { return this._err(e); }
  },

  async getDatiComuni() {
    try { const rows = await _sb.get('dati_comuni_serr', { stato: 'eq.attivo', order: 'id.asc' }); return this._ok(rows || []); }
    catch(e) { return this._err(e); }
  },

  async getRegoleLati() {
    try { const rows = await _sb.get('regole_lati', { stato: 'eq.attivo', order: 'sigla.asc' }); return this._ok(rows || []); }
    catch(e) { return this._err(e); }
  },

  async getComuni(query) {
    if (!query || query.length < 2) return this._ok([]);
    try {
      const rows = await _sb.get('lk_indirizzo', { comune: 'ilike.' + query + '*', order: 'comune.asc', limit: '12', select: 'comune,provincia,cap' });
      return this._ok((rows || []).map(r => ({ comune: r.comune || '', provincia: r.provincia || '', CAP: r.cap || '' })));
    } catch(e) { return this._ok([]); }
  },

  // ---- CLIENTI ----
  async getClienti() {
    try { const rows = await _sb.get('clienti', { stato: 'neq.archiviato', order: 'nome.asc', select: '*' }); return this._ok((rows || []).map(_map.cliente)); }
    catch(e) { return this._err(e); }
  },
  async getCliente(id) {
    try { const rows = await _sb.get('clienti', { id: 'eq.' + id, select: '*' }); return rows && rows.length ? this._ok(_map.cliente(rows[0])) : this._err({ message: 'Cliente non trovato.' }); }
    catch(e) { return this._err(e); }
  },
  async createCliente(data) {
    try { const user = Auth.getUser(); const rows = await _sb.post('clienti', { nome: data.nome, telefono: data.telefono || null, email: data.email || null, note: data.note || null, tipo_via: data.tipo_via || null, indirizzo: data.indirizzo || null, comune: data.comune || null, provincia: data.provincia || null, cap: data.cap || null, utente_creazione: user ? user.id : null }); return this._ok(_map.cliente(rows[0])); }
    catch(e) { return this._err(e); }
  },
  async updateCliente(id, data) {
    try { const rows = await _sb.patch('clienti', { id: 'eq.' + id }, { nome: data.nome, telefono: data.telefono || null, email: data.email || null, note: data.note || null, tipo_via: data.tipo_via || null, indirizzo: data.indirizzo || null, comune: data.comune || null, provincia: data.provincia || null, cap: data.cap || null }); return this._ok(_map.cliente((rows || [])[0])); }
    catch(e) { return this._err(e); }
  },
  async toggleStatoCliente(id) {
    try { const rows = await _sb.get('clienti', { id: 'eq.' + id, select: 'stato' }); if (!rows || !rows.length) throw new Error('Cliente non trovato.'); const nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo'; await _sb.patch('clienti', { id: 'eq.' + id }, { stato: nuovoStato }); return this._ok({ stato: nuovoStato }); }
    catch(e) { return this._err(e); }
  },
  async toggleCliente(id) { return this.toggleStatoCliente(id); },

  // ---- CANTIERI ----
  async getAlberoCliente(idCliente) {
    try { const rows = await _sb.get('cantieri', { id_cliente: 'eq.' + idCliente, select: '*', order: 'nome_cantiere.asc' }); return this._ok(_buildTree(rows || [])); }
    catch(e) { return this._err(e); }
  },
  async getAlbero(idCliente)   { return this.getAlberoCliente(idCliente); },
  async getCantieri(idCliente) { return this.getAlberoCliente(idCliente); },
  async getCantiere(id) {
    try { const rows = await _sb.get('cantieri', { id: 'eq.' + id, select: '*' }); if (!rows || !rows.length) throw new Error('Cantiere non trovato.'); return this._ok(_map.cantiere(rows[0])); }
    catch(e) { return this._err(e); }
  },
  async createCantiere(data) {
    try { const user = Auth.getUser(); const rows = await _sb.post('cantieri', { id_cliente: data.ID_cliente, id_parent: data.ID_parent || null, nome_cantiere: data.nome_cantiere, tipo_via: data.tipo_via || null, indirizzo: data.indirizzo || null, comune: data.comune || null, provincia: data.provincia || null, cap: data.CAP || null, note: data.note || null, utente_creazione: user ? user.id : null }); return this._ok(_map.cantiere(rows[0])); }
    catch(e) { return this._err(e); }
  },
  async updateCantiere(id, data) {
    try { const rows = await _sb.patch('cantieri', { id: 'eq.' + id }, { id_parent: data.ID_parent || null, nome_cantiere: data.nome_cantiere, tipo_via: data.tipo_via || null, indirizzo: data.indirizzo || null, comune: data.comune || null, provincia: data.provincia || null, cap: data.CAP || null, note: data.note || null }); return this._ok(_map.cantiere((rows || [])[0])); }
    catch(e) { return this._err(e); }
  },
  async toggleStatoCantiere(id) {
    try { const rows = await _sb.get('cantieri', { id: 'eq.' + id, select: 'stato' }); if (!rows || !rows.length) throw new Error('Cantiere non trovato.'); const nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo'; await _sb.patch('cantieri', { id: 'eq.' + id }, { stato: nuovoStato }); return this._ok({ stato: nuovoStato }); }
    catch(e) { return this._err(e); }
  },
  async deleteCantiere(id) { return this.toggleStatoCantiere(id); },

  // ---- RILIEVI ----
  async getRilieviCantiere(idCantiere) {
    try { const rows = await _sb.get('rilievi', { id_cantiere: 'eq.' + idCantiere, stato: 'neq.archiviato', order: 'codice_completo.asc', select: '*' }); return this._ok((rows || []).map(r => _map.rilievo(r))); }
    catch(e) { return this._err(e); }
  },
  async getRilievi(idCantiere) { return this.getRilieviCantiere(idCantiere); },
  // ================================================================
  // CAPITOLI
  // ================================================================
  async getCapitoli(idRilievo) {
    try {
      const rows = await _sb.get('capitoli_rilievo', { id_rilievo: 'eq.' + idRilievo, stato: 'eq.attivo', order: 'ordine_inizio.asc', select: '*' });
      return this._ok((rows || []).map(r => ({
        id:            r.id,
        id_rilievo:    r.id_rilievo,
        titolo:        r.titolo,
        ordine_inizio: r.ordine_inizio,
        ordine_fine:   r.ordine_fine,
        stato:         r.stato
      })));
    } catch(e) { return this._err(e); }
  },

  async createCapitolo(idRilievo, titolo, ordineInizio, ordineFine) {
    try {
      const user = Auth.getUser();
      const rows = await _sb.post('capitoli_rilievo', {
        id_rilievo:    idRilievo,
        titolo:        titolo || 'Capitolo',
        ordine_inizio: ordineInizio,
        ordine_fine:   ordineFine,
        stato:         'attivo'
      });
      return this._ok({ id: rows[0].id, titolo: rows[0].titolo });
    } catch(e) { return this._err(e); }
  },

  async updateCapitoloTitolo(id, titolo) {
    try {
      await _sb.patch('capitoli_rilievo', { id: 'eq.' + id }, { titolo: titolo });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async updateCapitoloOrdini(id, ordineInizio, ordineFine) {
    try {
      await _sb.patch('capitoli_rilievo', { id: 'eq.' + id }, { ordine_inizio: ordineInizio, ordine_fine: ordineFine });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async deleteCapitolo(id) {
    try {
      // Scollega le posizioni da questo capitolo
      await _sb.patch('posizioni_serr',  { id_capitolo: 'eq.' + id }, { id_capitolo: null });
      await _sb.patch('posizioni_porte', { id_capitolo: 'eq.' + id }, { id_capitolo: null });
      // Archivia il capitolo
      await _sb.patch('capitoli_rilievo', { id: 'eq.' + id }, { stato: 'eliminato' });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  // Aggiorna l'ordine di tutte le posizioni + ricalcola id_capitolo
  async aggiornaOrdiniSerr(idRilievo, righe, capitoli) {
    // righe = [{id, ordine}] — tutte le posizioni nell'ordine corrente
    // capitoli = [{id, ordine_inizio, ordine_fine}]
    try {
      // 1. Aggiorna ordine posizioni
      for (var i = 0; i < righe.length; i++) {
        var r = righe[i];
        // Calcola id_capitolo: quale capitolo contiene questo ordine?
        var idCap = null;
        for (var j = 0; j < capitoli.length; j++) {
          var c = capitoli[j];
          if (r.ordine > c.ordine_inizio && r.ordine < c.ordine_fine) { idCap = c.id; break; }
        }
        await _sb.patch('posizioni_serr', { id: 'eq.' + r.id }, { ordine: r.ordine, id_capitolo: idCap });
      }
      // 2. Aggiorna ordini capitoli
      for (var k = 0; k < capitoli.length; k++) {
        var cap = capitoli[k];
        await _sb.patch('capitoli_rilievo', { id: 'eq.' + cap.id }, { ordine_inizio: cap.ordine_inizio, ordine_fine: cap.ordine_fine });
      }
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async aggiornaOrdiniPorte(idRilievo, righe, capitoli) {
    try {
      for (var i = 0; i < righe.length; i++) {
        var r = righe[i];
        var idCap = null;
        for (var j = 0; j < capitoli.length; j++) {
          var c = capitoli[j];
          if (r.ordine > c.ordine_inizio && r.ordine < c.ordine_fine) { idCap = c.id; break; }
        }
        await _sb.patch('posizioni_porte', { id: 'eq.' + r.id }, { ordine: r.ordine, id_capitolo: idCap });
      }
      for (var k = 0; k < capitoli.length; k++) {
        var cap = capitoli[k];
        await _sb.patch('capitoli_rilievo', { id: 'eq.' + cap.id }, { ordine_inizio: cap.ordine_inizio, ordine_fine: cap.ordine_fine });
      }
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async getRilieviTutti(tipo) {
    try { const rows = await _sb.get('rilievi', { tipo: 'eq.' + tipo, stato: 'neq.archiviato', select: 'id,codice_completo,referente,tipo,id_cantiere' }); return this._ok(rows || []); }
    catch(e) { return this._err(e.message); }
  },

  async getRilievo(id) {
    try { const rows = await _sb.get('rilievi', { id: 'eq.' + id, select: '*' }); if (!rows || !rows.length) throw new Error('Rilievo non trovato.'); const ril = rows[0]; const cantPath = await _getCantierePath(ril.id_cantiere); return this._ok(_map.rilievo(ril, cantPath)); }
    catch(e) { return this._err(e); }
  },

  async createRilievo(data) {
    try {
      const user = Auth.getUser();
      const existing = await _sb.get('rilievi', { id_cantiere: 'eq.' + data.ID_cantiere, tipo: 'eq.' + data.tipo, select: 'revisione,copia' });
      const codice = _nextCodice(existing || [], null, null, data.tipo);
      const rows = await _sb.post('rilievi', Object.assign(_in.rilievo(data), { revisione: codice.revisione, copia: codice.copia, codice_completo: codice.codice, versione_posa: 1, utente_creazione: user ? user.id : null }));
      const created = rows[0];
      return { success: true, id: created.id, codice: created.codice_completo };
    } catch(e) { return this._err(e); }
  },

  async updateRilievo(id, data) {
    try {
      const patch = {};
      if (data.referente    !== undefined) patch.referente    = data.referente    || null;
      if (data.intervento   !== undefined) patch.intervento   = data.intervento   || null;
      if (data.data_rilievo !== undefined) patch.data_rilievo = data.data_rilievo || null;
      if (data.data_posa    !== undefined) patch.data_posa    = data.data_posa    || null;
      if (data.gru          !== undefined) patch.gru          = data.gru === 'SI';
      if (data.note         !== undefined) patch.note         = data.note         || null;
      if (data.versione_posa!== undefined) patch.versione_posa = data.versione_posa;
      if (data.allarme          !== undefined) patch.allarme          = data.allarme === 'SI' || data.allarme === true;
      if (data.note_commerciali !== undefined) patch.note_commerciali = data.note_commerciali || {};
      await _sb.patch('rilievi', { id: 'eq.' + id }, patch);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async cloneRilievo(id, tipoClone) {
    try {
      const rows = await _sb.get('rilievi', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Rilievo non trovato.');
      const orig = rows[0]; const user = Auth.getUser();
      const existing = await _sb.get('rilievi', { id_cantiere: 'eq.' + orig.id_cantiere, tipo: 'eq.' + orig.tipo, select: 'revisione,copia' });
      const codice = _nextCodice(existing || [], tipoClone, orig, orig.tipo);
      const newRows = await _sb.post('rilievi', { id_cantiere: orig.id_cantiere, tipo: orig.tipo, revisione: codice.revisione, copia: codice.copia, codice_completo: codice.codice, id_origine: orig.id, tipo_clone: tipoClone, referente: orig.referente, data_rilievo: orig.data_rilievo, data_posa: orig.data_posa, intervento: orig.intervento, gru: orig.gru, versione_posa: orig.versione_posa, note: orig.note, allarme: orig.allarme || false, note_commerciali: orig.note_commerciali || {}, utente_creazione: user ? user.id : null });
      const created = newRows[0];
      await _clonePosizioni(id, created.id, orig.tipo);
      return { success: true, id: created.id, codice: created.codice_completo };
    } catch(e) { return this._err(e); }
  },

  async deleteRilievo(id) {
    try { await _sb.patch('rilievi', { id: 'eq.' + id }, { stato: 'archiviato' }); return this._ok(null); }
    catch(e) { return this._err(e); }
  },

  async checkVersionePosa(idRilievo) {
    try {
      const rilRows = await _sb.get('rilievi', { id: 'eq.' + idRilievo, select: 'versione_posa,tipo' });
      if (!rilRows || !rilRows.length) throw new Error('Rilievo non trovato.');
      const ril = rilRows[0];
      const tablePosa = ril.tipo === 'SERR' ? 'dati_posa_serr' : 'dati_posa_porte';
      const posRows = await _sb.get(tablePosa, { stato: 'eq.attivo', order: 'versione.desc', limit: '1', select: 'versione' });
      const curVer = posRows && posRows[0] ? parseInt(posRows[0].versione) : 1;
      return { success: true, aggiornamentoDisponibile: parseInt(ril.versione_posa) < curVer, versioneAttuale: curVer };
    } catch(e) { return this._err(e); }
  },

  async aggiornaVersionePosa(idRilievo) {
    try {
      const rilRows = await _sb.get('rilievi', { id: 'eq.' + idRilievo, select: 'tipo' });
      if (!rilRows || !rilRows.length) throw new Error('Rilievo non trovato.');
      const tablePosa = rilRows[0].tipo === 'SERR' ? 'dati_posa_serr' : 'dati_posa_porte';
      const posRows = await _sb.get(tablePosa, { stato: 'eq.attivo', order: 'versione.desc', limit: '1', select: 'versione' });
      const curVer = posRows && posRows[0] ? parseInt(posRows[0].versione) : 1;
      await _sb.patch('rilievi', { id: 'eq.' + idRilievo }, { versione_posa: curVer });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  }
};

// ---- HELPERS ----
function _buildTree(rows) {
  const map = {}; const roots = [];
  rows.forEach(r => { map[r.id] = Object.assign(_map.cantiere(r), { figli: [] }); });
  rows.forEach(r => { if (r.id_parent && map[r.id_parent]) map[r.id_parent].figli.push(map[r.id]); else roots.push(map[r.id]); });
  function addBreadcrumb(node, prefix) { node.breadcrumb = prefix ? prefix + ' / ' + node.nome_cantiere : node.nome_cantiere; node.figli.forEach(f => addBreadcrumb(f, node.breadcrumb)); }
  roots.forEach(r => addBreadcrumb(r, ''));
  return roots;
}

async function _getCantierePath(idCantiere) {
  try {
    const cantRows = await _sb.get('cantieri', { id: 'eq.' + idCantiere, select: '*' });
    if (!cantRows || !cantRows.length) return null;
    const cant = cantRows[0];
    const clienteRows = await _sb.get('clienti', { id: 'eq.' + cant.id_cliente, select: 'nome' });
    return { nomeCliente: clienteRows && clienteRows[0] ? clienteRows[0].nome : '', breadcrumb: cant.nome_cantiere };
  } catch(e) { return null; }
}

function _nextCodice(existing, tipoClone, origine, tipo) {
  const pad = n => String(n).padStart(2, '0');
  const prefix = (tipo || (origine && origine.tipo) || 'SERR');
  const mk = (rev, cop) => ({ revisione: rev, copia: cop, codice: prefix + '-R' + pad(rev) + 'C' + pad(cop) });
  if (!tipoClone || !origine) {
    const exists = new Set(existing.map(r => r.revisione + '-' + r.copia));
    let rev = 0, cop = 0;
    while (exists.has(rev + '-' + cop)) cop++;
    return mk(rev, cop);
  }
  if (tipoClone === 'COPIA') {
    const rev = origine.revisione;
    const used = existing.filter(r => r.revisione === rev).map(r => r.copia);
    return mk(rev, Math.max(...used, -1) + 1);
  }
  const usedRev = existing.map(r => r.revisione);
  return mk(Math.max(...usedRev, -1) + 1, 0);
}

async function _clonePosizioni(idOrigine, idDestinazione, tipo) {
  try {
    const table = tipo === 'SERR' ? 'posizioni_serr' : 'posizioni_porte';
    const user = Auth.getUser();
    const rows = await _sb.get(table, { id_rilievo: 'eq.' + idOrigine, stato: 'eq.attivo', select: '*' });
    if (!rows || !rows.length) return;
    for (const r of rows) {
      const copy = Object.assign({}, r);
      delete copy.id; delete copy.created_at; delete copy.updated_at;
      copy.id_rilievo = idDestinazione;
      copy.utente_creazione = user ? user.id : null;
      await _sb.post(table, copy);
    }
  } catch(e) { console.error('Errore clone posizioni:', e); }
}

// ---- PARTE 2 (metodi aggiuntivi) ----
Object.assign(API, {
  async getStratigrafie(idRilievo) {
    try { const rows = await _sb.get('stratigrafie', { id_rilievo: 'eq.' + idRilievo, stato: 'eq.attivo', order: 'ordine.asc,created_at.asc', select: '*' }); return this._ok((rows || []).map(_map.stratigrafia)); }
    catch(e) { return this._err(e); }
  },
  async createStratigrafia(data) {
    try { const user = Auth.getUser(); const rows = await _sb.post('stratigrafie', { id_rilievo: data.ID_rilievo, nome: data.nome, immagine_ref: data.immagine_ref || null, quote_json: data.quote_json || null, is_default: data.is_default || false, ordine: data.ordine || 0, utente_creazione: user ? user.id : null }); return this._ok(_map.stratigrafia(rows[0])); }
    catch(e) { return this._err(e); }
  },
  async updateStratigrafia(id, data) {
    try { const patch = {}; if (data.nome !== undefined) patch.nome = data.nome; if (data.immagine_ref !== undefined) patch.immagine_ref = data.immagine_ref || null; if (data.quote_json !== undefined) patch.quote_json = data.quote_json || null; if (data.ordine !== undefined) patch.ordine = data.ordine; await _sb.patch('stratigrafie', { id: 'eq.' + id }, patch); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async deleteStratigrafia(id) {
    try { await _sb.patch('stratigrafie', { id: 'eq.' + id }, { stato: 'disattivo' }); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async setDefaultStratigrafia(id, idRilievo) {
    try { await _sb.patch('stratigrafie', { id_rilievo: 'eq.' + idRilievo }, { is_default: false }); await _sb.patch('stratigrafie', { id: 'eq.' + id }, { is_default: true }); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async setDefaultStrat(id, idRilievo) { return this.setDefaultStratigrafia(id, idRilievo); },

  async getPosizioniSerr(idRilievo) {
    try { const rows = await _sb.get('posizioni_serr', { id_rilievo: 'eq.' + idRilievo, stato: 'eq.attivo', order: 'ordine.asc', select: '*' }); return this._ok((rows || []).map(_map.posSerr)); }
    catch(e) { return this._err(e); }
  },
  async createPosizioneSerr(data) {
    try {
      const user = Auth.getUser();
      const existing = await _sb.get('posizioni_serr', { id_rilievo: 'eq.' + data.ID_rilievo, stato: 'eq.attivo', select: 'numero_pos,ordine', order: 'numero_pos.desc', limit: '1' });
      const nextPos = existing && existing.length ? (existing[0].numero_pos + 1) : 1;
      const maxOrd = existing && existing.length ? ((existing[0].ordine || existing[0].numero_pos) + 1) : 1;
      const payload = Object.assign(_in.posSerr(data), { numero_pos: nextPos, ordine: maxOrd, utente_creazione: user ? user.id : null });
      const rows = await _sb.post('posizioni_serr', payload);
      const created = rows[0];
      return { success: true, id: created.id, numero_pos: created.numero_pos };
    } catch(e) { return this._err(e); }
  },
  async updatePosizioneSerr(id, data) {
    try { const patch = _in.posSerr(data); delete patch.id_rilievo; delete patch.numero_pos; await _sb.patch('posizioni_serr', { id: 'eq.' + id }, patch); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async deletePosizioneSerr(id) {
    try { await _sb.patch('posizioni_serr', { id: 'eq.' + id }, { stato: 'eliminato' }); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async copyPosizioneSerr(id, count) {
    try {
      const rows = await _sb.get('posizioni_serr', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Posizione non trovata.');
      const orig = rows[0]; const user = Auth.getUser();
      const last = await _sb.get('posizioni_serr', { id_rilievo: 'eq.' + orig.id_rilievo, stato: 'eq.attivo', select: 'numero_pos', order: 'numero_pos.desc', limit: '1' });
      let nextPos = last && last.length ? last[0].numero_pos + 1 : 1;
      const n = parseInt(count) || 1;
      for (let i = 0; i < n; i++) { const copy = Object.assign({}, orig); delete copy.id; delete copy.created_at; delete copy.updated_at; copy.numero_pos = nextPos++; copy.utente_creazione = user ? user.id : null; await _sb.post('posizioni_serr', copy); }
      return this._ok({ copiati: n });
    } catch(e) { return this._err(e); }
  },

  async getPosizioniPorte(idRilievo) {
    try { const rows = await _sb.get('posizioni_porte', { id_rilievo: 'eq.' + idRilievo, stato: 'eq.attivo', order: 'ordine.asc', select: '*' }); return this._ok((rows || []).map(_map.posPorta)); }
    catch(e) { return this._err(e); }
  },
  async createPosizionePorta(data) {
    try {
      const user = Auth.getUser();
      const existing = await _sb.get('posizioni_porte', { id_rilievo: 'eq.' + data.ID_rilievo, stato: 'eq.attivo', select: 'numero_pos,ordine', order: 'numero_pos.desc', limit: '1' });
      const nextPos = existing && existing.length ? (existing[0].numero_pos + 1) : 1;
      const maxOrd  = existing && existing.length ? ((existing[0].ordine || existing[0].numero_pos) + 1) : 1;
      const payload = Object.assign(_in.posPorta(data), { numero_pos: nextPos, ordine: maxOrd, utente_creazione: user ? user.id : null });
      const rows = await _sb.post('posizioni_porte', payload);
      const created = rows[0];
      return { success: true, id: created.id, numero_pos: created.numero_pos };
    } catch(e) { return this._err(e); }
  },
  async updatePosizionePorta(id, data) {
    try { const patch = _in.posPorta(data); delete patch.id_rilievo; delete patch.numero_pos; await _sb.patch('posizioni_porte', { id: 'eq.' + id }, patch); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async deletePosizionePorta(id) {
    try { await _sb.patch('posizioni_porte', { id: 'eq.' + id }, { stato: 'eliminato' }); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async copyPosizionePorta(id, count) {
    try {
      const rows = await _sb.get('posizioni_porte', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Posizione non trovata.');
      const orig = rows[0]; const user = Auth.getUser();
      const last = await _sb.get('posizioni_porte', { id_rilievo: 'eq.' + orig.id_rilievo, stato: 'eq.attivo', select: 'numero_pos', order: 'numero_pos.desc', limit: '1' });
      let nextPos = last && last.length ? last[0].numero_pos + 1 : 1;
      const n = parseInt(count) || 1;
      for (let i = 0; i < n; i++) { const copy = Object.assign({}, orig); delete copy.id; delete copy.created_at; delete copy.updated_at; copy.numero_pos = nextPos++; copy.utente_creazione = user ? user.id : null; await _sb.post('posizioni_porte', copy); }
      return this._ok({ copiati: n });
    } catch(e) { return this._err(e); }
  },

  async getDbSerramento() {
    try {
      var rows = await _sb.get('db_serramento', { stato: 'eq.attivo', order: 'codice.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async getDbPorte() {
    try {
      var rows = await _sb.get('db_porte', { stato: 'eq.attivo', order: 'fornitore.asc,codice.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  // ── Admin DB Serramenti ──
  async adminGetDbSerramento() {
    try {
      var rows = await _sb.get('db_serramento', { order: 'codice.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminAddDbSerramento(data) {
    try {
      var rows = await _sb.post('db_serramento', Object.assign({}, data, { stato: 'attivo' }));
      return this._ok(rows[0] || null);
    } catch(e) { return this._err(e); }
  },

  async adminUpdateDbSerramento(id, data) {
    try {
      await _sb.patch('db_serramento', { id: 'eq.' + id }, data);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async adminToggleDbSerramento(id) {
    try {
      var rows = await _sb.get('db_serramento', { id: 'eq.' + id, select: 'stato' });
      if (!rows || !rows.length) throw new Error('Record non trovato.');
      var nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo';
      await _sb.patch('db_serramento', { id: 'eq.' + id }, { stato: nuovoStato });
      return this._ok({ stato: nuovoStato });
    } catch(e) { return this._err(e); }
  },

  // ── Admin DB Porte ──
  async adminGetDbPorte() {
    try {
      var rows = await _sb.get('db_porte', { order: 'fornitore.asc,codice.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminAddDbPorte(data) {
    try {
      var rows = await _sb.post('db_porte', Object.assign({}, data, { stato: 'attivo' }));
      return this._ok(rows[0] || null);
    } catch(e) { return this._err(e); }
  },

  async adminUpdateDbPorte(id, data) {
    try {
      await _sb.patch('db_porte', { id: 'eq.' + id }, data);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async adminToggleDbPorte(id) {
    try {
      var rows = await _sb.get('db_porte', { id: 'eq.' + id, select: 'stato' });
      if (!rows || !rows.length) throw new Error('Record non trovato.');
      var nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo';
      await _sb.patch('db_porte', { id: 'eq.' + id }, { stato: nuovoStato });
      return this._ok({ stato: nuovoStato });
    } catch(e) { return this._err(e); }
  },

  async getInitData(idRilievo) {
    if (!idRilievo) return this._err({ message: 'ID rilievo mancante.' });
    try {
      const LOOKUP_TABLES = ['LK_REFERENTI','LK_INTERVENTO','LK_TIPO_SERR','LK_TIPO_FORO_SERR','LK_SCHERMATURA','LK_COPRIFILI','LK_CASSONETTO','LK_CONTROTELAIO','LK_ZANZARIERA','LK_DINOXILL','LK_OSCURANTE','LK_COLORI','LK_SENSI_APERTURA','LK_N_CAMPI','LK_PIANO','LK_VETRO','LK_TIPO_PORTA','LK_SISTEMA_PORTE','LK_TIPO_FORO_PORTE','LK_FORNITORE_PORTE','LK_VARIANTE_TELAIO'];
      const [rilRes, lookupRes, dcRes, rlRes, dbRes] = await Promise.all([this.getRilievo(idRilievo), this.getLookupMulti(LOOKUP_TABLES), this.getDatiComuni(), this.getRegoleLati(), this.getDbSerramento()]);
      if (!rilRes.success) return { success: false, data: { rilievoError: rilRes.error } };
      return { success: true, data: { rilievo: rilRes.data, lookups: lookupRes.success ? lookupRes.data : {}, datiComuni: dcRes.success ? dcRes.data : [], regoleLati: rlRes.success ? rlRes.data : [], dbSerramento: dbRes.success ? dbRes.data : [] } };
    } catch(e) { return this._err(e); }
  },

  async calcolaDimensioniTelaio(pos)   { return this._ok({}); },
  async calcolaAccessoriPosizione(pos) { return this._ok({}); },
  async calcolaReportAccessori(id)     { return this._ok({}); },
  async calcolaReportPosa(id, tipo)    { return this._ok({}); },

  async adminGetLookup(table) {
    try { const rows = await _sb.get(table.toLowerCase(), { order: 'id.asc', select: '*' }); return this._ok(rows || []); }
    catch(e) { return this._err(e); }
  },
  async adminAddLookup(table, data) {
    try { const rows = await _sb.post(table.toLowerCase(), data); return this._ok(rows[0]); }
    catch(e) { return this._err(e); }
  },
  async adminUpdateLookup(table, rowId, data) {
    try { await _sb.patch(table.toLowerCase(), { id: 'eq.' + rowId }, data); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async adminToggleLookup(table, id) {
    try { const rows = await _sb.get(table.toLowerCase(), { id: 'eq.' + id, select: 'stato' }); if (!rows || !rows.length) throw new Error('Record non trovato.'); const nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo'; await _sb.patch(table.toLowerCase(), { id: 'eq.' + id }, { stato: nuovoStato }); return this._ok({ stato: nuovoStato }); }
    catch(e) { return this._err(e); }
  },
  async adminGetUtenti() {
    try { const rows = await _sb.get('utenti', { order: 'nome.asc', select: '*' }); return this._ok(rows || []); }
    catch(e) { return this._err(e); }
  },
  // ================================================================
  // DATI COMUNI POSA — lettura e scrittura da Supabase
  // ================================================================
  async getDatiComuniPosa(tipo) {
    try {
      var params = { stato: 'eq.attivo', order: 'codice.asc,piano.asc,n_campi.asc,sistema.asc', select: '*' };
      if (tipo) params.tipo = 'eq.' + tipo;
      var rows = await _sb.get('dati_comuni_posa', params);
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminGetPosa(tipo) {
    return this.getDatiComuniPosa(tipo);
  },

  async adminUpdatePosa(id, data) {
    try {
      var patch = Object.assign({}, data, { updated_at: new Date().toISOString() });
      await _sb.patch('dati_comuni_posa', { id: 'eq.' + id }, patch);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  // ================================================================
  // REVISIONI PARAMETRI
  // ================================================================
  async getRevisioni() {
    try {
      var rows = await _sb.get('revisioni_parametri', { stato: 'eq.attivo', order: 'numero_revisione.desc', select: 'id,numero_revisione,tipo,data_revisione,autore_nome,note,created_at' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async getRevisioneDettaglio(id) {
    try {
      var rows = await _sb.get('revisioni_parametri', { id: 'eq.' + id, select: '*' });
      return rows && rows.length ? this._ok(rows[0]) : this._err({ message: 'Revisione non trovata.' });
    } catch(e) { return this._err(e); }
  },

  async getNumRevisioneCorrente() {
    try {
      var rows = await _sb.get('revisioni_parametri', { stato: 'eq.attivo', order: 'numero_revisione.desc', limit: '1', select: 'numero_revisione' });
      return this._ok(rows && rows.length ? rows[0].numero_revisione : 0);
    } catch(e) { return this._err(e); }
  },

  async adminGetDatiComuniSerr() {
    try { var rows = await _sb.get('dati_comuni_serr', { stato: 'eq.attivo', order: 'id.asc', select: '*' }); return this._ok(rows||[]); } catch(e) { return this._err(e); }
  },

  async creaRevisioneTecnico(aggiornamenti_serr, aggiornamenti_lati, note) {
    // Salva modifiche a dati_comuni_serr e regole_lati + crea revisione con snapshot_tecnico
    try {
      var user = Auth.getUser();
      for (var i = 0; i < aggiornamenti_serr.length; i++) {
        var a = aggiornamenti_serr[i];
        await _sb.patch('dati_comuni_serr', { id: 'eq.' + a.id }, { valore_mm: a.valore_mm, updated_at: new Date().toISOString(), updated_by: user ? user.id : null });
      }
      for (var j = 0; j < aggiornamenti_lati.length; j++) {
        var b = aggiornamenti_lati[j];
        await _sb.patch('regole_lati', { sigla: 'eq.' + b.sigla }, { coprifili_lati: b.coprifili_lati, dinoxill_disponibile: b.dinoxill_disponibile, dinoxill_lati_scelta: b.dinoxill_lati_scelta, updated_by: user ? user.id : null });
      }
      var snapSerr = await _sb.get('dati_comuni_serr', { stato: 'eq.attivo', order: 'id.asc', select: '*' });
      var snapLati = await _sb.get('regole_lati', { order: 'sigla.asc', select: '*' });
      var revRows = await _sb.get('revisioni_parametri', { stato: 'eq.attivo', order: 'numero_revisione.desc', limit: '1', select: 'numero_revisione' });
      var numRev = revRows && revRows.length ? revRows[0].numero_revisione + 1 : 1;
      var revData = {
        numero_revisione: numRev, tipo: 'TECNICO',
        autore_id: user ? user.id : null, autore_nome: user ? user.nome : 'Sistema',
        note: (note||'').trim()||null,
        snapshot_tecnico: { dati_comuni_serr: snapSerr||[], regole_lati: snapLati||[] }
      };
      var inserted = await _sb.post('revisioni_parametri', revData);
      return this._ok({ numero_revisione: numRev, id: inserted[0] ? inserted[0].id : null });
    } catch(e) { return this._err(e); }
  },

  async creaRevisione(aggiornamenti, note) {
    // aggiornamenti = array di { id, h_pos, min_cantiere } — dati modificati dall'admin
    // 1. Applica gli aggiornamenti a dati_comuni_posa
    // 2. Legge snapshot completo aggiornato
    // 3. Calcola numero revisione
    // 4. Inserisce in revisioni_parametri
    // 5. Aggiorna versione_posa_num su rilievi (opzionale — gestito separatamente)
    try {
      var user = Auth.getUser();
      // Step 1: applica aggiornamenti
      for (var i = 0; i < aggiornamenti.length; i++) {
        var a = aggiornamenti[i];
        var patch = { updated_at: new Date().toISOString() };
        if (a.h_pos !== undefined) patch.h_pos = a.h_pos;
        if (a.min_cantiere !== undefined) patch.min_cantiere = a.min_cantiere;
        if (a.h_pos_gru !== undefined) patch.h_pos_gru = a.h_pos_gru;
        await _sb.patch('dati_comuni_posa', { id: 'eq.' + a.id }, patch);
      }
      // Step 2: snapshot completo post-aggiornamento
      var allRows = await _sb.get('dati_comuni_posa', { stato: 'eq.attivo', order: 'tipo.asc,codice.asc,piano.asc,n_campi.asc,sistema.asc', select: '*' });
      // Step 3: numero revisione
      var revRows = await _sb.get('revisioni_parametri', { stato: 'eq.attivo', order: 'numero_revisione.desc', limit: '1', select: 'numero_revisione' });
      var numRev = revRows && revRows.length ? revRows[0].numero_revisione + 1 : 1;
      // Step 4: inserisci revisione
      var revData = {
        numero_revisione: numRev,
        tipo: 'COMPLETO',
        autore_id: user ? user.id : null,
        autore_nome: user ? user.nome : 'Sistema',
        note: (note || '').trim() || null,
        snapshot_posa: allRows || []
      };
      var inserted = await _sb.post('revisioni_parametri', revData);
      return this._ok({ numero_revisione: numRev, id: inserted[0] ? inserted[0].id : null });
    } catch(e) { return this._err(e); }
  },

  async checkVersionePosa(idRilievo) {
    var res = await this.checkVersionePosaRilievo(idRilievo);
    if (res.success) res.aggiornamentoDisponibile = res.data && res.data.aggiornamento;
    return res;
  },

  async aggiornaVersionePosa(idRilievo) {
    var revRes = await this.getNumRevisioneCorrente();
    var numRev = revRes.success ? revRes.data : 1;
    return this.salvaVersionePosaRilievo(idRilievo, numRev);
  },

  async adminNuovaVersionePosa(tipo, n) { return this._ok(null); },

  // Controlla se il rilievo usa una revisione posa obsoleta
  async checkVersionePosaRilievo(idRilievo) {
    try {
      var revRows = await _sb.get('revisioni_parametri', { stato: 'eq.attivo', order: 'numero_revisione.desc', limit: '1', select: 'numero_revisione' });
      var numCorrente = revRows && revRows.length ? revRows[0].numero_revisione : 1;
      var rilRows = await _sb.get('rilievi', { id: 'eq.' + idRilievo, select: 'versione_posa_num' });
      var numRilievo = rilRows && rilRows.length ? (rilRows[0].versione_posa_num || 0) : 0;
      return this._ok({ corrente: numCorrente, rilievo: numRilievo, aggiornamento: numRilievo < numCorrente });
    } catch(e) { return this._err(e); }
  },

  async salvaVersionePosaRilievo(idRilievo, numRev) {
    try {
      await _sb.patch('rilievi', { id: 'eq.' + idRilievo }, { versione_posa_num: numRev });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },
  async adminGetDatiComuni() {
    try { const rows = await _sb.get('dati_comuni_serr', { order: 'id.asc', select: '*' }); return this._ok(rows || []); }
    catch(e) { return this._err(e); }
  },
  async adminUpdateDatiComuni(id, valore) {
    try { const user = Auth.getUser(); await _sb.patch('dati_comuni_serr', { id: 'eq.' + id }, { valore_mm: parseFloat(valore), updated_by: user ? user.id : null }); return this._ok(null); }
    catch(e) { return this._err(e); }
  },
  async adminGetRegoleLati() {
    try { const rows = await _sb.get('regole_lati', { order: 'sigla.asc', select: '*' }); return this._ok(rows || []); }
    catch(e) { return this._err(e); }
  },
  async adminUpdateRegoleLati(sigla, data) {
    try { const user = Auth.getUser(); await _sb.patch('regole_lati', { sigla: 'eq.' + sigla }, Object.assign({}, data, { updated_by: user ? user.id : null })); return this._ok(null); }
    catch(e) { return this._err(e); }
  }
});
