// ================================================================
// FILE: js/layout.js
// PROGETTO: F4 Rilievi - Gestione sidebar hamburger e topbar
// VERSIONE: 2.2 (Guida in stessa scheda, history.back() funzionante)
// ================================================================

const Layout = {

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
        <a href="guida.html"
           style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.82rem;font-weight:500;
                  padding:5px 10px;border:1px solid rgba(255,255,255,.2);border-radius:6px;
                  white-space:nowrap;margin-right:8px;transition:background .2s;"
           onmouseover="this.style.background='rgba(255,255,255,.1)'"
           onmouseout="this.style.background=''">
          &#10067; Guida
        </a>
        <div class="user-avatar" data-user-sigla>${sigla}</div>
        <div class="topbar-menu">
          <button class="topbar-menu-btn" id="userMenuBtn">
            <span data-user-nome>${nome}</span> &#9662;
          </button>
          <div class="topbar-dropdown" id="userMenu">
            <a href="dashboard.html">&#127968; Dashboard</a>
            <a href="clienti.html">&#128101; Clienti</a>
            ${Auth.isAdmin() ? '<a href="admin.html">&#9881;&#65039; Amministrazione</a>' : ''}
            <div class="dd-sep"></div>
            <a href="guida.html">&#10067; Guida utilizzo</a>
            <div class="dd-sep"></div>
            <a href="#" class="dd-danger" onclick="Auth.logout()">&#128682; Esci</a>
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
      { href: 'dashboard.html', icon: '&#127968;', label: 'Dashboard',      id: 'dashboard' },
      { href: 'clienti.html',   icon: '&#128101;', label: 'Clienti',         id: 'clienti'   },
      { sep: true },
      { section: 'RILIEVI' },
      { href: 'clienti.html',   icon: '&#129695;', label: 'Serramenti',      id: 'serramenti' },
      { href: 'clienti.html',   icon: '&#128682;', label: 'Porte Interne',   id: 'porte'      },
    ];

    if (isAdmin) {
      pages.push({ sep: true });
      pages.push({ href: 'admin.html', icon: '&#9881;&#65039;', label: 'Amministrazione', id: 'admin' });
    }

    pages.push({ sep: true });
    pages.push({ href: 'guida.html', icon: '&#10067;', label: 'Guida utilizzo', id: 'guida' });

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

    const topbar = document.getElementById('topbar');
    topbar.insertAdjacentElement('afterend', sidebar);
  },

  _wrapContent() {
    document.body.classList.add('has-layout');
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
    const btn     = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const layout  = document.getElementById('appLayout');

    if (btn && sidebar) {
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
