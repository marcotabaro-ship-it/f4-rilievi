// ================================================================
// FILE: js/utils.js
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// ================================================================
// Funzioni di utilita' condivise tra tutte le pagine.
// ================================================================

const Utils = {

  // --- TOAST / NOTIFICHE ---
  showToast(message, type = 'info', duration = 3500) {
    const existing = document.getElementById('f4r-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'f4r-toast';
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this._toastIcon(type)}</span>
      <span class="toast-msg">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  _toastIcon(type) {
    const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    return icons[type] || 'ℹ';
  },

  showSuccess(msg) { this.showToast(msg, 'success'); },
  showError(msg)   { this.showToast(msg, 'error', 5000); },
  showWarning(msg) { this.showToast(msg, 'warning', 4000); },
  showInfo(msg)    { this.showToast(msg, 'info'); },

  // --- LOADING ---
  showLoading(container, message = 'Caricamento...') {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
  },

  showEmptyState(container, message, icon = '📋') {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <p>${message}</p>
      </div>
    `;
  },

  // --- MODAL ---
  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('modal-open');
      document.body.classList.add('modal-active');
    }
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('modal-open');
      document.body.classList.remove('modal-active');
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal.modal-open').forEach(m => {
      m.classList.remove('modal-open');
    });
    document.body.classList.remove('modal-active');
  },

  // --- FORM ---
  // Legge tutti i campi di un form e restituisce un oggetto
  readForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    const data = {};
    form.querySelectorAll('[name]').forEach(el => {
      const name = el.getAttribute('name');
      if (el.type === 'checkbox') {
        data[name] = el.checked;
      } else {
        data[name] = el.value;
      }
    });
    return data;
  },

  // Popola i campi di un form con i dati di un oggetto
  fillForm(formId, data) {
    const form = document.getElementById(formId);
    if (!form || !data) return;
    form.querySelectorAll('[name]').forEach(el => {
      const name = el.getAttribute('name');
      if (data[name] === undefined || data[name] === null) return;
      if (el.type === 'checkbox') {
        el.checked = data[name] === 'SI' || data[name] === true;
      } else {
        el.value = data[name];
      }
    });
  },

  // Resetta tutti i campi di un form
  resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  },

  // Valida campi obbligatori e mostra errori visivi
  validateRequired(formId, requiredFields) {
    let valid = true;
    requiredFields.forEach(name => {
      const el = document.querySelector(`#${formId} [name="${name}"]`);
      if (!el) return;
      const val = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (!val) {
        el.classList.add('field-error');
        valid = false;
      } else {
        el.classList.remove('field-error');
      }
    });
    return valid;
  },

  // Disabilita/abilita tutti i campi di un form
  setFormDisabled(formId, disabled) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('input,select,textarea,button').forEach(el => {
      el.disabled = disabled;
    });
  },

  // --- DROPDOWN ---
  // Popola un elemento <select> con un array di {value, label}
  fillSelect(selectId, options, emptyLabel = '— Seleziona —', currentValue = null) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const prev = currentValue !== null ? currentValue : sel.value;
    sel.innerHTML = `<option value="">${emptyLabel}</option>`;
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (String(opt.value) === String(prev)) o.selected = true;
      sel.appendChild(o);
    });
  },

  // Svuota e disabilita un select
  clearSelect(selectId, label = '— Prima seleziona —') {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = `<option value="">${label}</option>`;
    sel.disabled = true;
  },

  // Abilita un select
  enableSelect(selectId) {
    const el = document.getElementById(selectId);
    if (el) el.disabled = false;
  },

  // --- FORMATO ---
  formatDate(str) {
    if (!str) return '—';
    return str;
  },

  formatOre(n) {
    const v = parseFloat(n) || 0;
    return v.toFixed(2) + ' h';
  },

  formatMq(n) {
    const v = parseFloat(n) || 0;
    return v.toFixed(2) + ' m²';
  },

  formatMl(n) {
    return (parseInt(n) || 0) + ' ml';
  },

  formatMm(n) {
    return (parseInt(n) || 0) + ' mm';
  },

  // --- URL PARAMS ---
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  buildUrl(base, params = {}) {
    const url = new URL(base, window.location.origin + window.location.pathname.replace(/[^/]*$/, ''));
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) url.searchParams.set(k, v);
    });
    return url.toString();
  },

  navigate(page, params = {}) {
    window.location.href = this.buildUrl(page, params);
  },

  // --- CONFIRM ---
  async confirm(message) {
    return window.confirm(message);
  },

  // --- DEBOUNCE ---
  debounce(fn, delay = 400) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // --- LOCALE ---
  sortByName(arr, field = 'nome') {
    return [...arr].sort((a, b) => String(a[field] || '').localeCompare(String(b[field] || ''), 'it'));
  }
};

// Chiudi modali cliccando lo sfondo
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) Utils.closeAllModals();
  if (e.target.dataset.closeModal) Utils.closeModal(e.target.dataset.closeModal);
});

// Chiudi modali con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Utils.closeAllModals();
});
