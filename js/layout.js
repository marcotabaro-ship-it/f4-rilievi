// ================================================================
// FILE: js/layout.js
// PROGETTO: F4 Rilievi - Gestione sidebar hamburger e topbar
// ================================================================
// Include in ogni pagina DOPO auth.js e utils.js
// ================================================================

const Layout = {

  // Pagina corrente (imposta prima di chiamare init)
  currentPage: '',

  init(pageName) {
    this.currentPage = pageName || '';
    this._buildTopbar();
    this._buildSidebar();
    this._wrapContent();
    this._bindEvents();
    Auth.populateUserUI();
  },

  _buildTopbar() {
    const user = Auth.getUser();
    const sigla = user ? (user.sigla || '?') : '?';
    const nome  = user ? (user.nome  || 'Utente') : 'Utente';

    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.id = 'topbar';
    topbar.innerHTML = `
      <button class="sidebar-toggle" id="sidebarToggle" title="Menu">
        <span></span><span></span><span></span>
      </button>
      <a class="topbar-logo" href="dashboard.html">
        <img src="img/Logo_F4.jpg" alt="F4" onerror="this.style.display='none'">
        <span>F4 Rilievi</span>
      </a>
      <div class="topbar-spacer"></div>
      <div class="topbar-user">
        <div class="user-avatar" data-user-sigla>${sigla}</div>
        <div class="topbar-menu">
          <button class="topbar-menu-btn" id="userMenuBtn">
            <span data-user-nome>${nome}</span> ▾
          </button>
          <div class="topbar-dropdown" id="userMenu">
            <a href="dashboard.html">🏠 Dashboard</a>
            <a href="clienti.html">👥 Clienti</a>
            ${Auth.isAdmin() ? '<a href="admin.html">⚙️ Amministrazione</a>' : ''}
            <div class="dd-sep"></div>
            <a href="#" class="dd-danger" onclick="Auth.logout()">🚪 Esci</a>
          </div>
        </div>
      </div>
    `;
    document.body.insertBefore(topbar, document.body.firstChild);
  },

  _buildSidebar() {
    const isAdmin = Auth.isAdmin();

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';

    const pages = [
      { href: 'dashboard.html', icon: '🏠', label: 'Dashboard', id: 'dashboard' },
      { href: 'clienti.html',   icon: '👥', label: 'Clienti',   id: 'clienti' },
      { sep: true },
      { section: 'RILIEVI' },
      { href: 'clienti.html', icon: '🪟', label: 'Serramenti',    id: 'serramenti' },
      { href: 'clienti.html', icon: '🚪', label: 'Porte Interne', id: 'porte' },
    ];

    if (isAdmin) {
      pages.push({ sep: true });
      pages.push({ href: 'admin.html', icon: '⚙️', label: 'Amministrazione', id: 'admin' });
    }

    let html = '<nav class="sidebar-nav">';
    pages.forEach(p => {
      if (p.sep) {
        html += '<div class="sidebar-sep"></div>';
      } else if (p.section) {
        html += `<div class="sidebar-section-label">${p.section}</div>`;
      } else {
        const active = this.currentPage === p.id ? ' active' : '';
        html += `
          <a href="${p.href}" class="${active}">
            <span class="nav-icon">${p.icon}</span>
            <span class="nav-label">${p.label}</span>
          </a>`;
      }
    });
    html += '</nav>';
    sidebar.innerHTML = html;

    // Inserisci dopo topbar
    const topbar = document.getElementById('topbar');
    topbar.insertAdjacentElement('afterend', sidebar);
  },

  _wrapContent() {
    // Aggiungi classe app-layout al body
    document.body.classList.add('has-layout');

    // Il main-content deve avere padding-left giusto
    const main = document.querySelector('.main-content');
    if (main && !main.closest('.app-layout')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'app-layout';
      wrapper.id = 'appLayout';
      main.parentNode.insertBefore(wrapper, main);
      wrapper.appendChild(main);
    }
  },

  _bindEvents() {
    // Toggle sidebar
    const btn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const layout  = document.getElementById('appLayout');

    if (btn && sidebar) {
      // Ripristina stato salvato
      const saved = localStorage.getItem('f4r_sidebar');
      if (saved === 'open') {
        sidebar.classList.add('open');
        if (layout) layout.classList.add('sidebar-open');
      }

      btn.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        if (layout) layout.classList.toggle('sidebar-open', isOpen);
        localStorage.setItem('f4r_sidebar', isOpen ? 'open' : 'closed');
      });
    }

    // User menu
    const userBtn  = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    if (userBtn && userMenu) {
      userBtn.addEventListener('click', e => {
        e.stopPropagation();
        userMenu.classList.toggle('open');
      });
      document.addEventListener('click', () => userMenu.classList.remove('open'));
    }
  }
};
