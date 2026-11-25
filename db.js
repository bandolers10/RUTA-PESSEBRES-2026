/**
 * Base de Dades per Ruta dels Pessebres 2026
 * - Mode Producció (per defecte): Pàgina en blanc (0 pessebres, 0 participants, 0 visites) sincronitzada amb Supabase.
 * - Mode Demo (/demo, demo.html o ?demo=1): Simulació realista amb 50 pessebres i 200 participants d'arreu de Catalunya.
 */

const IS_DEMO_MODE = Boolean(
  window.PESSEBRES_DEMO_MODE ||
  window.location.pathname.toLowerCase().includes('/demo') ||
  window.location.pathname.toLowerCase().endsWith('demo.html') ||
  new URLSearchParams(window.location.search).has('demo') ||
  window.location.hash.toLowerCase().includes('demo')
);

window.IS_DEMO_MODE = IS_DEMO_MODE;

const DB_KEYS = IS_DEMO_MODE
  ? {
      USERS: 'pessebres_2026_demo_users_v4',
      POINTS: 'pessebres_2026_demo_points_v4',
      VISITS: 'pessebres_2026_demo_visits_v4',
      CURRENT_USER: 'pessebres_2026_demo_current_user_v4',
      GEOCACHE: 'pessebres_2026_muni_geocache'
    }
  : {
      USERS: 'pessebres_2026_users',
      POINTS: 'pessebres_2026_nativity_points',
      VISITS: 'pessebres_2026_visits',
      CURRENT_USER: 'pessebres_2026_current_user',
      GEOCACHE: 'pessebres_2026_muni_geocache',
      PROD_CLEAN_FLAG: 'pessebres_2026_prod_blank_v2'
    };

// Verificació d'Admin amb Hash SHA-256 irreversible (cap contrasenya en text pla al GitHub)
const ADMIN_AUTH = {
  username: 'admin',
  salt: 'sfs_bandolers_2026_',
  passwordHash: '1ec70c7275e070cffa97469dd7fea8af9bb1c1b32101dded22ecc7e061bb0111'
};

// Implementació SHA-256 pura en JS (funciona tant en HTTPS com en local file://)
function sha256Hex(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words = [];
  const utf8 = unescape(encodeURIComponent(ascii));
  const asciiBitLength = utf8.length * 8;

  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let str = utf8 + '\x80';
  while ((str.length % 64) - 56) str += '\x00';
  for (let i = 0; i < str.length; i++) {
    const j = str.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

// ============================================================================
// CATÀLEG DE MUNICIPIS DE CATALUNYA AMB COORDENADES (PER AUTOCOMPLETAT I HEATMAP)
// ============================================================================
const CATALONIA_MUNICIPALITIES = [
  // Sant Feliu Sasserra (Bages) i municipis propers
  { name: 'Sant Feliu Sasserra', comarca: 'Bages', lat: 41.9461, lng: 2.0211 },
  { name: 'Prats de Lluçanès', comarca: 'Lluçanès', lat: 42.0084, lng: 2.0311 },
  { name: 'Olost', comarca: 'Lluçanès', lat: 41.9866, lng: 2.0964 },
  { name: 'Santa Creu de Jutglar (Olost)', comarca: 'Lluçanès', lat: 41.9765, lng: 2.0695 },
  { name: 'Oristà', comarca: 'Lluçanès', lat: 41.9333, lng: 2.0608 },
  { name: 'La Torre d\'Oristà', comarca: 'Lluçanès', lat: 41.9597, lng: 2.0545 },
  { name: 'Perafita', comarca: 'Lluçanès', lat: 42.0431, lng: 2.1086 },
  { name: 'Lluçà', comarca: 'Lluçanès', lat: 42.0681, lng: 2.0736 },
  { name: 'Santa Eulàlia de Puig-oriol (Lluçà)', comarca: 'Lluçanès', lat: 42.0645, lng: 2.0725 },
  { name: 'Sant Martí d\'Albars', comarca: 'Lluçanès', lat: 42.0289, lng: 2.0744 },
  { name: 'Sant Boi de Lluçanès', comarca: 'Osona', lat: 42.0578, lng: 2.1525 },
  { name: 'Sobremunt', comarca: 'Lluçanès', lat: 42.0358, lng: 2.1667 },
  { name: 'Alpens', comarca: 'Lluçanès', lat: 42.1200, lng: 2.1014 },
  { name: 'Sant Agustí de Lluçanès', comarca: 'Osona', lat: 42.0861, lng: 2.1278 },
  { name: 'Sant Bartomeu del Grau', comarca: 'Osona', lat: 41.9853, lng: 2.1722 },

  // Bages
  { name: 'Avinyó', comarca: 'Bages', lat: 41.8631, lng: 1.9717 },
  { name: 'Santa Maria d\'Oló', comarca: 'Moianès', lat: 41.8744, lng: 2.0350 },
  { name: 'Artés', comarca: 'Bages', lat: 41.7981, lng: 1.9547 },
  { name: 'Sallent', comarca: 'Bages', lat: 41.8258, lng: 1.8950 },
  { name: 'Balsareny', comarca: 'Bages', lat: 41.8633, lng: 1.8769 },
  { name: 'Navàs', comarca: 'Bages', lat: 41.8994, lng: 1.8794 },
  { name: 'Gaià', comarca: 'Bages', lat: 41.9183, lng: 1.9250 },
  { name: 'Manresa', comarca: 'Bages', lat: 41.7281, lng: 1.8240 },
  { name: 'Santpedor', comarca: 'Bages', lat: 41.7836, lng: 1.8414 },
  { name: 'Sant Fruitós de Bages', comarca: 'Bages', lat: 41.7506, lng: 1.8725 },
  { name: 'Sant Joan de Vilatorrada', comarca: 'Bages', lat: 41.7453, lng: 1.8047 },
  { name: 'Sant Mateu de Bages', comarca: 'Bages', lat: 41.7969, lng: 1.7328 },
  { name: 'Súria', comarca: 'Bages', lat: 41.8317, lng: 1.7525 },
  { name: 'Cardona', comarca: 'Bages', lat: 41.9139, lng: 1.6806 },
  { name: 'Callús', comarca: 'Bages', lat: 41.7844, lng: 1.7850 },
  { name: 'Cabrianes', comarca: 'Bages', lat: 41.7975, lng: 1.9022 },
  { name: 'Navarcles', comarca: 'Bages', lat: 41.7522, lng: 1.9033 },
  { name: 'el Pont de Vilomara i Rocafort', comarca: 'Bages', lat: 41.7003, lng: 1.8708 },
  { name: 'Sant Vicenç de Castellet', comarca: 'Bages', lat: 41.6658, lng: 1.8633 },
  { name: 'Castellbell i el Vilar', comarca: 'Bages', lat: 41.6350, lng: 1.8556 },
  { name: 'Monistrol de Montserrat', comarca: 'Bages', lat: 41.6097, lng: 1.8439 },
  { name: 'Sant Salvador de Guardiola', comarca: 'Bages', lat: 41.6789, lng: 1.7667 },
  { name: 'Rajadell', comarca: 'Bages', lat: 41.7286, lng: 1.7061 },
  { name: 'Fonollosa', comarca: 'Bages', lat: 41.7633, lng: 1.6689 },
  { name: 'Aguilar de Segarra', comarca: 'Bages', lat: 41.7408, lng: 1.6319 },
  { name: 'Castellgalí', comarca: 'Bages', lat: 41.6761, lng: 1.8389 },
  { name: 'Castellfollit del Boix', comarca: 'Bages', lat: 41.6664, lng: 1.6844 },
  { name: 'Castellnou de Bages', comarca: 'Bages', lat: 41.8347, lng: 1.8364 },
  { name: 'Mura', comarca: 'Bages', lat: 41.6994, lng: 1.9767 },
  { name: 'Talamanca', comarca: 'Bages', lat: 41.7378, lng: 1.9775 },

  // Moianès
  { name: 'Moià', comarca: 'Moianès', lat: 41.8117, lng: 2.0972 },
  { name: 'L\'Estany', comarca: 'Moianès', lat: 41.8686, lng: 2.1122 },
  { name: 'Calders', comarca: 'Moianès', lat: 41.7897, lng: 1.9953 },
  { name: 'Monistrol de Calders', comarca: 'Moianès', lat: 41.7603, lng: 2.0142 },
  { name: 'Castellterçol', comarca: 'Moianès', lat: 41.7519, lng: 2.1211 },
  { name: 'Castellcir', comarca: 'Moianès', lat: 41.7614, lng: 2.1503 },
  { name: 'Sant Quirze Safaja', comarca: 'Moianès', lat: 41.7286, lng: 2.1536 },
  { name: 'Collsuspina', comarca: 'Moianès', lat: 41.8264, lng: 2.1758 },
  { name: 'Granera', comarca: 'Moianès', lat: 41.7258, lng: 2.0575 },

  // Osona
  { name: 'Vic', comarca: 'Osona', lat: 41.9304, lng: 2.2546 },
  { name: 'Manlleu', comarca: 'Osona', lat: 42.0006, lng: 2.2839 },
  { name: 'Torelló', comarca: 'Osona', lat: 42.0492, lng: 2.2628 },
  { name: 'Tona', comarca: 'Osona', lat: 41.8481, lng: 2.2278 },
  { name: 'Centelles', comarca: 'Osona', lat: 41.7975, lng: 2.2197 },
  { name: 'Taradell', comarca: 'Osona', lat: 41.8742, lng: 2.2875 },
  { name: 'Seva', comarca: 'Osona', lat: 41.8389, lng: 2.2819 },
  { name: 'Balenyà (Hostalets de Balenyà)', comarca: 'Osona', lat: 41.8153, lng: 2.2347 },
  { name: 'Roda de Ter', comarca: 'Osona', lat: 41.9800, lng: 2.3092 },
  { name: 'L\'Esquirol', comarca: 'Osona', lat: 42.0350, lng: 2.3694 },
  { name: 'Sant Hipòlit de Voltregà', comarca: 'Osona', lat: 42.0167, lng: 2.2389 },
  { name: 'Les Masies de Voltregà', comarca: 'Osona', lat: 42.0239, lng: 2.2456 },
  { name: 'Santa Eugènia de Berga', comarca: 'Osona', lat: 41.9011, lng: 2.2836 },
  { name: 'Calldetenes', comarca: 'Osona', lat: 41.9267, lng: 2.2847 },
  { name: 'Folgueroles', comarca: 'Osona', lat: 41.9389, lng: 2.3178 },
  { name: 'Sant Julià de Vilatorta', comarca: 'Osona', lat: 41.9231, lng: 2.3250 },
  { name: 'Gurb', comarca: 'Osona', lat: 41.9553, lng: 2.2350 },
  { name: 'Santa Eulàlia de Riuprimer', comarca: 'Osona', lat: 41.9114, lng: 2.1897 },
  { name: 'Muntanyola', comarca: 'Osona', lat: 41.8794, lng: 2.1778 },
  { name: 'Sant Quirze de Besora', comarca: 'Osona', lat: 42.1031, lng: 2.2219 },
  { name: 'Montesquiu', comarca: 'Osona', lat: 42.1114, lng: 2.2108 },
  { name: 'Sant Pere de Torelló', comarca: 'Osona', lat: 42.0750, lng: 2.2967 },
  { name: 'Sant Vicenç de Torelló', comarca: 'Osona', lat: 42.0622, lng: 2.2739 },
  { name: 'Orís', comarca: 'Osona', lat: 42.0594, lng: 2.2397 },
  { name: 'Rupit i Pruit', comarca: 'Osona', lat: 42.0253, lng: 2.4656 },
  { name: 'Tavèrnoles', comarca: 'Osona', lat: 41.9528, lng: 2.3267 },
  { name: 'Viladrau', comarca: 'Osona', lat: 41.8478, lng: 2.3903 },

  // Berguedà
  { name: 'Berga', comarca: 'Berguedà', lat: 42.1014, lng: 1.8456 },
  { name: 'Gironella', comarca: 'Berguedà', lat: 42.0339, lng: 1.8819 },
  { name: 'Puig-reig', comarca: 'Berguedà', lat: 41.9722, lng: 1.8814 },
  { name: 'Casserres', comarca: 'Berguedà', lat: 42.0147, lng: 1.8419 },
  { name: 'Avià', comarca: 'Berguedà', lat: 42.0789, lng: 1.8192 },
  { name: 'Olvan', comarca: 'Berguedà', lat: 42.0575, lng: 1.9056 },
  { name: 'Sagàs', comarca: 'Berguedà', lat: 42.0519, lng: 1.9636 },
  { name: 'Santa Maria de Merlès', comarca: 'Berguedà', lat: 42.0014, lng: 1.9789 },
  { name: 'La Quar', comarca: 'Berguedà', lat: 42.1067, lng: 1.9819 },
  { name: 'Borredà', comarca: 'Berguedà', lat: 42.1356, lng: 1.9947 },
  { name: 'Vilada', comarca: 'Berguedà', lat: 42.1375, lng: 1.9306 },
  { name: 'Cercs', comarca: 'Berguedà', lat: 42.1481, lng: 1.8606 },
  { name: 'Guardiola de Berguedà', comarca: 'Berguedà', lat: 42.2319, lng: 1.8794 },
  { name: 'Bagà', comarca: 'Berguedà', lat: 42.2531, lng: 1.8617 },
  { name: 'La Pobla de Lillet', comarca: 'Berguedà', lat: 42.2442, lng: 1.9747 },
  { name: 'Saldes', comarca: 'Berguedà', lat: 42.2300, lng: 1.7378 },
  { name: 'Viver i Serrateix', comarca: 'Berguedà', lat: 41.9500, lng: 1.7778 },
  { name: 'Montmajor', comarca: 'Berguedà', lat: 42.0169, lng: 1.7358 },
  { name: 'L\'Espunyola', comarca: 'Berguedà', lat: 42.0542, lng: 1.7711 },

  // Solsonès, Ripollès, Cerdanya
  { name: 'Solsona', comarca: 'Solsonès', lat: 41.9944, lng: 1.5178 },
  { name: 'Sant Llorenç de Morunys', comarca: 'Solsonès', lat: 42.1372, lng: 1.5906 },
  { name: 'Ripoll', comarca: 'Ripollès', lat: 42.2006, lng: 2.1903 },
  { name: 'Campdevànol', comarca: 'Ripollès', lat: 42.2256, lng: 2.1694 },
  { name: 'Sant Joan de les Abadesses', comarca: 'Ripollès', lat: 42.2336, lng: 2.2858 },
  { name: 'Camprodon', comarca: 'Ripollès', lat: 42.3125, lng: 2.3653 },
  { name: 'Ribes de Freser', comarca: 'Ripollès', lat: 42.3056, lng: 2.1678 },
  { name: 'Puigcerdà', comarca: 'Cerdanya', lat: 42.4317, lng: 1.9283 },
  { name: 'Bellver de Cerdanya', comarca: 'Cerdanya', lat: 42.3706, lng: 1.7764 },

  // Barcelonès, Vallès, Maresme, Baix Llobregat, Anoia, Penedès, Garraf
  { name: 'Barcelona', comarca: 'Barcelonès', lat: 41.3874, lng: 2.1686 },
  { name: 'L\'Hospitalet de Llobregat', comarca: 'Barcelonès', lat: 41.3597, lng: 2.0997 },
  { name: 'Badalona', comarca: 'Barcelonès', lat: 41.4500, lng: 2.2474 },
  { name: 'Santa Coloma de Gramenet', comarca: 'Barcelonès', lat: 41.4515, lng: 2.2081 },
  { name: 'Sant Adrià de Besòs', comarca: 'Barcelonès', lat: 41.4306, lng: 2.2203 },
  { name: 'Sabadell', comarca: 'Vallès Occidental', lat: 41.5463, lng: 2.1086 },
  { name: 'Terrassa', comarca: 'Vallès Occidental', lat: 41.5632, lng: 2.0089 },
  { name: 'Sant Cugat del Vallès', comarca: 'Vallès Occidental', lat: 41.4736, lng: 2.0853 },
  { name: 'Cerdanyola del Vallès', comarca: 'Vallès Occidental', lat: 41.4911, lng: 2.1408 },
  { name: 'Rubí', comarca: 'Vallès Occidental', lat: 41.4922, lng: 2.0331 },
  { name: 'Ripollet', comarca: 'Vallès Occidental', lat: 41.4969, lng: 2.1558 },
  { name: 'Montcada i Reixac', comarca: 'Vallès Occidental', lat: 41.4847, lng: 2.1878 },
  { name: 'Castellar del Vallès', comarca: 'Vallès Occidental', lat: 41.6175, lng: 2.0881 },
  { name: 'Sant Quirze del Vallès', comarca: 'Vallès Occidental', lat: 41.5319, lng: 2.0819 },
  { name: 'Santa Perpètua de Mogoda', comarca: 'Vallès Occidental', lat: 41.5356, lng: 2.1819 },
  { name: 'Palau-solità i Plegamans', comarca: 'Vallès Occidental', lat: 41.5875, lng: 2.1786 },
  { name: 'Matadepera', comarca: 'Vallès Occidental', lat: 41.6017, lng: 2.0267 },
  { name: 'Sentmenat', comarca: 'Vallès Occidental', lat: 41.6081, lng: 2.1358 },
  { name: 'Granollers', comarca: 'Vallès Oriental', lat: 41.6080, lng: 2.2877 },
  { name: 'Mollet del Vallès', comarca: 'Vallès Oriental', lat: 41.5403, lng: 2.2131 },
  { name: 'Cardedeu', comarca: 'Vallès Oriental', lat: 41.6397, lng: 2.3575 },
  { name: 'La Garriga', comarca: 'Vallès Oriental', lat: 41.6847, lng: 2.2864 },
  { name: 'Caldes de Montbui', comarca: 'Vallès Oriental', lat: 41.6331, lng: 2.1667 },
  { name: 'Lliçà d\'Amunt', comarca: 'Vallès Oriental', lat: 41.6108, lng: 2.2397 },
  { name: 'Lliçà de Vall', comarca: 'Vallès Oriental', lat: 41.5928, lng: 2.2419 },
  { name: 'Parets del Vallès', comarca: 'Vallès Oriental', lat: 41.5736, lng: 2.2336 },
  { name: 'Les Franqueses del Vallès', comarca: 'Vallès Oriental', lat: 41.6258, lng: 2.2994 },
  { name: 'Canovelles', comarca: 'Vallès Oriental', lat: 41.6186, lng: 2.2819 },
  { name: 'Sant Celoni', comarca: 'Vallès Oriental', lat: 41.6897, lng: 2.4917 },
  { name: 'Llinars del Vallès', comarca: 'Vallès Oriental', lat: 41.6403, lng: 2.4025 },
  { name: 'Bigues i Riells del Fai', comarca: 'Vallès Oriental', lat: 41.6781, lng: 2.2136 },
  { name: 'L\'Ametlla del Vallès', comarca: 'Vallès Oriental', lat: 41.6689, lng: 2.2600 },
  { name: 'Sant Feliu de Codines', comarca: 'Vallès Oriental', lat: 41.6889, lng: 2.1647 },
  { name: 'Mataró', comarca: 'Maresme', lat: 41.5381, lng: 2.4447 },
  { name: 'Premià de Mar', comarca: 'Maresme', lat: 41.4919, lng: 2.3586 },
  { name: 'El Masnou', comarca: 'Maresme', lat: 41.4803, lng: 2.3175 },
  { name: 'Vilassar de Mar', comarca: 'Maresme', lat: 41.5036, lng: 2.3919 },
  { name: 'Arenys de Mar', comarca: 'Maresme', lat: 41.5819, lng: 2.5503 },
  { name: 'Calella', comarca: 'Maresme', lat: 41.6156, lng: 2.6600 },
  { name: 'Pineda de Mar', comarca: 'Maresme', lat: 41.6278, lng: 2.6889 },
  { name: 'Malgrat de Mar', comarca: 'Maresme', lat: 41.6458, lng: 2.7422 },
  { name: 'Igualada', comarca: 'Anoia', lat: 41.5786, lng: 1.6172 },
  { name: 'Calaf', comarca: 'Anoia', lat: 41.7328, lng: 1.5139 },
  { name: 'Piera', comarca: 'Anoia', lat: 41.5222, lng: 1.7478 },
  { name: 'Capellades', comarca: 'Anoia', lat: 41.5311, lng: 1.6861 },
  { name: 'Vilafranca del Penedès', comarca: 'Alt Penedès', lat: 41.3461, lng: 1.6972 },
  { name: 'Sant Sadurní d\'Anoia', comarca: 'Alt Penedès', lat: 41.4258, lng: 1.7875 },
  { name: 'Vilanova i la Geltrú', comarca: 'Garraf', lat: 41.2242, lng: 1.7258 },
  { name: 'Sitges', comarca: 'Garraf', lat: 41.2372, lng: 1.8058 },
  { name: 'Sant Feliu de Llobregat', comarca: 'Baix Llobregat', lat: 41.3833, lng: 2.0442 },
  { name: 'Cornellà de Llobregat', comarca: 'Baix Llobregat', lat: 41.3550, lng: 2.0706 },
  { name: 'Sant Boi de Llobregat', comarca: 'Baix Llobregat', lat: 41.3461, lng: 2.0369 },
  { name: 'El Prat de Llobregat', comarca: 'Baix Llobregat', lat: 41.3278, lng: 2.0947 },
  { name: 'Esplugues de Llobregat', comarca: 'Baix Llobregat', lat: 41.3769, lng: 2.0886 },
  { name: 'Sant Joan Despí', comarca: 'Baix Llobregat', lat: 41.3672, lng: 2.0558 },
  { name: 'Sant Just Desvern', comarca: 'Baix Llobregat', lat: 41.3833, lng: 2.0750 },
  { name: 'Gavà', comarca: 'Baix Llobregat', lat: 41.3061, lng: 2.0019 },
  { name: 'Castelldefels', comarca: 'Baix Llobregat', lat: 41.2800, lng: 1.9767 },
  { name: 'Viladecans', comarca: 'Baix Llobregat', lat: 41.3158, lng: 2.0142 },
  { name: 'Molins de Rei', comarca: 'Baix Llobregat', lat: 41.4139, lng: 2.0158 },
  { name: 'Martorell', comarca: 'Baix Llobregat', lat: 41.4744, lng: 1.9306 },
  { name: 'Olesa de Montserrat', comarca: 'Baix Llobregat', lat: 41.5450, lng: 1.8944 },
  { name: 'Esparreguera', comarca: 'Baix Llobregat', lat: 41.5381, lng: 1.8694 },

  // Comarques de Girona
  { name: 'Girona', comarca: 'Gironès', lat: 41.9794, lng: 2.8214 },
  { name: 'Salt', comarca: 'Gironès', lat: 41.9756, lng: 2.7928 },
  { name: 'Cassà de la Selva', comarca: 'Gironès', lat: 41.8886, lng: 2.8753 },
  { name: 'Olot', comarca: 'Garrotxa', lat: 42.1822, lng: 2.4892 },
  { name: 'Besalú', comarca: 'Garrotxa', lat: 42.1989, lng: 2.6994 },
  { name: 'Banyoles', comarca: 'Pla de l\'Estany', lat: 42.1194, lng: 2.7653 },
  { name: 'Figueres', comarca: 'Alt Empordà', lat: 42.2664, lng: 2.9617 },
  { name: 'Roses', comarca: 'Alt Empordà', lat: 42.2633, lng: 3.1756 },
  { name: 'L\'Escala', comarca: 'Alt Empordà', lat: 42.1256, lng: 3.1325 },
  { name: 'La Bisbal d\'Empordà', comarca: 'Baix Empordà', lat: 41.9592, lng: 3.0378 },
  { name: 'Palafrugell', comarca: 'Baix Empordà', lat: 41.9175, lng: 3.1631 },
  { name: 'Palamós', comarca: 'Baix Empordà', lat: 41.8486, lng: 3.1292 },
  { name: 'Sant Feliu de Guíxols', comarca: 'Baix Empordà', lat: 41.7803, lng: 3.0289 },
  { name: 'Torroella de Montgrí', comarca: 'Baix Empordà', lat: 42.0411, lng: 3.1264 },
  { name: 'Santa Coloma de Farners', comarca: 'Selva', lat: 41.8625, lng: 2.6647 },
  { name: 'Blanes', comarca: 'Selva', lat: 41.6742, lng: 2.7903 },
  { name: 'Lloret de Mar', comarca: 'Selva', lat: 41.6994, lng: 2.8456 },
  { name: 'Arbúcies', comarca: 'Selva', lat: 41.8161, lng: 2.5142 },
  { name: 'Sant Hilari Sacalm', comarca: 'Selva', lat: 41.8786, lng: 2.5078 },

  // Comarques de Lleida i Pirineu
  { name: 'Lleida', comarca: 'Segrià', lat: 41.6176, lng: 0.6200 },
  { name: 'Balaguer', comarca: 'Noguera', lat: 41.7903, lng: 0.8056 },
  { name: 'Tàrrega', comarca: 'Urgell', lat: 41.6469, lng: 1.1394 },
  { name: 'Mollerussa', comarca: 'Pla d\'Urgell', lat: 41.6306, lng: 0.8944 },
  { name: 'Cervera', comarca: 'Segarra', lat: 41.6694, lng: 1.2722 },
  { name: 'Guissona', comarca: 'Segarra', lat: 41.7850, lng: 1.2886 },
  { name: 'Les Borges Blanques', comarca: 'Garrigues', lat: 41.5222, lng: 0.8686 },
  { name: 'La Seu d\'Urgell', comarca: 'Alt Urgell', lat: 42.3578, lng: 1.4614 },
  { name: 'Tremp', comarca: 'Pallars Jussà', lat: 42.1669, lng: 0.8947 },
  { name: 'Sort', comarca: 'Pallars Sobirà', lat: 42.4114, lng: 1.1306 },
  { name: 'El Pont de Suert', comarca: 'Alta Ribagorça', lat: 42.4072, lng: 0.7406 },
  { name: 'Vielha e Mijaran', comarca: 'Val d\'Aran', lat: 42.7019, lng: 0.7956 },

  // Comarques de Tarragona i Terres de l'Ebre
  { name: 'Tarragona', comarca: 'Tarragonès', lat: 41.1189, lng: 1.2445 },
  { name: 'Reus', comarca: 'Baix Camp', lat: 41.1561, lng: 1.1069 },
  { name: 'Cambrils', comarca: 'Baix Camp', lat: 41.0669, lng: 1.0586 },
  { name: 'Salou', comarca: 'Tarragonès', lat: 41.0767, lng: 1.1417 },
  { name: 'Valls', comarca: 'Alt Camp', lat: 41.2858, lng: 1.2497 },
  { name: 'El Vendrell', comarca: 'Baix Penedès', lat: 41.2200, lng: 1.5347 },
  { name: 'Calafell', comarca: 'Baix Penedès', lat: 41.2006, lng: 1.5686 },
  { name: 'Montblanc', comarca: 'Conca de Barberà', lat: 41.3764, lng: 1.1619 },
  { name: 'Falset', comarca: 'Priorat', lat: 41.1458, lng: 0.8200 },
  { name: 'Móra d\'Ebre', comarca: 'Ribera d\'Ebre', lat: 41.0897, lng: 0.6406 },
  { name: 'Gandesa', comarca: 'Terra Alta', lat: 41.0539, lng: 0.4383 },
  { name: 'Tortosa', comarca: 'Baix Ebre', lat: 40.8125, lng: 0.5214 },
  { name: 'Amposta', comarca: 'Montsià', lat: 40.7089, lng: 0.5789 },
  { name: 'La Ràpita', comarca: 'Montsià', lat: 40.6194, lng: 0.5928 }
];

// ============================================================================
// GENERADOR DETERMINISTA PER AL MODE DEMO (50 PESSEBRES + 200 PARTICIPANTS)
// ============================================================================
function buildDemoDataset() {
  // 1. Distribució realista de 200 participants exactes entre 42 poblacions de Catalunya
  const townDistribution = [
    ['Sant Feliu Sasserra', 33],
    ['Prats de Lluçanès', 16],
    ['Manresa', 14],
    ['Vic', 11],
    ['Olost', 10],
    ['Oristà', 8],
    ['Avinyó', 7],
    ['Barcelona', 7],
    ['Artés', 6],
    ['Santa Maria d\'Oló', 6],
    ['Perafita', 5],
    ['Lluçà', 5],
    ['Sallent', 5],
    ['Moià', 5],
    ['Berga', 5],
    ['Santpedor', 4],
    ['Navàs', 4],
    ['Sant Boi de Lluçanès', 4],
    ['Sabadell', 4],
    ['Tona', 3],
    ['Manlleu', 3],
    ['Gironella', 3],
    ['Puig-reig', 3],
    ['Terrassa', 3],
    ['Balsareny', 2],
    ['Sant Fruitós de Bages', 2],
    ['Alpens', 2],
    ['Sant Martí d\'Albars', 2],
    ['Torelló', 2],
    ['Granollers', 2],
    ['Sant Cugat del Vallès', 2],
    ['Solsona', 2],
    ['Súria', 1],
    ['Cardona', 1],
    ['Centelles', 1],
    ['Taradell', 1],
    ['Ripoll', 1],
    ['Olot', 1],
    ['Girona', 1],
    ['Mataró', 1],
    ['Igualada', 1],
    ['Reus', 1]
  ]; // Suma exacta = 200 participants

  const firstNames = [
    'Jordi', 'Marta', 'Marc', 'Laia', 'Pau', 'Anna', 'Joan', 'Núria', 'Arnau', 'Carla',
    'Pol', 'Mireia', 'Oriol', 'Gemma', 'Roger', 'Montse', 'Aleix', 'Clàudia', 'Guillem', 'Júlia',
    'Albert', 'Laura', 'Xavier', 'Sílvia', 'Enric', 'Berta', 'Martí', 'Aina', 'Eloi', 'Judit',
    'Nil', 'Mariona', 'Bernat', 'Helena', 'Lluís', 'Rosa', 'Ferran', 'Ester', ' Sergi', 'Alba',
    'Família', 'Colla', 'Grup', 'Ton', 'Quim', 'Neus', 'Carles', 'Txell', 'Biel', 'Ona'
  ];
  const lastNames = [
    'Puig', 'Soler', 'Serra', 'Vila', 'Rovira', 'Font', 'Roca', 'Prat', 'Casals', 'Ferrer',
    'Sala', 'Mas', 'Pujol', 'Valls', 'bosch', 'plana', 'Comas', 'Roig', 'Mora', 'Pons',
    'torras', 'Riera', 'Garriga', 'codina', 'Llobet', 'Bagué', 'Fajula', 'Costa', 'Grau', 'camps'
  ];

  // PRNG determinista
  let seed = 20261225;
  function rand() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  const users = [
    { id: 'usr_admin', username: 'admin', municipality: 'Sant Feliu Sasserra', comarca: 'Bages', lat: 41.9461, lng: 2.0211, role: 'ADMIN', created_at: '2026-11-01T09:00:00Z' }
  ];

  let uIdx = 1;
  for (const [muniName, count] of townDistribution) {
    const muniMeta = findPredefinedMunicipality(muniName) || { name: muniName, comarca: 'Catalunya', lat: 41.9461, lng: 2.0211 };
    for (let c = 0; c < count; c++) {
      const fn = firstNames[(uIdx * 7 + c * 3) % firstNames.length].trim();
      const lnRaw = lastNames[(uIdx * 11 + c * 5) % lastNames.length].trim();
      const ln = lnRaw.charAt(0).toUpperCase() + lnRaw.slice(1);
      const username = (fn === 'Família' || fn === 'Colla' || fn === 'Grup')
        ? `${fn} ${ln}`
        : `${fn} ${ln}`.trim();

      users.push({
        id: `demo_usr_${uIdx}`,
        username,
        municipality: muniMeta.name,
        comarca: muniMeta.comarca || '',
        lat: muniMeta.lat,
        lng: muniMeta.lng,
        role: 'USER',
        created_at: new Date(Date.UTC(2026, 10, 1 + (uIdx % 24), 8 + (uIdx % 12), (uIdx * 7) % 60)).toISOString()
      });
      uIdx++;
    }
  }

  // 2. 50 Pessebres inventats i realistes pel terme de Sant Feliu Sasserra
  const demoPessebreSpecs = [
    ['EL DEL SENGLAR', 41.9560, 2.0080, 'Pessebre a la solana de la muntanya entre alzines.'],
    ['LES GUILLERIES', 41.9580, 2.0120, 'Ubicat al camí vell de les Guilleries.'],
    ['BALMA DE LES PASTORELLES', 41.9565, 2.0200, 'Dins la bauma natural de les pastorelles.'],
    ['BARRACA HORTA DE FONTARMONA', 41.9500, 2.0170, 'Al costat de la barraca de vinya i l\'horta antiga.'],
    ['SANTA MAGDALENA', 41.9485, 2.0120, 'Pessebre rústic als peus de l\'ermita de Santa Magdalena.'],
    ['ESGLÉSIA DE SANT FELIU SASSERRA', 41.9455, 2.0210, 'Pessebre tradicional al porxo del nucli antic.'],
    ['BAUMA DEL CÀNTIR', 41.9460, 2.0175, 'Amagat a la fresca de la bauma del càntir.'],
    ['FONT FORRIOLA', 41.9440, 2.0150, 'Als peus del brollador de la Font Forriola.'],
    ['ROURE CENTENARI', 41.9420, 2.0130, 'Sota les branques del gran roure centenari.'],
    ['FONT DE LA CORDA', 41.9405, 2.0195, 'A tocar de la Font de la Corda, camí ombrívol.'],
    ['BAUMA SERRAT DEL MOLÍ DE BADIA', 41.9390, 2.0240, 'En un racó de roca prop del Molí de Badia.'],
    ['PUIGLLUSÀ', 41.9520, 2.0250, 'Al punt panoràmic del cim de Puigllusà.'],
    ['BAUMA DE PAHONELLAS', 41.9540, 2.0280, 'Pessebre tradicional encastat a les rocateres.'],
    ['SERRAT LLOBATER', 41.9490, 2.0300, 'A la cresta ventosa del Serrat Llobater amb grans vistes.'],
    ['FONT PERDUDA', 41.9430, 2.0310, 'Entre molsa i falgueres a la Font Perduda.'],
    ['MOLÍ DE LA RIBA', 41.9380, 2.0290, 'Junt a la resclosa del vell Molí de la Riba.'],
    ['XUP DE LES SALERES DELS ARNAUS', 41.9350, 2.0220, 'Pessebre de bosc a la zona de les Saleres.'],
    ['FARIGOLA', 41.9340, 2.0180, 'Envoltat de farigola i romaní al replà del bosc.'],
    ['L\'OLIVERA DE CAL PRIM / CAL BASTÓ', 41.9320, 2.0140, 'Al peu del tronc de l\'olivera centenària.'],
    ['CINGLE DE LES BRUIXES', 41.9595, 2.0155, 'Al mirador natural del cingle amb figures de fusta.'],
    ['FONT DEL TEIXÓ', 41.9572, 2.0242, 'Raconada humida amb pessebre de suro i molsa.'],
    ['BARRACA DE PEDRA SECA DEL PLA', 41.9535, 2.0105, 'Dins una barraca de vinya restaurada.'],
    ['TURÓ DEL VENT', 41.9608, 2.0218, 'Pessebre minimalista de ferro forjat al cim del turó.'],
    ['TORRENT DE LA SALA', 41.9472, 2.0075, 'Passant la passera de fusta del torrent.'],
    ['ROUREDA DE CAL VILÀ', 41.9412, 2.0088, 'Dins la soca buida d\'un roure vell.'],
    ['COVA D\'EN ROCAGUINARDA', 41.9552, 2.0322, 'Inspirat en els bandolers del Lluçanès.'],
    ['MIRADOR DEL LLUÇANÈS', 41.9510, 2.0345, 'Vistes cap al Pedraforca i el Puigmal.'],
    ['ERA DE CAL PERRIS', 41.9448, 2.0252, 'Al paller antic amb figures de fang artesanes.'],
    ['BOSC DE LES TRES FONTS', 41.9372, 2.0158, 'Entre tres surgències d\'aigua natural.'],
    ['CAMÍ RAL DELS BANDOLERS', 41.9398, 2.0112, 'A la cruïlla de l\'antic camí ral.'],
    ['BAUMA DE L\'ESQUIROL', 41.9588, 2.0278, 'Pessebre fet amb pinyes i aglans del bosc.'],
    ['PLA DE LES GARRICADES', 41.9522, 2.0142, 'Al mig dels camps de conreu i garrics.'],
    ['FONT DE L\'OM', 41.9478, 2.0228, 'A l\'ombra dels oms prop del poble.'],
    ['SERRAT DE LA CREU', 41.9465, 2.0282, 'Sota la creu de terme del serrat.'],
    ['RACÓ DE LA MOLSA', 41.9422, 2.0272, 'Bosc obac ple de molsa natural.'],
    ['PAS DEL LLOP', 41.9362, 2.0265, 'Estret de roca al camí de baixada.'],
    ['BARRACA D\'EN PEROT', 41.9332, 2.0212, 'Cabana de pastors amb pessebre il·luminat.'],
    ['FONT DELS OCELLS', 41.9355, 2.0125, 'Amb menjadores d\'ocells i figures pintades a mà.'],
    ['COLLET DE SANT PERE', 41.9498, 2.0055, 'A la carena de ponent del terme.'],
    ['BAUMA DE LA GUINEU', 41.9545, 2.0062, 'Sota una gran llosa de pedra inclinada.'],
    ['PINEDA DE CAN SOLER', 41.9612, 2.0102, 'Al cor de la pineda de pi roig.'],
    ['TORRENT DELS BOIXOS', 41.9578, 2.0182, 'Camí vorejat de boixos centenaris.'],
    ['POU DE GLAÇ ANTIC', 41.9435, 2.0235, 'Junt a l\'estructura de pedra de l\'antic pou de glaç.'],
    ['MIRADOR DE MONTSERRAT', 41.9315, 2.0175, 'Punt des d\'on s\'albira la serra de Montserrat.'],
    ['PLAÇA DE L\'AJUNTAMENT VELL', 41.9458, 2.0218, 'Al centre històric de Sant Feliu Sasserra.'],
    ['CAMÍ DE SANTA EULÀLIA', 41.9618, 2.0258, 'En direcció nord cap a la vall de Lluçà.'],
    ['BAUMA DELS PASTORS', 41.9508, 2.0288, 'Antic refugi de ramats a la cinglera.'],
    ['FONT DEL BOIX', 41.9385, 2.0205, 'Aigua fresca i pessebre de ceràmica.'],
    ['SERRAT DELS CORBS', 41.9408, 2.0332, 'Carena rocallosa a llevant del municipi.'],
    ['ERMITA VELLA DEL REMEI', 41.9338, 2.0285, 'Últim pessebre de la ruta circular sud.']
  ];

  const participantUsers = users.filter(u => u.role !== 'ADMIN');
  const points = demoPessebreSpecs.map(([name, lat, lng, desc], idx) => {
    const proposer = idx < 19
      ? 'Organització'
      : participantUsers[(idx * 5) % participantUsers.length].username;
    return {
      id: `pt_${idx + 1}`,
      name,
      municipality: 'Sant Feliu Sasserra',
      latitude: lat,
      longitude: lng,
      description: desc,
      submitted_by: proposer,
      status: 'APPROVED',
      created_at: new Date(Date.UTC(2026, 10, 2 + (idx % 15), 9, idx)).toISOString()
    };
  });

  // Afegim 2 propostes pendents perquè es pugui provar el panell d'Admin a la Demo
  points.push(
    {
      id: 'pt_51',
      name: 'BAUMA SECRETA DEL GORGS (PROVA DEMO)',
      municipality: 'Sant Feliu Sasserra',
      latitude: 41.9475,
      longitude: 2.0190,
      description: 'Proposta pendent de mostra per provar el panell d\'administrador.',
      submitted_by: participantUsers[0].username,
      status: 'PENDING',
      created_at: new Date().toISOString()
    },
    {
      id: 'pt_52',
      name: 'PESSEBRE DEL CIM DE LA GUARDIOLA (PROVA DEMO)',
      municipality: 'Sant Feliu Sasserra',
      latitude: 41.9530,
      longitude: 2.0220,
      description: 'Segona proposta pendent per acceptar o rebutjar des d\'Admin.',
      submitted_by: participantUsers[3].username,
      status: 'PENDING',
      created_at: new Date().toISOString()
    }
  );

  // 3. Visites i valoracions amb Boles de Nadal (1 a 5) per als 200 participants
  const visits = [];
  let vId = 1;
  participantUsers.forEach((u, idx) => {
    // Els primers 14 participants han completat els 50 pessebres (100% de la ruta) en dates diferents
    let targetVisits;
    let step;
    if (idx < 14) {
      targetVisits = 50;
      step = 1; // Visiten tots els 50 pessebres sense excepció
    } else if (idx < 60) {
      targetVisits = 20 + Math.floor(rand() * 26);
      step = ((idx % 6) * 2 + 1) % 50 || 1; // Coprimers amb 50 (1, 3, 7, 9, 11)
      if (step === 5) step = 7;
    } else if (idx < 140) {
      targetVisits = 8 + Math.floor(rand() * 15);
      step = 3;
    } else {
      targetVisits = 1 + Math.floor(rand() * 8);
      step = 7;
    }

    let startPt = idx % 50;
    const visitedSet = new Set();
    // Data en què aquest participant completa el seu últim pessebre
    const userFinishDay = 8 + idx; // dies esglaonats de desembre

    for (let k = 0; k < targetVisits; k++) {
      const ptIdx = (startPt + k * step) % 50;
      if (visitedSet.has(ptIdx)) continue;
      visitedSet.add(ptIdx);

      const hasRating = rand() > 0.22;
      const rating = hasRating ? (3 + Math.floor(rand() * 3)) : null;
      const visitDate = idx < 14
        ? new Date(Date.UTC(2026, 11, Math.min(28, userFinishDay), 9 + (k % 9), (idx * 7 + k) % 60)).toISOString()
        : new Date(Date.UTC(2026, 11, 1 + ((vId + idx) % 24), 10, vId % 60)).toISOString();

      visits.push({
        id: `demo_v_${vId++}`,
        user_id: u.id,
        nativity_point_id: `pt_${ptIdx + 1}`,
        rating,
        created_at: visitDate
      });
    }
  });

  return { users, points, visits };
}

function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function encodeMunicipalityMeta(muniName, lat, lng, comarca = '') {
  const cleanName = (muniName || 'Sant Feliu Sasserra').trim();
  const cLat = Number(lat) || 41.9461;
  const cLng = Number(lng) || 2.0211;
  return `muni:${cleanName}|${cLat.toFixed(4)},${cLng.toFixed(4)}|${comarca || ''}`;
}

function decodeMunicipalityMeta(userObj) {
  if (!userObj) {
    return { name: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, comarca: 'Bages' };
  }
  if (userObj.email && typeof userObj.email === 'string' && userObj.email.startsWith('muni:')) {
    const parts = userObj.email.slice(5).split('|');
    const name = (parts[0] || 'Sant Feliu Sasserra').trim();
    const coords = (parts[1] || '').split(',');
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    const comarca = parts[2] || '';
    if (!isNaN(lat) && !isNaN(lng)) {
      return { name, lat, lng, comarca };
    }
  }
  const rawName = (userObj.municipality || '').trim();
  if (rawName) {
    const found = findPredefinedMunicipality(rawName);
    if (found) return found;
    if (userObj.lat && userObj.lng) {
      return { name: rawName, lat: Number(userObj.lat), lng: Number(userObj.lng), comarca: userObj.comarca || '' };
    }
    const cached = getGeocodedCache()[normalizeText(rawName)];
    if (cached) return { name: rawName, ...cached };
    return { name: rawName, lat: 41.9461, lng: 2.0211, comarca: '' };
  }
  return { name: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, comarca: 'Bages' };
}

function findPredefinedMunicipality(name) {
  const norm = normalizeText(name);
  if (!norm) return null;
  return (
    CATALONIA_MUNICIPALITIES.find(m => normalizeText(m.name) === norm) ||
    CATALONIA_MUNICIPALITIES.find(m => normalizeText(m.name).startsWith(norm)) ||
    null
  );
}

function getGeocodedCache() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEYS.GEOCACHE) || '{}');
  } catch (e) {
    return {};
  }
}

function saveGeocodedCache(name, data) {
  try {
    const cache = getGeocodedCache();
    cache[normalizeText(name)] = data;
    localStorage.setItem(DB_KEYS.GEOCACHE, JSON.stringify(cache));
  } catch (e) {}
}

class PessebresDB {
  constructor() {
    this.supabase = null;
    this.isCloudEnabled = false;
    this.isDemo = IS_DEMO_MODE;
    this.init();
  }

  // --- AUTOCOMPLETAT DE MUNICIPIS ---
  getMunicipalitiesList() {
    return CATALONIA_MUNICIPALITIES;
  }

  searchMunicipalities(query, limit = 8) {
    const q = normalizeText(query);
    if (!q) {
      return CATALONIA_MUNICIPALITIES.slice(0, limit);
    }
    const startsWith = [];
    const contains = [];
    for (const m of CATALONIA_MUNICIPALITIES) {
      const nName = normalizeText(m.name);
      const nComarca = normalizeText(m.comarca);
      if (nName.startsWith(q)) {
        startsWith.push(m);
      } else if (nName.includes(q) || nComarca.includes(q)) {
        contains.push(m);
      }
    }
    return [...startsWith, ...contains].slice(0, limit);
  }

  async resolveMunicipality(inputName) {
    const trimmed = (inputName || '').trim();
    if (!trimmed) {
      return CATALONIA_MUNICIPALITIES[0];
    }

    const exactOrPrefix = findPredefinedMunicipality(trimmed);
    if (exactOrPrefix && normalizeText(exactOrPrefix.name) === normalizeText(trimmed)) {
      return exactOrPrefix;
    }

    const cached = getGeocodedCache()[normalizeText(trimmed)];
    if (cached) {
      return { name: trimmed, ...cached };
    }

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3500);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es,ad,fr&q=${encodeURIComponent(trimmed + ', Catalunya')}`;
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        const arr = await res.json();
        if (arr && arr.length > 0) {
          const lat = parseFloat(arr[0].lat);
          const lng = parseFloat(arr[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            const geoData = { lat, lng, comarca: '' };
            saveGeocodedCache(trimmed, geoData);
            return { name: trimmed, ...geoData };
          }
        }
      }
    } catch (e) {}

    if (exactOrPrefix) return exactOrPrefix;
    return { name: trimmed, lat: 41.9461, lng: 2.0211, comarca: '' };
  }

  // --- MAPA DE PUNTS ELIMINATS DEFINITIVAMENT ---
  getDeletedPointIds() {
    try {
      const key = this.isDemo ? 'pessebres_demo_deleted_point_ids' : 'pessebres_deleted_point_ids';
      return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  addDeletedPointId(id) {
    try {
      const key = this.isDemo ? 'pessebres_demo_deleted_point_ids' : 'pessebres_deleted_point_ids';
      const deleted = this.getDeletedPointIds();
      deleted.add(id);
      localStorage.setItem(key, JSON.stringify([...deleted]));
    } catch (e) {
      console.warn("Error guardant deleted point id:", e);
    }
  }

  resetDemoData() {
    if (!this.isDemo) return;
    localStorage.removeItem('pessebres_demo_deleted_point_ids');
    const demoData = buildDemoDataset();
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(demoData.users));
    localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(demoData.points));
    localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(demoData.visits));
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  init() {
    localStorage.removeItem('pessebres_user_passwords');

    // MODE DEMO: 50 pessebres inventats i 200 participants d'arreu de Catalunya (aïllat de Supabase)
    if (this.isDemo) {
      if (!localStorage.getItem(DB_KEYS.POINTS) || !localStorage.getItem(DB_KEYS.USERS) || !localStorage.getItem(DB_KEYS.VISITS)) {
        const demoData = buildDemoDataset();
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(demoData.users));
        localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(demoData.points));
        localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(demoData.visits));
      }
      console.log("🧪 MODE DEMO ACTIU: 50 pessebres i 200 participants carregats!");
      return;
    }

    // MODE PRODUCCIÓ: Deixar la pàgina 100% EN BLANC (0 pessebres, 0 participants, 0 visites) per publicar
    if (!localStorage.getItem(DB_KEYS.PROD_CLEAN_FLAG)) {
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([
        { id: 'usr_admin', username: 'admin', municipality: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, role: 'ADMIN', created_at: new Date().toISOString() }
      ]));
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify([]));
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
      localStorage.removeItem('pessebres_deleted_point_ids');
      localStorage.setItem(DB_KEYS.PROD_CLEAN_FLAG, 'true');
    }

    if (!localStorage.getItem(DB_KEYS.POINTS)) {
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([
        { id: 'usr_admin', username: 'admin', municipality: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, role: 'ADMIN', created_at: new Date().toISOString() }
      ]));
    }
    if (!localStorage.getItem(DB_KEYS.VISITS)) {
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify([]));
    }

    const cur = this.getCurrentUser();
    if (cur) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(this.sanitizeUserObject(cur)));
    }

    // Connectar a Supabase en mode Producció
    const cfg = window.SUPABASE_CONFIG;
    if (cfg && cfg.url && cfg.anonKey && cfg.url.startsWith('http') && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(cfg.url, cfg.anonKey);
        this.isCloudEnabled = true;
        console.log("☁️ Connectat a Supabase Cloud!");
        this.syncFromCloud();
        this.subscribeRealtime();
      } catch (err) {
        console.warn("⚠️ Error en connectar a Supabase. S'utilitza mode local:", err);
      }
    }
  }

  sanitizeUserObject(u) {
    const muniMeta = decodeMunicipalityMeta(u);
    return {
      id: u.id,
      username: u.username,
      municipality: muniMeta.name,
      comarca: muniMeta.comarca || '',
      lat: muniMeta.lat,
      lng: muniMeta.lng,
      role: u.role || 'USER',
      created_at: u.created_at || new Date().toISOString()
    };
  }

  // --- SINCRONITZACIÓ AMB SUPABASE ---
  async syncFromCloud() {
    if (this.isDemo || !this.isCloudEnabled || !this.supabase) return;
    try {
      const [resUsers, resPoints, resVisits] = await Promise.all([
        this.supabase.from('users').select('id, username, email, role, created_at'),
        this.supabase.from('nativity_points').select('*'),
        this.supabase.from('visits').select('*')
      ]);

      if (!resUsers.error && resUsers.data) {
        const sanitizedUsers = resUsers.data.map(u => this.sanitizeUserObject(u));
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(sanitizedUsers));

        const current = this.getCurrentUser();
        if (current && current.role !== 'ADMIN') {
          const matchCloud = sanitizedUsers.find(u => u.id === current.id);
          if (matchCloud) {
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(matchCloud));
          }
        }
      }
      if (!resPoints.error && resPoints.data) {
        const deletedIds = this.getDeletedPointIds();
        const cleanCloud = resPoints.data.filter(p => !deletedIds.has(p.id));
        localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(cleanCloud));
      }
      if (!resVisits.error && resVisits.data) {
        localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(resVisits.data));
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
    } catch (e) {
      console.warn("Error en sincronitzar des de Supabase:", e);
    }
  }

  subscribeRealtime() {
    if (this.isDemo || !this.isCloudEnabled || !this.supabase) return;
    try {
      this.supabase.channel('public:realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nativity_points' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          this.syncFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn("Realtime no disponible:", e);
    }
  }

  // --- USERS & ENTRADA ULTRA-FÀCIL AMB NOM + POBLACIÓ ---
  getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  }

  getCurrentUser() {
    const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(this.sanitizeUserObject(user)));
    } else {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  async enterWithMunicipality(username, municipalityName, adminPassword = '') {
    const userTerm = (username || '').trim();
    if (!userTerm) throw new Error("Escriu el teu nom o àlies per participar.");

    // 1. Verificació d'Administrador per Hash SHA-256
    if (userTerm.toLowerCase() === ADMIN_AUTH.username) {
      const passTerm = (adminPassword || '').trim();
      if (!passTerm) {
        throw new Error("Introdueix la clau d'administrador.");
      }
      const computedHash = sha256Hex(ADMIN_AUTH.salt + passTerm);
      if (computedHash !== ADMIN_AUTH.passwordHash) {
        throw new Error("Clau d'administrador incorrecta.");
      }
      const adminUser = {
        id: 'usr_admin',
        username: 'admin',
        municipality: 'Sant Feliu Sasserra',
        comarca: 'Bages',
        lat: 41.9461,
        lng: 2.0211,
        role: 'ADMIN',
        created_at: new Date().toISOString()
      };
      this.setCurrentUser(adminUser);
      return { user: adminUser, isNew: false, isAdmin: true };
    }

    // 2. Validar i resoldre la població per a un participant normal
    const muniTerm = (municipalityName || '').trim();
    if (!muniTerm) {
      throw new Error("Indica de quina població vens per afegir-te al mapa!");
    }

    const resolvedMuni = await this.resolveMunicipality(muniTerm);
    const encodedMeta = encodeMunicipalityMeta(resolvedMuni.name, resolvedMuni.lat, resolvedMuni.lng, resolvedMuni.comarca);

    const users = this.getUsers();
    const normUser = normalizeText(userTerm);
    const normMuni = normalizeText(resolvedMuni.name);

    let existing = users.find(
      u => u.role !== 'ADMIN' && normalizeText(u.username) === normUser && normalizeText(u.municipality) === normMuni
    );

    if (!existing) {
      const sameNameUser = users.find(u => u.role !== 'ADMIN' && normalizeText(u.username) === normUser);
      if (sameNameUser) {
        existing = sameNameUser;
      }
    }

    if (existing) {
      existing.municipality = resolvedMuni.name;
      existing.comarca = resolvedMuni.comarca || '';
      existing.lat = resolvedMuni.lat;
      existing.lng = resolvedMuni.lng;

      const idx = users.findIndex(u => u.id === existing.id);
      if (idx !== -1) users[idx] = existing;
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      this.setCurrentUser(existing);

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        this.supabase.from('users').update({ email: encodedMeta }).eq('id', existing.id).then();
      }

      return { user: existing, isNew: false, isAdmin: false };
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      username: userTerm,
      municipality: resolvedMuni.name,
      comarca: resolvedMuni.comarca || '',
      lat: resolvedMuni.lat,
      lng: resolvedMuni.lng,
      role: 'USER',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    if (!this.isDemo && this.isCloudEnabled && this.supabase) {
      try {
        const cloudRow = {
          id: newUser.id,
          username: newUser.username,
          email: encodedMeta,
          role: 'USER',
          created_at: newUser.created_at
        };
        await this.supabase.from('users').insert([cloudRow]);
      } catch (err) {
        console.warn("Error en guardar participant a Supabase:", err);
      }
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return { user: newUser, isNew: true, isAdmin: false };
  }

  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  async deleteUser(userId) {
    if (!userId || userId === 'usr_admin') return;
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    let visits = this.getVisits();
    visits = visits.filter(v => v.user_id !== userId);
    localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

    if (!this.isDemo && this.isCloudEnabled && this.supabase) {
      try {
        await this.supabase.from('visits').delete().eq('user_id', userId);
        await this.supabase.from('users').delete().eq('id', userId);
      } catch (err) {
        console.warn("Error eliminant usuari de Supabase:", err);
      }
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- NATIVITY_POINTS ---
  getPoints() {
    const deletedIds = this.getDeletedPointIds();
    const pts = JSON.parse(localStorage.getItem(DB_KEYS.POINTS) || '[]');
    return pts.filter(p => !deletedIds.has(p.id));
  }

  getApprovedPoints() {
    const deletedIds = this.getDeletedPointIds();
    const pts = this.getPoints().filter(p => p.status === 'APPROVED' && !deletedIds.has(p.id));
    return pts.sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, ''), 10);
      const numB = parseInt(b.id.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }

  getPendingPoints() {
    return this.getPoints().filter(p => p.status === 'PENDING');
  }

  getPointById(id) {
    return this.getPoints().find(p => p.id === id);
  }

  async addPoint(data) {
    const points = this.getPoints();
    const newPoint = {
      id: 'pt_' + Date.now(),
      name: data.name.trim(),
      municipality: data.municipality ? data.municipality.trim() : 'Sant Feliu Sasserra',
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      description: data.description ? data.description.trim() : '',
      submitted_by: data.submitted_by ? data.submitted_by.trim() : 'Anònim',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    points.push(newPoint);
    localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

    if (!this.isDemo && this.isCloudEnabled && this.supabase) {
      await this.supabase.from('nativity_points').insert([newPoint]);
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return newPoint;
  }

  async updatePointStatus(id, newStatus) {
    const points = this.getPoints();
    const index = points.findIndex(p => p.id === id);
    if (index !== -1) {
      points[index].status = newStatus;
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        await this.supabase.from('nativity_points').update({ status: newStatus }).eq('id', id);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return points[index];
    }
    return null;
  }

  async updatePoint(id, updatedData) {
    const points = this.getPoints();
    const index = points.findIndex(p => p.id === id);
    if (index !== -1) {
      points[index] = {
        ...points[index],
        name: updatedData.name.trim(),
        municipality: updatedData.municipality ? updatedData.municipality.trim() : (points[index].municipality || 'Sant Feliu Sasserra'),
        latitude: parseFloat(updatedData.latitude),
        longitude: parseFloat(updatedData.longitude),
        description: updatedData.description ? updatedData.description.trim() : '',
        status: updatedData.status || points[index].status
      };
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        await this.supabase.from('nativity_points').update({
          name: points[index].name,
          municipality: points[index].municipality,
          latitude: points[index].latitude,
          longitude: points[index].longitude,
          description: points[index].description,
          status: points[index].status
        }).eq('id', id);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return points[index];
    }
    return null;
  }

  async deletePoint(id) {
    this.addDeletedPointId(id);

    const points = this.getPoints().filter(p => p.id !== id);
    localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

    const visits = this.getVisits().filter(v => v.nativity_point_id !== id);
    localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

    if (!this.isDemo && this.isCloudEnabled && this.supabase) {
      try {
        await this.supabase.from('visits').delete().eq('nativity_point_id', id);
        await this.supabase.from('nativity_points').delete().eq('id', id);
      } catch (err) {
        console.warn("Error eliminant pessebre de Supabase:", err);
      }
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- VISITS & RATINGS (BOLES DE NADAL) ---
  getVisits() {
    return JSON.parse(localStorage.getItem(DB_KEYS.VISITS) || '[]');
  }

  getVisitsForPoint(pointId) {
    return this.getVisits().filter(v => v.nativity_point_id === pointId);
  }

  getVisitCountForPoint(pointId) {
    return this.getVisitsForPoint(pointId).length;
  }

  getUserVisits(userId) {
    return this.getVisits().filter(v => v.user_id === userId);
  }

  hasUserVisited(userId, pointId) {
    if (!userId) return false;
    return this.getVisits().some(v => v.user_id === userId && v.nativity_point_id === pointId);
  }

  getUserRatingForPoint(userId, pointId) {
    if (!userId) return 0;
    const visit = this.getVisits().find(v => v.user_id === userId && v.nativity_point_id === pointId);
    return visit && visit.rating ? Number(visit.rating) : 0;
  }

  getPointRatingStats(pointId) {
    const ratedVisits = this.getVisitsForPoint(pointId).filter(v => v.rating && Number(v.rating) >= 1 && Number(v.rating) <= 5);
    if (ratedVisits.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = ratedVisits.reduce((acc, v) => acc + Number(v.rating), 0);
    return {
      average: Number((sum / ratedVisits.length).toFixed(1)),
      count: ratedVisits.length
    };
  }

  async ratePoint(userId, pointId, ratingVal) {
    if (!userId) {
      throw new Error("Cal que entris amb el teu nom i població per valorar un pessebre.");
    }
    const r = parseInt(ratingVal, 10);
    if (isNaN(r) || r < 1 || r > 5) {
      throw new Error("La valoració ha de ser d'1 a 5 boles de Nadal.");
    }

    const visits = this.getVisits();
    const existingIndex = visits.findIndex(v => v.user_id === userId && v.nativity_point_id === pointId);

    if (existingIndex !== -1) {
      visits[existingIndex].rating = r;
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        try {
          await this.supabase.from('visits').update({ rating: r }).eq('user_id', userId).eq('nativity_point_id', pointId);
        } catch (err) {
          console.warn("Error actualitzant valoració a Supabase:", err);
        }
      }
    } else {
      const newVisit = {
        id: 'v_' + Date.now(),
        user_id: userId,
        nativity_point_id: pointId,
        rating: r,
        created_at: new Date().toISOString()
      };
      visits.push(newVisit);
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        try {
          const { error } = await this.supabase.from('visits').insert([newVisit]);
          if (error && error.message && error.message.includes('rating')) {
            const { rating: _, ...visitNoRating } = newVisit;
            await this.supabase.from('visits').insert([visitNoRating]);
          }
        } catch (err) {
          console.warn("Error desant visita amb valoració a Supabase:", err);
        }
      }
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return { rating: r, stats: this.getPointRatingStats(pointId) };
  }

  async toggleVisit(userId, pointId) {
    if (!userId) {
      throw new Error("Cal que entris amb el teu nom i població per marcar un pessebre.");
    }
    const visits = this.getVisits();
    const existingIndex = visits.findIndex(v => v.user_id === userId && v.nativity_point_id === pointId);

    if (existingIndex !== -1) {
      visits.splice(existingIndex, 1);
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        await this.supabase.from('visits').delete().eq('user_id', userId).eq('nativity_point_id', pointId);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return { visited: false, visitCount: this.getVisitCountForPoint(pointId) };
    } else {
      const newVisit = {
        id: 'v_' + Date.now(),
        user_id: userId,
        nativity_point_id: pointId,
        created_at: new Date().toISOString()
      };
      visits.push(newVisit);
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (!this.isDemo && this.isCloudEnabled && this.supabase) {
        await this.supabase.from('visits').insert([newVisit]);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return { visited: true, visitCount: this.getVisitCountForPoint(pointId) };
    }
  }

  // --- ESTADÍSTIQUES ---
  getStats() {
    const approvedPoints = this.getApprovedPoints();
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');

    return {
      approvedCount: approvedPoints.length,
      usersCount: users.length
    };
  }

  // --- RÀNQUINGS DE PARTICIPANTS ---
  getLeaderboard() {
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');
    const visits = this.getVisits();

    const userVisitCounts = {};
    users.forEach(u => {
      userVisitCounts[u.id] = 0;
    });

    visits.forEach(v => {
      if (userVisitCounts[v.user_id] !== undefined) {
        userVisitCounts[v.user_id] += 1;
      }
    });

    const leaderboard = users.map(u => {
      const muniMeta = decodeMunicipalityMeta(u);
      return {
        id: u.id,
        username: u.username,
        municipality: muniMeta.name,
        visitsCount: userVisitCounts[u.id] || 0
      };
    });

    leaderboard.sort((a, b) => b.visitsCount - a.visitsCount);

    return leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  // --- LLISTAT D'HONOR: PARTICIPANTS QUE HAN COMPLETAT EL 100% DE LA RUTA I DATA ---
  getCompletedRouteUsers() {
    const approvedPoints = this.getApprovedPoints();
    if (approvedPoints.length === 0) return [];

    const totalRequired = approvedPoints.length;
    const approvedIds = new Set(approvedPoints.map(p => p.id));
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');
    const visits = this.getVisits();

    // Agrupar visites vàlides per usuari
    const visitsByUser = {};
    users.forEach(u => {
      visitsByUser[u.id] = new Map();
    });

    visits.forEach(v => {
      if (visitsByUser[v.user_id] && approvedIds.has(v.nativity_point_id)) {
        const existingDate = visitsByUser[v.user_id].get(v.nativity_point_id);
        const curDate = v.created_at || new Date().toISOString();
        if (!existingDate || curDate < existingDate) {
          visitsByUser[v.user_id].set(v.nativity_point_id, curDate);
        }
      }
    });

    const completedList = [];
    users.forEach(u => {
      const userMap = visitsByUser[u.id];
      if (userMap && userMap.size >= totalRequired) {
        // La data de finalització és la data en què va marcar l'últim pessebre per completar la ruta
        const dates = Array.from(userMap.values()).sort();
        const completedAt = dates[dates.length - 1] || u.created_at || new Date().toISOString();
        const muniMeta = decodeMunicipalityMeta(u);
        completedList.push({
          id: u.id,
          username: u.username,
          municipality: muniMeta.name,
          visitsCount: userMap.size,
          totalRequired,
          completedAt
        });
      }
    });

    // Ordenar cronològicament: primer qui va completar la ruta abans
    completedList.sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''));

    return completedList.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  // --- ESTADÍSTIQUES I MAPA DE CALOR PER POBLACIONS ("D'ON VENIM") ---
  getMunicipalityStats() {
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');
    const visits = this.getVisits();

    const userVisitCounts = {};
    users.forEach(u => { userVisitCounts[u.id] = 0; });
    visits.forEach(v => {
      if (userVisitCounts[v.user_id] !== undefined) {
        userVisitCounts[v.user_id] += 1;
      }
    });

    const groups = {};
    users.forEach(u => {
      const meta = decodeMunicipalityMeta(u);
      const key = normalizeText(meta.name) || 'sant feliu sasserra';
      if (!groups[key]) {
        groups[key] = {
          name: meta.name,
          comarca: meta.comarca || '',
          lat: meta.lat,
          lng: meta.lng,
          usersCount: 0,
          visitsCount: 0
        };
      }
      groups[key].usersCount += 1;
      groups[key].visitsCount += userVisitCounts[u.id] || 0;
    });

    const totalUsers = users.length || 1;
    const list = Object.values(groups).sort((a, b) => {
      if (b.usersCount !== a.usersCount) return b.usersCount - a.usersCount;
      return b.visitsCount - a.visitsCount;
    });

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentage: Math.round((item.usersCount / totalUsers) * 100)
    }));
  }

  getUserRank(userId) {
    const leaderboard = this.getLeaderboard();
    const userItem = leaderboard.find(item => item.id === userId);
    return userItem ? userItem.rank : null;
  }
}

// Instància global
window.db = new PessebresDB();
