// ================================================================
// FILE: js/api.js — PARTE 1/2
// PROGETTO: F4 Rilievi — Frontend GitHub Pages
// VERSIONE: 2.0 (Supabase REST)
// ================================================================
// Tutte le chiamate backend via Supabase REST API (PostgREST).
// NON usa il client JS @supabase/supabase-js — usa fetch() nativo.
// Non richiedere modifiche ai file HTML esistenti.
//
// MAPPATURA NOMI CAMPO:
//   Supabase (snake_case)  →  HTML atteso (vecchio formato GAS)
//   id                     →  ID_cliente / ID_cantiere / etc.
//   id_cliente             →  ID_cliente
//   h_mm                   →  H_mm
//   l_mm                   →  L_mm
// ================================================================

// ================================================================
// CORE HTTP — tutte le richieste Supabase passano da qui
// ================================================================
const _sb = {

  // Headers standard per ogni richiesta
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

  // Costruisce URL con parametri PostgREST
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

  // Richiesta generica con gestione auto-refresh token
  async _req(method, url, body, extraHeaders) {
    const doFetch = (tok) => fetch(url, {
      method:  method,
      headers: this._headers(Object.assign({}, extraHeaders, tok ? {'Authorization': 'Bearer ' + tok} : {})),
      body:    body !== undefined ? JSON.stringify(body) : undefined
    });

    let res = await doFetch(Auth.getToken());

    // 401 → prova refresh token una volta
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

  // Shorthand methods
  async get(table, params, headers)       { return this._req('GET',    this._url(table, params), undefined, headers); },
  async post(table, body, headers)        { return this._req('POST',   this._url(table), body, Object.assign({'Prefer':'return=representation'}, headers)); },
  async patch(table, params, body)        { return this._req('PATCH',  this._url(table, params), body, {'Prefer':'return=representation'}); },
  async delete_(table, params)            { return this._req('DELETE', this._url(table, params)); },

  // Chiama Supabase Auth endpoint
  async authPost(path, body) {
    const res = await fetch(APP_CONFIG.SUPABASE_URL + '/auth/v1' + path, {
      method:  'POST',
      headers: {
        'apikey':       APP_CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Errore auth');
    return data;
  },

  // Chiama Edge Function admin
  async adminCall(action, payload) {
    const token = Auth.getToken();
    if (!token) throw new Error('Non autenticato.');
    const res = await fetch(
      APP_CONFIG.SUPABASE_URL + '/functions/v1/admin-users',
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ action, payload })
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore admin');
    return data;
  }
};

// ================================================================
// FIELD MAPPERS — converte i nomi campo Supabase nel formato
// atteso dal codice HTML esistente (formato vecchio GAS)
// ================================================================
const _map = {

  cliente(row) {
    if (!row) return null;
    return {
      ID_cliente: row.id,
      nome:       row.nome,
      telefono:   row.telefono  || '',
      email:      row.email     || '',
      note:       row.note      || '',
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
      stato:                    row.stato
    };
  },

  posPorta(row) {
    if (!row) return null;
    return {
      ID_pos:               row.id,
      ID_rilievo:           row.id_rilievo,
      numero_pos:           row.numero_pos,
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
      stato:                row.stato
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

  // Converti i datiComuni da array in dizionario {id: valore}
  // Compatibile con il codice esistente che usa datiComuni[4], [5], ecc.
  datiComuni(rows) {
    const dict = {};
    (rows || []).forEach(r => {
      if (r) dict[parseInt(r.id)] = parseFloat(r.valore_mm) || 0;
    });
    return dict;
  },

  // Converti regole_lati da array in dizionario {sigla: row}
  regoleLati(rows) {
    const dict = {};
    (rows || []).forEach(r => {
      if (r && r.sigla) dict[r.sigla] = r;
    });
    return dict;
  }
};

// ================================================================
// INPUT MAPPERS — converte i dati HTML → formato Supabase
// ================================================================
const _in = {

  rilievo(data) {
    return {
      id_cantiere:    data.ID_cantiere,
      tipo:           data.tipo,
      referente:      data.referente      || null,
      data_rilievo:   data.data_rilievo   || null,
      data_posa:      data.data_posa      || null,
      intervento:     data.intervento     || null,
      gru:            data.gru === 'SI',
      versione_posa:  data.versione_posa  || null,
      note:           data.note           || null
    };
  },

  posSerr(data) {
    return {
      id_rilievo:               data.ID_rilievo,
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
      id_stratigrafia_override: data.ID_stratigrafia_override || null
    };
  },

  posPorta(data) {
    const b = v => v === 'SI' || v === true;
    return {
      id_rilievo:           data.ID_rilievo,
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
// API — oggetto principale (stesso nome del vecchio api.js)
// ================================================================
const API = {

  _ok(data)  { return { success: true,  data }; },
  _err(e)    {
    const msg = (e && e.message) ? e.message : String(e);
    console.error('API error:', msg);
    return { success: false, error: msg };
  },

  // ================================================================
  // AUTH / SESSIONE
  // ================================================================

  async login(email, password) {
    try {
      // 1. Login Supabase Auth
      const authData = await _sb.authPost(
        '/token?grant_type=password',
        { email: email.trim(), password }
      );
      // 2. Legge profilo dalla tabella utenti
      const rows = await _sb._req(
        'GET',
        _sb._url('utenti', { auth_uid: 'eq.' + authData.user.id, stato: 'eq.attivo', select: '*' }),
        undefined,
        { 'Authorization': 'Bearer ' + authData.access_token }
      );
      if (!rows || !rows.length) {
        // Logout da Supabase (il token non ci serve)
        return { success: false, error: 'Utente non abilitato. Contatta l amministratore.' };
      }
      const profile = rows[0];
      const user = {
        id:      profile.id,
        email:   profile.email,
        nome:    profile.nome,
        ruolo:   profile.ruolo,
        sigla:   profile.sigla   || '',
        reparto: profile.reparto || ''
      };
      Auth.saveSession(authData.access_token, authData.refresh_token, user);
      return { success: true, token: authData.access_token, user };
    } catch(e) {
      let msg = e.message || 'Errore di accesso.';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials'))
        msg = 'Email o password non corretti.';
      return this._err({ message: msg });
    }
  },

  async logout() {
    await Auth.logout();
    return { success: true };
  },

  async getCurrentUser() {
    return this._ok(Auth.getUser());
  },

  // ================================================================
  // LOOKUP — singola tabella
  // ================================================================
  async getLookup(table) {
    try {
      const tableName = table.toLowerCase();
      const rows = await _sb.get(tableName, { stato: 'eq.attivo', order: 'id.asc' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  // Ritorna piu lookup in parallelo come oggetto { LK_NOME: [...] }
  async getLookupMulti(tables) {
    try {
      const results = await Promise.all(tables.map(t => this.getLookup(t)));
      const out = {};
      tables.forEach((t, i) => {
        out[t] = results[i].success ? results[i].data : [];
      });
      return { success: true, data: out };
    } catch(e) { return this._err(e); }
  },

  async getDatiComuni() {
    try {
      const rows = await _sb.get('dati_comuni_serr', { stato: 'eq.attivo', order: 'id.asc' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async getRegoleLati() {
    try {
      const rows = await _sb.get('regole_lati', { stato: 'eq.attivo', order: 'sigla.asc' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  // ================================================================
  // COMUNI — autocomplete
  // ================================================================
  async getComuni(query) {
    if (!query || query.length < 2) return this._ok([]);
    try {
      // Usa la tabella lk_indirizzo in Supabase (14.480 comuni italiani)
      const rows = await _sb.get('lk_indirizzo', {
        comune:  'ilike.' + query + '*',
        order:   'comune.asc',
        limit:   '12',
        select:  'comune,provincia,cap'
      });
      const data = (rows || []).map(r => ({
        comune:    r.comune    || '',
        provincia: r.provincia || '',
        CAP:       r.cap       || ''
      }));
      return this._ok(data);
    } catch(e) { return this._ok([]); }
  },

  // ================================================================
  // CLIENTI
  // ================================================================
  async getClienti() {
    try {
      const rows = await _sb.get('clienti', {
        stato:  'neq.archiviato',
        order:  'nome.asc',
        select: '*'
      });
      return this._ok((rows || []).map(_map.cliente));
    } catch(e) { return this._err(e); }
  },

  async getCliente(id) {
    try {
      const rows = await _sb.get('clienti', { id: 'eq.' + id, select: '*' });
      return rows && rows.length ? this._ok(_map.cliente(rows[0])) : this._err({ message: 'Cliente non trovato.' });
    } catch(e) { return this._err(e); }
  },

  async createCliente(data) {
    try {
      const user = Auth.getUser();
      const rows = await _sb.post('clienti', {
        nome:             data.nome,
        telefono:         data.telefono || null,
        email:            data.email    || null,
        note:             data.note     || null,
        utente_creazione: user ? user.id : null
      });
      return this._ok(_map.cliente(rows[0]));
    } catch(e) { return this._err(e); }
  },

  async updateCliente(id, data) {
    try {
      const rows = await _sb.patch('clienti', { id: 'eq.' + id }, {
        nome:     data.nome,
        telefono: data.telefono || null,
        email:    data.email    || null,
        note:     data.note     || null
      });
      return this._ok(_map.cliente((rows || [])[0]));
    } catch(e) { return this._err(e); }
  },

  async toggleStatoCliente(id) {
    try {
      const rows = await _sb.get('clienti', { id: 'eq.' + id, select: 'stato' });
      if (!rows || !rows.length) throw new Error('Cliente non trovato.');
      const nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo';
      await _sb.patch('clienti', { id: 'eq.' + id }, { stato: nuovoStato });
      return this._ok({ stato: nuovoStato });
    } catch(e) { return this._err(e); }
  },

  async toggleCliente(id) { return this.toggleStatoCliente(id); },

  // ================================================================
  // CANTIERI — albero con figli
  // ================================================================

  // Restituisce l albero dei cantieri per un cliente
  async getAlberoCliente(idCliente) {
    try {
      const rows = await _sb.get('cantieri', {
        id_cliente: 'eq.' + idCliente,
        select:     '*',
        order:      'nome_cantiere.asc'
      });
      const tree = _buildTree(rows || []);
      return this._ok(tree);
    } catch(e) { return this._err(e); }
  },

  async getAlbero(idCliente)   { return this.getAlberoCliente(idCliente); },
  async getCantieri(idCliente) { return this.getAlberoCliente(idCliente); },

  async getCantiere(id) {
    try {
      const rows = await _sb.get('cantieri', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Cantiere non trovato.');
      return this._ok(_map.cantiere(rows[0]));
    } catch(e) { return this._err(e); }
  },

  async createCantiere(data) {
    try {
      const user = Auth.getUser();
      const rows = await _sb.post('cantieri', {
        id_cliente:    data.ID_cliente,
        id_parent:     data.ID_parent     || null,
        nome_cantiere: data.nome_cantiere,
        tipo_via:      data.tipo_via      || null,
        indirizzo:     data.indirizzo     || null,
        comune:        data.comune        || null,
        provincia:     data.provincia     || null,
        cap:           data.CAP           || null,
        note:          data.note          || null,
        utente_creazione: user ? user.id : null
      });
      return this._ok(_map.cantiere(rows[0]));
    } catch(e) { return this._err(e); }
  },

  async updateCantiere(id, data) {
    try {
      const rows = await _sb.patch('cantieri', { id: 'eq.' + id }, {
        id_parent:     data.ID_parent     || null,
        nome_cantiere: data.nome_cantiere,
        tipo_via:      data.tipo_via      || null,
        indirizzo:     data.indirizzo     || null,
        comune:        data.comune        || null,
        provincia:     data.provincia     || null,
        cap:           data.CAP           || null,
        note:          data.note          || null
      });
      return this._ok(_map.cantiere((rows || [])[0]));
    } catch(e) { return this._err(e); }
  },

  async toggleStatoCantiere(id) {
    try {
      const rows = await _sb.get('cantieri', { id: 'eq.' + id, select: 'stato' });
      if (!rows || !rows.length) throw new Error('Cantiere non trovato.');
      const nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo';
      await _sb.patch('cantieri', { id: 'eq.' + id }, { stato: nuovoStato });
      return this._ok({ stato: nuovoStato });
    } catch(e) { return this._err(e); }
  },

  async deleteCantiere(id) { return this.toggleStatoCantiere(id); },

  // ================================================================
  // RILIEVI
  // ================================================================

  async getRilieviCantiere(idCantiere) {
    try {
      const rows = await _sb.get('rilievi', {
        id_cantiere: 'eq.' + idCantiere,
        stato:       'neq.archiviato',
        order:       'codice_completo.asc',
        select:      '*'
      });
      return this._ok((rows || []).map(r => _map.rilievo(r)));
    } catch(e) { return this._err(e); }
  },

  async getRilievi(idCantiere) { return this.getRilieviCantiere(idCantiere); },

  async getRilievo(id) {
    try {
      const rows = await _sb.get('rilievi', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Rilievo non trovato.');
      const ril = rows[0];
      // Carica il percorso cantiere
      const cantPath = await _getCantierePath(ril.id_cantiere);
      return this._ok(_map.rilievo(ril, cantPath));
    } catch(e) { return this._err(e); }
  },

  async createRilievo(data) {
    try {
      const user = Auth.getUser();
      // Genera codice R00C00
      const existing = await _sb.get('rilievi', {
        id_cantiere: 'eq.' + data.ID_cantiere,
        tipo:        'eq.' + data.tipo,
        select:      'revisione,copia'
      });
      const codice = _nextCodice(existing || [], null, null, data.tipo);
      const rows = await _sb.post('rilievi', Object.assign(
        _in.rilievo(data),
        {
          revisione:        codice.revisione,
          copia:            codice.copia,
          codice_completo:  codice.codice,
          versione_posa:    1,
          utente_creazione: user ? user.id : null
        }
      ));
      const created = rows[0];
      return { success: true, id: created.id, codice: created.codice_completo };
    } catch(e) { return this._err(e); }
  },

  async updateRilievo(id, data) {
    try {
      const patch = {};
      if (data.referente   !== undefined) patch.referente     = data.referente    || null;
      if (data.intervento  !== undefined) patch.intervento    = data.intervento   || null;
      if (data.data_rilievo!== undefined) patch.data_rilievo  = data.data_rilievo || null;
      if (data.data_posa   !== undefined) patch.data_posa     = data.data_posa    || null;
      if (data.gru         !== undefined) patch.gru           = data.gru === 'SI';
      if (data.note        !== undefined) patch.note          = data.note         || null;
      if (data.versione_posa !== undefined) patch.versione_posa = data.versione_posa;
      await _sb.patch('rilievi', { id: 'eq.' + id }, patch);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async cloneRilievo(id, tipoClone) {
    try {
      const rows = await _sb.get('rilievi', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Rilievo non trovato.');
      const orig = rows[0];
      const user = Auth.getUser();
      // Calcola nuovo codice
      const existing = await _sb.get('rilievi', {
        id_cantiere: 'eq.' + orig.id_cantiere,
        tipo:        'eq.' + orig.tipo,
        select:      'revisione,copia'
      });
      const codice = _nextCodice(existing || [], tipoClone, orig, orig.tipo);
      const newRows = await _sb.post('rilievi', {
        id_cantiere:      orig.id_cantiere,
        tipo:             orig.tipo,
        revisione:        codice.revisione,
        copia:            codice.copia,
        codice_completo:  codice.codice,
        id_origine:       orig.id,
        tipo_clone:       tipoClone,
        referente:        orig.referente,
        data_rilievo:     orig.data_rilievo,
        data_posa:        orig.data_posa,
        intervento:       orig.intervento,
        gru:              orig.gru,
        versione_posa:    orig.versione_posa,
        note:             orig.note,
        utente_creazione: user ? user.id : null
      });
      const created = newRows[0];
      // Copia posizioni
      await _clonePosizioni(id, created.id, orig.tipo);
      return { success: true, id: created.id, codice: created.codice_completo };
    } catch(e) { return this._err(e); }
  },

  async deleteRilievo(id) {
    try {
      await _sb.patch('rilievi', { id: 'eq.' + id }, { stato: 'archiviato' });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  // Versione posa
  async checkVersionePosa(idRilievo) {
    try {
      const rilRows = await _sb.get('rilievi', { id: 'eq.' + idRilievo, select: 'versione_posa,tipo' });
      if (!rilRows || !rilRows.length) throw new Error('Rilievo non trovato.');
      const ril = rilRows[0];
      const tablePosa = ril.tipo === 'SERR' ? 'dati_posa_serr' : 'dati_posa_porte';
      const posRows = await _sb.get(tablePosa, {
        stato:  'eq.attivo',
        order:  'versione.desc',
        limit:  '1',
        select: 'versione'
      });
      const curVer = posRows && posRows[0] ? parseInt(posRows[0].versione) : 1;
      const rilVer = parseInt(ril.versione_posa) || 0;
      return { success: true, aggiornamentoDisponibile: rilVer < curVer, versioneAttuale: curVer };
    } catch(e) { return this._err(e); }
  },

  async aggiornaVersionePosa(idRilievo) {
    try {
      const rilRows = await _sb.get('rilievi', { id: 'eq.' + idRilievo, select: 'tipo' });
      if (!rilRows || !rilRows.length) throw new Error('Rilievo non trovato.');
      const tablePosa = rilRows[0].tipo === 'SERR' ? 'dati_posa_serr' : 'dati_posa_porte';
      const posRows = await _sb.get(tablePosa, {
        stato: 'eq.attivo', order: 'versione.desc', limit: '1', select: 'versione'
      });
      const curVer = posRows && posRows[0] ? parseInt(posRows[0].versione) : 1;
      await _sb.patch('rilievi', { id: 'eq.' + idRilievo }, { versione_posa: curVer });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  }
};

// ================================================================
// HELPERS INTERNI (non esposti come API)
// ================================================================

// Costruisce albero cantieri da lista flat
function _buildTree(rows) {
  const map = {};
  const roots = [];
  rows.forEach(r => { map[r.id] = Object.assign(_map.cantiere(r), { figli: [] }); });
  rows.forEach(r => {
    if (r.id_parent && map[r.id_parent]) {
      map[r.id_parent].figli.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });
  // Aggiunge breadcrumb
  function addBreadcrumb(node, prefix) {
    node.breadcrumb = prefix ? prefix + ' / ' + node.nome_cantiere : node.nome_cantiere;
    node.figli.forEach(f => addBreadcrumb(f, node.breadcrumb));
  }
  roots.forEach(r => addBreadcrumb(r, ''));
  return roots;
}

// Carica il percorso cantiere per la testata del rilievo
async function _getCantierePath(idCantiere) {
  try {
    const [cantRows, clientiMap] = await Promise.all([
      _sb.get('cantieri', { id: 'eq.' + idCantiere, select: '*' }),
      null
    ]);
    if (!cantRows || !cantRows.length) return null;
    const cant = cantRows[0];
    const clienteRows = await _sb.get('clienti', { id: 'eq.' + cant.id_cliente, select: 'nome' });
    const nomeCliente = clienteRows && clienteRows[0] ? clienteRows[0].nome : '';
    return {
      nomeCliente: nomeCliente,
      breadcrumb:  cant.nome_cantiere
    };
  } catch(e) { return null; }
}

// Calcola il prossimo codice rilievo — formato: {TIPO}-R{rev:02}C{cop:02}
// es. SERR-R00C00, PORTE-R01C00
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
  // REVISIONE: incrementa revisione, azzera copia
  const usedRev = existing.map(r => r.revisione);
  return mk(Math.max(...usedRev, -1) + 1, 0);
}

// Copia le posizioni da un rilievo a un altro (per clone)
async function _clonePosizioni(idOrigine, idDestinazione, tipo) {
  try {
    const table = tipo === 'SERR' ? 'posizioni_serr' : 'posizioni_porte';
    const user = Auth.getUser();
    const rows = await _sb.get(table, {
      id_rilievo: 'eq.' + idOrigine,
      stato:      'eq.attivo',
      select:     '*'
    });
    if (!rows || !rows.length) return;
    const copies = rows.map(r => {
      const copy = Object.assign({}, r);
      delete copy.id;
      delete copy.created_at;
      delete copy.updated_at;
      copy.id_rilievo = idDestinazione;
      copy.utente_creazione = user ? user.id : null;
      return copy;
    });
    // Inserisce a batch
    for (const c of copies) {
      await _sb.post(table, c);
    }
  } catch(e) {
    console.error('Errore clone posizioni:', e);
  }
}

// ================================================================
// FINE PARTE 1/2 — continua in api_p2.js
// ================================================================
// ================================================================
// FILE: js/api.js — PARTE 2/2
// Continuazione di api_p1.js
// Incollare subito DOPO il contenuto di api_p1.js
// ================================================================

// Aggiunge i metodi rimanenti all oggetto API gia definito in api_p1.js
Object.assign(API, {

  // ================================================================
  // STRATIGRAFIE
  // ================================================================

  async getStratigrafie(idRilievo) {
    try {
      const rows = await _sb.get('stratigrafie', {
        id_rilievo: 'eq.' + idRilievo,
        stato:      'eq.attivo',
        order:      'ordine.asc,created_at.asc',
        select:     '*'
      });
      return this._ok((rows || []).map(_map.stratigrafia));
    } catch(e) { return this._err(e); }
  },

  async createStratigrafia(data) {
    try {
      const user = Auth.getUser();
      const rows = await _sb.post('stratigrafie', {
        id_rilievo:   data.ID_rilievo,
        nome:         data.nome,
        immagine_ref: data.immagine_ref || null,
        quote_json:   data.quote_json   || null,
        is_default:   data.is_default   || false,
        ordine:       data.ordine       || 0,
        utente_creazione: user ? user.id : null
      });
      return this._ok(_map.stratigrafia(rows[0]));
    } catch(e) { return this._err(e); }
  },

  async updateStratigrafia(id, data) {
    try {
      const patch = {};
      if (data.nome         !== undefined) patch.nome         = data.nome;
      if (data.immagine_ref !== undefined) patch.immagine_ref = data.immagine_ref || null;
      if (data.quote_json   !== undefined) patch.quote_json   = data.quote_json   || null;
      if (data.ordine       !== undefined) patch.ordine       = data.ordine;
      await _sb.patch('stratigrafie', { id: 'eq.' + id }, patch);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async deleteStratigrafia(id) {
    try {
      await _sb.patch('stratigrafie', { id: 'eq.' + id }, { stato: 'disattivo' });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async setDefaultStratigrafia(id, idRilievo) {
    try {
      // Rimuove default da tutte le stratigrafie del rilievo
      await _sb.patch('stratigrafie', { id_rilievo: 'eq.' + idRilievo }, { is_default: false });
      // Imposta il nuovo default
      await _sb.patch('stratigrafie', { id: 'eq.' + id }, { is_default: true });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async setDefaultStrat(id, idRilievo) { return this.setDefaultStratigrafia(id, idRilievo); },

  // ================================================================
  // POSIZIONI SERRAMENTI
  // ================================================================

  async getPosizioniSerr(idRilievo) {
    try {
      const rows = await _sb.get('posizioni_serr', {
        id_rilievo: 'eq.' + idRilievo,
        stato:      'eq.attivo',
        order:      'numero_pos.asc',
        select:     '*'
      });
      return this._ok((rows || []).map(_map.posSerr));
    } catch(e) { return this._err(e); }
  },

  async createPosizioneSerr(data) {
    try {
      const user = Auth.getUser();
      // Calcola il prossimo numero_pos
      const existing = await _sb.get('posizioni_serr', {
        id_rilievo: 'eq.' + data.ID_rilievo,
        stato:      'eq.attivo',
        select:     'numero_pos',
        order:      'numero_pos.desc',
        limit:      '1'
      });
      const nextPos = existing && existing.length ? (existing[0].numero_pos + 1) : 1;
      const rows = await _sb.post('posizioni_serr', Object.assign(
        _in.posSerr(data),
        { numero_pos: nextPos, utente_creazione: user ? user.id : null }
      ));
      const created = rows[0];
      return { success: true, id: created.id, numero_pos: created.numero_pos };
    } catch(e) { return this._err(e); }
  },

  async updatePosizioneSerr(id, data) {
    try {
      const patch = _in.posSerr(data);
      delete patch.id_rilievo;   // non aggiornare la FK
      delete patch.numero_pos;   // non aggiornare il numero
      await _sb.patch('posizioni_serr', { id: 'eq.' + id }, patch);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async deletePosizioneSerr(id) {
    try {
      await _sb.patch('posizioni_serr', { id: 'eq.' + id }, { stato: 'eliminato' });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async copyPosizioneSerr(id, count) {
    try {
      const rows = await _sb.get('posizioni_serr', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Posizione non trovata.');
      const orig = rows[0];
      const user = Auth.getUser();
      // Trova l ultimo numero_pos nel rilievo
      const last = await _sb.get('posizioni_serr', {
        id_rilievo: 'eq.' + orig.id_rilievo,
        stato:      'eq.attivo',
        select:     'numero_pos',
        order:      'numero_pos.desc',
        limit:      '1'
      });
      let nextPos = last && last.length ? last[0].numero_pos + 1 : 1;
      const n = parseInt(count) || 1;
      for (let i = 0; i < n; i++) {
        const copy = Object.assign({}, orig);
        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;
        copy.numero_pos       = nextPos++;
        copy.utente_creazione = user ? user.id : null;
        await _sb.post('posizioni_serr', copy);
      }
      return this._ok({ copiati: n });
    } catch(e) { return this._err(e); }
  },

  // ================================================================
  // POSIZIONI PORTE
  // ================================================================

  async getPosizioniPorte(idRilievo) {
    try {
      const rows = await _sb.get('posizioni_porte', {
        id_rilievo: 'eq.' + idRilievo,
        stato:      'eq.attivo',
        order:      'numero_pos.asc',
        select:     '*'
      });
      return this._ok((rows || []).map(_map.posPorta));
    } catch(e) { return this._err(e); }
  },

  async createPosizionePorta(data) {
    try {
      const user = Auth.getUser();
      const existing = await _sb.get('posizioni_porte', {
        id_rilievo: 'eq.' + data.ID_rilievo,
        stato:      'eq.attivo',
        select:     'numero_pos',
        order:      'numero_pos.desc',
        limit:      '1'
      });
      const nextPos = existing && existing.length ? (existing[0].numero_pos + 1) : 1;
      const rows = await _sb.post('posizioni_porte', Object.assign(
        _in.posPorta(data),
        { numero_pos: nextPos, utente_creazione: user ? user.id : null }
      ));
      const created = rows[0];
      return { success: true, id: created.id, numero_pos: created.numero_pos };
    } catch(e) { return this._err(e); }
  },

  async updatePosizionePorta(id, data) {
    try {
      const patch = _in.posPorta(data);
      delete patch.id_rilievo;
      delete patch.numero_pos;
      await _sb.patch('posizioni_porte', { id: 'eq.' + id }, patch);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async deletePosizionePorta(id) {
    try {
      await _sb.patch('posizioni_porte', { id: 'eq.' + id }, { stato: 'eliminato' });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async copyPosizionePorta(id, count) {
    try {
      const rows = await _sb.get('posizioni_porte', { id: 'eq.' + id, select: '*' });
      if (!rows || !rows.length) throw new Error('Posizione non trovata.');
      const orig = rows[0];
      const user = Auth.getUser();
      const last = await _sb.get('posizioni_porte', {
        id_rilievo: 'eq.' + orig.id_rilievo,
        stato:      'eq.attivo',
        select:     'numero_pos',
        order:      'numero_pos.desc',
        limit:      '1'
      });
      let nextPos = last && last.length ? last[0].numero_pos + 1 : 1;
      const n = parseInt(count) || 1;
      for (let i = 0; i < n; i++) {
        const copy = Object.assign({}, orig);
        delete copy.id;
        delete copy.created_at;
        delete copy.updated_at;
        copy.numero_pos       = nextPos++;
        copy.utente_creazione = user ? user.id : null;
        await _sb.post('posizioni_porte', copy);
      }
      return this._ok({ copiati: n });
    } catch(e) { return this._err(e); }
  },

  // ================================================================
  // ORE POSA
  // ================================================================

  async aggiornaOre(idRilievo, servizio, delta, note) {
    try {
      const user = Auth.getUser();
      await _sb.post('log_ore', {
        id_rilievo: idRilievo,
        servizio:   servizio,
        val_pre:    null,
        val_post:   delta,
        utente:     user ? user.id : null,
        note:       note || null
      });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async getLogOre(idRilievo) {
    try {
      const rows = await _sb.get('log_ore', {
        id_rilievo: 'eq.' + idRilievo,
        order:      'ts.desc',
        select:     '*'
      });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  // ================================================================
  // DB SERRAMENTO / PORTE
  // ================================================================

  async getDbSerramento() {
    try {
      const rows = await _sb.get('db_serramento', {
        stato:  'eq.attivo',
        order:  'codice.asc',
        select: '*'
      });
      return this._ok((rows || []).map(r => ({
        codice:             r.codice,
        materiale:          r.materiale,
        materiale_sigla:    r.materiale_sigla,
        descrizione:        r.descrizione  || '',
        stile_design:       r.stile_design || '',
        variante_telaio:    r.variante_telaio || '',
        telaio_nascosto_mm: r.telaio_nascosto_mm || 0,
        aletta_mm:          r.aletta_mm || 0,
        stato:              r.stato
      })));
    } catch(e) { return this._err(e); }
  },

  async addDbSerrRecord(data) {
    try {
      const rows = await _sb.post('db_serramento', data);
      return this._ok(rows[0]);
    } catch(e) { return this._err(e); }
  },

  async updateDbSerrRecord(codice, data) {
    try {
      await _sb.patch('db_serramento', { codice: 'eq.' + codice }, data);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async getDbPorte() {
    try {
      const rows = await _sb.get('db_porte', {
        stato:  'eq.attivo',
        order:  'codice.asc',
        select: '*'
      });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async updateDbPorteRecord(codice, data) {
    try {
      await _sb.patch('db_porte', { codice: 'eq.' + codice }, data);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  // ================================================================
  // ADMIN — lookup CRUD
  // ================================================================

  async adminGetLookup(table) {
    try {
      const rows = await _sb.get(table.toLowerCase(), { order: 'id.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminAddLookup(table, data) {
    try {
      const rows = await _sb.post(table.toLowerCase(), data);
      return this._ok(rows[0]);
    } catch(e) { return this._err(e); }
  },

  async adminUpdateLookup(table, rowId, data) {
    try {
      await _sb.patch(table.toLowerCase(), { id: 'eq.' + rowId }, data);
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async adminToggleLookup(table, id) {
    try {
      const rows = await _sb.get(table.toLowerCase(), { id: 'eq.' + id, select: 'stato' });
      if (!rows || !rows.length) throw new Error('Record non trovato.');
      const nuovoStato = rows[0].stato === 'attivo' ? 'disattivo' : 'attivo';
      await _sb.patch(table.toLowerCase(), { id: 'eq.' + id }, { stato: nuovoStato });
      return this._ok({ stato: nuovoStato });
    } catch(e) { return this._err(e); }
  },

  async adminGetDatiComuni() {
    try {
      const rows = await _sb.get('dati_comuni_serr', { order: 'id.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminUpdateDatiComuni(id, valore) {
    try {
      const user = Auth.getUser();
      await _sb.patch('dati_comuni_serr', { id: 'eq.' + id }, {
        valore_mm:  parseFloat(valore),
        updated_by: user ? user.id : null
      });
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async adminGetRegoleLati() {
    try {
      const rows = await _sb.get('regole_lati', { order: 'sigla.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminUpdateRegoleLati(sigla, data) {
    try {
      const user = Auth.getUser();
      await _sb.patch('regole_lati', { sigla: 'eq.' + sigla },
        Object.assign({}, data, { updated_by: user ? user.id : null })
      );
      return this._ok(null);
    } catch(e) { return this._err(e); }
  },

  async adminGetUtenti() {
    try {
      const rows = await _sb.get('utenti', { order: 'nome.asc', select: '*' });
      return this._ok(rows || []);
    } catch(e) { return this._err(e); }
  },

  async adminGetPosa(tipo) {
    // TODO: implementare dopo aver visto la struttura DATI_POSA_SERR/PORTE
    return this._ok([]);
  },

  async adminUpdatePosa(tipo, id, data) {
    // TODO: da implementare
    return this._ok(null);
  },

  async adminNuovaVersionePosa(tipo, note) {
    // TODO: da implementare
    return this._ok(null);
  },

  // ================================================================
  // getInitData — chiamata composita usata da rilievo_serr.html
  // Sostituisce la singola chiamata GAS con chiamate parallele.
  // ================================================================
  async getInitData(idRilievo) {
    if (!idRilievo) return this._err({ message: 'ID rilievo mancante.' });
    try {
      const LOOKUP_TABLES = [
        'LK_REFERENTI','LK_INTERVENTO','LK_TIPO_SERR','LK_TIPO_FORO_SERR',
        'LK_SCHERMATURA','LK_COPRIFILI','LK_CASSONETTO','LK_CONTROTELAIO',
        'LK_ZANZARIERA','LK_DINOXILL','LK_OSCURANTE','LK_COLORI',
        'LK_SENSI_APERTURA','LK_N_CAMPI','LK_PIANO','LK_VETRO',
        'LK_TIPO_PORTA','LK_SISTEMA_PORTE','LK_TIPO_FORO_PORTE','LK_FORNITORE_PORTE'
      ];

      // Tutte le chiamate in parallelo
      const [rilRes, lookupRes, dcRes, rlRes, dbRes] = await Promise.all([
        this.getRilievo(idRilievo),
        this.getLookupMulti(LOOKUP_TABLES),
        this.getDatiComuni(),
        this.getRegoleLati(),
        this.getDbSerramento()
      ]);

      if (!rilRes.success) {
        return { success: false, data: { rilievoError: rilRes.error } };
      }

      return {
        success: true,
        data: {
          rilievo:      rilRes.data,
          lookups:      lookupRes.success ? lookupRes.data : {},
          datiComuni:   dcRes.success  ? dcRes.data  : [],
          regoleLati:   rlRes.success  ? rlRes.data  : [],
          dbSerramento: dbRes.success  ? dbRes.data  : []
        }
      };
    } catch(e) { return this._err(e); }
  },

  // Stub per compatibilita (non usato nel nuovo stack)
  async calcolaDimensioniTelaio(pos)   { return this._ok({}); },
  async calcolaAccessoriPosizione(pos) { return this._ok({}); },
  async calcolaReportAccessori(id)     { return this._ok({}); },
  async calcolaReportPosa(id, tipo)    { return this._ok({}); }
});

// ================================================================
// FINE api.js
// ================================================================
