// ================================================================
// FILE: js/config.js
// PROGETTO: F4 Rilievi - Frontend GitHub Pages
// ================================================================
// Questo file contiene la configurazione globale dell'app.
// E' il PRIMO file da includere in ogni pagina HTML.
// ================================================================

const APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxZAQn_4lpl_jaFUG4yJOQ8F0uDVZZAHV25XHRfS9avhwNBeFljX6eFU1Twn-fzLo7qCg/exec',
  VERSION: '1.0.0',
  APP_NAME: 'F4 Rilievi Preliminari',
  TOKEN_KEY: 'f4r_token',
  USER_KEY:  'f4r_user',

  // Immagini stratigrafie (percorso relativo dalla root del sito)
  STRAT_IMAGES: {
    'SERR_A': 'img/SerramentiAttaccoMuroA.jpg',
    'SERR_B': 'img/SerramentiAttaccoMuroB.jpg',
    'SERR_C': 'img/SerramentiAttaccoMuroC.jpg',
    'SERR_D': 'img/SerramentiAttaccoMuroD.jpg',
    'SERR_E': 'img/SerramentiAttaccoMuroE.jpg'
  },

  // Immagini porte interne (tipo foro)
  PORTA_IMAGES: {
    'N_H': 'img/PorteIntTipoForoNh.jpg',
    'N_L': 'img/PorteIntTipoForoNl.jpg',
    'P_H': 'img/PorteIntTipoForoPh.jpg',
    'P_L': 'img/PorteIntTipoForoPl.jpg'
  },

  // Immagini accessori (per report)
  ACC_IMAGES: {
    'avvolgibile':   'img/Avvolgibile.jpeg',
    'cassonetto':    'img/Cassonetto_PVC.webp',
    'controtelaio':  'img/Controtelaio_legno.png',
    'frangisole':    'img/Frangisole.jpeg',
    'gru':           'img/Gru.png',
    'posa':          'img/Posa.jpeg',
    'scuretto':      'img/Scuretto.jpeg',
    'tenda_zip':     'img/Tenda_zip.jpeg',
    'termocassa':    'img/Termocassa.jpeg',
    'zanzariera':    'img/Zanzariera.jpeg'
  },

  // Quote per ogni tipo di stratigrafia (lettere presenti nell'immagine)
  STRAT_QUOTE: {
    'SERR_A': ['W','X','Y','Z'],
    'SERR_B': ['W','X','Y','Z','J'],
    'SERR_C': ['W','X','Y','Z','J'],
    'SERR_D': ['W','X','Y','Z','J','Q'],
    'SERR_E': ['W','X','Y','Z','J','Q']
  },

  // Descrizioni lettere per legenda stratigrafie
  STRAT_QUOTE_DESC: {
    'W': 'Strato inferiore (mm)',
    'X': 'Strato intermedio (mm)',
    'Y': 'Strato superiore (mm)',
    'Z': 'Spessore totale muro (mm)',
    'J': 'Profondita\' aletta nel muro (mm)',
    'Q': 'Sporgenza / Sbalzo orizzontale (mm)'
  },

  // Etichette tipo serramento
  TIPO_SERR_LABEL: {
    'I': 'Ingresso', 'F': 'Finestra Apribile',
    'PF': 'Porta Finestra', 'FF': 'Finestra Fissa',
    'VF': 'Vetrata Fissa', 'S': 'Scorrevole'
  },

  // Etichette tipo foro serramento
  TIPO_FORO_SERR_LABEL: {
    'A': 'Architettonico', 'D': 'Dimensione telaio', 'P': 'Posa in luce'
  },

  // Etichette tipo foro porte
  TIPO_FORO_PORTE_LABEL: {
    'N': 'Netta passaggio', 'P': 'Posa in luce'
  },

  // Ruoli che vedono tutti i rilievi
  RUOLI_ACCESSO_TOTALE: [
    'administrator','titolare','responsabile commerciale','ufficio preventivi'
  ],

  // Ruoli che possono modificare le ore
  RUOLI_MODIFICA_ORE: [
    'administrator','titolare','responsabile commerciale','ufficio preventivi'
  ]
};
