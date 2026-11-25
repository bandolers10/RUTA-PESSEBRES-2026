/**
 * Base de Dades per Ruta dels Pessebres 2026
 * Sistema de registre fàcil i privat per Nom + Població (0 contrasenyes d'usuari, 0 correus exposats)
 * + Mapa de Calor de Poblacions i Sincronització en temps real amb Supabase.
 */

const DB_KEYS = {
  USERS: 'pessebres_2026_users',
  POINTS: 'pessebres_2026_nativity_points',
  VISITS: 'pessebres_2026_visits',
  CURRENT_USER: 'pessebres_2026_current_user',
  GEOCACHE: 'pessebres_2026_muni_geocache'
};

// 19 Pessebres oficials de Sant Feliu Sasserra
const SEED_POINTS = [
  { id: 'pt_1', name: 'EL DEL SENGLAR', municipality: 'Sant Feliu Sasserra', latitude: 41.9560, longitude: 2.0080, description: 'Pessebre a la solana de la muntanya.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-02T10:00:00Z' },
  { id: 'pt_2', name: 'LES GUILLERIES', municipality: 'Sant Feliu Sasserra', latitude: 41.9580, longitude: 2.0120, description: 'Ubicat al camí de les Guilleries.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-02T12:30:00Z' },
  { id: 'pt_3', name: 'BALMA DE LES PASTORELLES', municipality: 'Sant Feliu Sasserra', latitude: 41.9565, longitude: 2.0200, description: 'Dins la bauma natural de les pastorelles.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-03T09:00:00Z' },
  { id: 'pt_4', name: 'BARRACA HORTA DE FONTARMONA', municipality: 'Sant Feliu Sasserra', latitude: 41.9500, longitude: 2.0170, description: 'Junt a la vinya i l\'horta antiga.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-03T14:00:00Z' },
  { id: 'pt_5', name: 'SANTA MAGDALENA', municipality: 'Sant Feliu Sasserra', latitude: 41.9485, longitude: 2.0120, description: 'Pessebre rústic als peus del turó.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-04T08:30:00Z' },
  { id: 'pt_6', name: 'ESGLÉSIA DE SANT FELIU SASSERRA', municipality: 'Sant Feliu Sasserra', latitude: 41.9455, longitude: 2.0210, description: 'Pessebre del nucli antic del poble.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-04T10:00:00Z' },
  { id: 'pt_7', name: 'BAUMA DEL CÀNTIR', municipality: 'Sant Feliu Sasserra', latitude: 41.9460, longitude: 2.0175, description: 'Amagat a la bauma del càntir.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-04T15:00:00Z' },
  { id: 'pt_8', name: 'FONT FORRIOLA', municipality: 'Sant Feliu Sasserra', latitude: 41.9440, longitude: 2.0150, description: 'Als peus del rajaire de la font.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T09:15:00Z' },
  { id: 'pt_9', name: 'ROURE CENTENÀRI', municipality: 'Sant Feliu Sasserra', latitude: 41.9420, longitude: 2.0130, description: 'Sota l\'ombra del roure centenari.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T11:45:00Z' },
  { id: 'pt_10', name: 'FONT DE LA CORDA', municipality: 'Sant Feliu Sasserra', latitude: 41.9405, longitude: 2.0195, description: 'Costat de la font de la corda.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T14:20:00Z' },
  { id: 'pt_11', name: 'BAUMA SERRAT DEL MOLÍ DE BADIA', municipality: 'Sant Feliu Sasserra', latitude: 41.9390, longitude: 2.0240, description: 'Pessebre al molí de Badia.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T15:00:00Z' },
  { id: 'pt_12', name: 'PUIGLLUSÀ', municipality: 'Sant Feliu Sasserra', latitude: 41.9520, longitude: 2.0250, description: 'Al cim de Puigllusà.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T15:30:00Z' },
  { id: 'pt_13', name: 'BAUMA DE PAHONELLAS', municipality: 'Sant Feliu Sasserra', latitude: 41.9540, longitude: 2.0280, description: 'Pessebre tradicional en rocateres.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T16:00:00Z' },
  { id: 'pt_14', name: 'SERRAT LLOBATER', municipality: 'Sant Feliu Sasserra', latitude: 41.9490, longitude: 2.0300, description: 'Pessebre a la cresta del serrat.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T16:30:00Z' },
  { id: 'pt_15', name: 'FONT PERDUDA', municipality: 'Sant Feliu Sasserra', latitude: 41.9430, longitude: 2.0310, description: 'Prop de la font perduda.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T17:00:00Z' },
  { id: 'pt_16', name: 'MOLÍ DE LA RIBA', municipality: 'Sant Feliu Sasserra', latitude: 41.9380, longitude: 2.0290, description: 'Al vell molí de la riba.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T17:30:00Z' },
  { id: 'pt_17', name: 'XUP DE LES SALERES DELS ARNAUS', municipality: 'Sant Feliu Sasserra', latitude: 41.9350, longitude: 2.0220, description: 'Pessebre a la zona del xup.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T18:00:00Z' },
  { id: 'pt_18', name: 'FARIGOLA', municipality: 'Sant Feliu Sasserra', latitude: 41.9340, longitude: 2.0180, description: 'Envoltat de farigola del bosc.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T18:30:00Z' },
  { id: 'pt_19', name: 'L\'OLIVERA DE CAL PRIM / CAL BASTÓ', municipality: 'Sant Feliu Sasserra', latitude: 41.9320, longitude: 2.0140, description: 'Al peu de l\'olivera centenària.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T19:00:00Z' }
];

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
  // Lluçanès
  { name: 'Sant Feliu Sasserra', comarca: 'Lluçanès', lat: 41.9461, lng: 2.0211 },
  { name: 'Prats de Lluçanès', comarca: 'Lluçanès', lat: 42.0084, lng: 2.0311 },
  { name: 'Olost', comarca: 'Lluçanès', lat: 41.9866, lng: 2.0964 },
  { name: 'Santa Creu de Jutglar (Olost)', comarca: 'Lluçanès', lat: 41.9765, lng: 2.0695 },
  { name: 'Oristà', comarca: 'Lluçanès', lat: 41.9333, lng: 2.0608 },
  { name: 'La Torre d\'Oristà', comarca: 'Lluçanès', lat: 41.9597, lng: 2.0545 },
  { name: 'Perafita', comarca: 'Lluçanès', lat: 42.0431, lng: 2.1086 },
  { name: 'Lluçà', comarca: 'Lluçanès', lat: 42.0681, lng: 2.0736 },
  { name: 'Santa Eulàlia de Puig-oriol (Lluçà)', comarca: 'Lluçanès', lat: 42.0645, lng: 2.0725 },
  { name: 'Sant Martí d\'Albars', comarca: 'Lluçanès', lat: 42.0289, lng: 2.0744 },
  { name: 'Sant Boi de Lluçanès', comarca: 'Lluçanès', lat: 42.0578, lng: 2.1525 },
  { name: 'Sobremunt', comarca: 'Lluçanès', lat: 42.0358, lng: 2.1667 },
  { name: 'Alpens', comarca: 'Lluçanès', lat: 42.1200, lng: 2.1014 },
  { name: 'Sant Agustí de Lluçanès', comarca: 'Lluçanès', lat: 42.0861, lng: 2.1278 },
  { name: 'Sant Bartomeu del Grau', comarca: 'Lluçanès / Osona', lat: 41.9853, lng: 2.1722 },

  // Bages
  { name: 'Avinyó', comarca: 'Bages', lat: 41.8631, lng: 1.9717 },
  { name: 'Santa Maria d\'Oló', comarca: 'Moianès / Bages', lat: 41.8744, lng: 2.0350 },
  { name: 'Artés', comarca: 'Bages', lat: 41.7981, lng: 1.9547 },
  { name: 'Sallent', comarca: 'Bages', lat: 41.8258, lng: 1.8950 },
  { name: 'Balsareny', comarca: 'Bages', lat: 41.8633, lng: 1.8769 },
  { name: 'Navàs', comarca: 'Bages', lat: 41.8994, lng: 1.8794 },
  { name: 'Gaià', comarca: 'Bages', lat: 41.9183, lng: 1.9250 },
  { name: 'Manresa', comarca: 'Bages', lat: 41.7281, lng: 1.8240 },
  { name: 'Santpedor', comarca: 'Bages', lat: 41.7836, lng: 1.8414 },
  { name: 'Sant Fruitós de Bages', comarca: 'Bages', lat: 41.7506, lng: 1.8725 },
  { name: 'Sant Joan de Vilatorrada', comarca: 'Bages', lat: 41.7453, lng: 1.8047 },
  { name: 'Santona / Sant Mateu de Bages', comarca: 'Bages', lat: 41.7969, lng: 1.7328 },
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

  // Solsonès i Ripollès i Cerdanya
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

function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Codificar població i coordenades dins el camp 'email' de Supabase per a compatibilitat 100% amb la taula actual
function encodeMunicipalityMeta(muniName, lat, lng, comarca = '') {
  const cleanName = (muniName || 'Sant Feliu Sasserra').trim();
  const cLat = Number(lat) || 41.9461;
  const cLng = Number(lng) || 2.0211;
  return `muni:${cleanName}|${cLat.toFixed(4)},${cLng.toFixed(4)}|${comarca || ''}`;
}

function decodeMunicipalityMeta(userObj) {
  if (!userObj) {
    return { name: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, comarca: 'Lluçanès' };
  }
  // 1. Si ve codificat a email amb prefix 'muni:'
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
  // 2. Si té propietat municipality
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
  // 3. Per defecte (usuaris antics registrats abans d'afegir població)
  return { name: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, comarca: 'Lluçanès' };
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
    this.init();
  }

  // --- AUTOCOMPLETAT DE MUNICIPIS ---
  getMunicipalitiesList() {
    return CATALONIA_MUNICIPALITIES;
  }

  searchMunicipalities(query, limit = 8) {
    const q = normalizeText(query);
    if (!q) {
      // Si està buit, suggerim primer els pobles del Lluçanès i voltants
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

    // 1. Cercar al catàleg de municipis de Catalunya
    const exactOrPrefix = findPredefinedMunicipality(trimmed);
    if (exactOrPrefix && normalizeText(exactOrPrefix.name) === normalizeText(trimmed)) {
      return exactOrPrefix;
    }

    // 2. Cercar a la memòria cau local
    const cached = getGeocodedCache()[normalizeText(trimmed)];
    if (cached) {
      return { name: trimmed, ...cached };
    }

    // 3. Si és un altre poble escrit lliurement, intentar geolocalitzar-lo amb OpenStreetMap Nominatim
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

    // 4. Fallback si hi ha una coincidència parcial al catàleg o coordenades per defecte
    if (exactOrPrefix) return exactOrPrefix;
    return { name: trimmed, lat: 41.9461, lng: 2.0211, comarca: '' };
  }

  // --- MAPA DE PUNTS ELIMINATS DEFINITIVAMENT ---
  getDeletedPointIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem('pessebres_deleted_point_ids') || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  addDeletedPointId(id) {
    try {
      const deleted = this.getDeletedPointIds();
      deleted.add(id);
      localStorage.setItem('pessebres_deleted_point_ids', JSON.stringify([...deleted]));
    } catch (e) {
      console.warn("Error guardant deleted point id:", e);
    }
  }

  init() {
    // Netejar qualsevol antic mapa de contrasenyes del navegador per privacitat
    localStorage.removeItem('pessebres_user_passwords');

    // 1. Assegurar dades inicials a localStorage si no n'hi ha cap
    const currentPoints = localStorage.getItem(DB_KEYS.POINTS);
    const deletedIds = this.getDeletedPointIds();

    if (!currentPoints) {
      const initialPts = SEED_POINTS.filter(sp => !deletedIds.has(sp.id));
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(initialPts));
    } else {
      let pts = JSON.parse(currentPoints);
      pts = pts.filter(p => !deletedIds.has(p.id) && !p.id.startsWith('prova_') && !(parseInt(p.id.replace('pt_', ''), 10) >= 20 && (p.submitted_by === 'Organització' || p.submitted_by === 'Prova')));
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(pts));
    }

    // Inicialitzar usuaris si no n'hi ha cap (sense contrasenyes en text pla!)
    const storedUsers = localStorage.getItem(DB_KEYS.USERS);
    if (!storedUsers) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([
        { id: 'usr_admin', username: 'admin', municipality: 'Sant Feliu Sasserra', lat: 41.9461, lng: 2.0211, role: 'ADMIN', created_at: new Date().toISOString() }
      ]));
    } else {
      try {
        const cleanUsers = JSON.parse(storedUsers).map(u => this.sanitizeUserObject(u));
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(cleanUsers));
      } catch (e) {}
    }

    if (!localStorage.getItem(DB_KEYS.VISITS)) {
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify([]));
    }

    // Sanejar també l'usuari actual si ja té sessió iniciada
    const cur = this.getCurrentUser();
    if (cur) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(this.sanitizeUserObject(cur)));
    }

    // 2. Connectar a Supabase si s'ha configurat
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
    if (!this.isCloudEnabled || !this.supabase) return;
    try {
      const [resUsers, resPoints, resVisits] = await Promise.all([
        this.supabase.from('users').select('id, username, email, role, created_at'),
        this.supabase.from('nativity_points').select('*'),
        this.supabase.from('visits').select('*')
      ]);

      if (!resUsers.error && resUsers.data) {
        // Guardem només dades públiques (Nom, Població, Coordenades del municipi), MAI contrasenyes ni correus
        const sanitizedUsers = resUsers.data.map(u => this.sanitizeUserObject(u));
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(sanitizedUsers));

        // Actualitzar l'usuari actual si està loguejat
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
        const cleanCloud = resPoints.data.filter(p =>
          !deletedIds.has(p.id) &&
          !p.id.startsWith('prova_') &&
          !(parseInt(p.id.replace('pt_', ''), 10) >= 20 && (p.submitted_by === 'Organització' || p.submitted_by === 'Prova'))
        );
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
    if (!this.isCloudEnabled || !this.supabase) return;
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

  /**
   * Entrada directa per Nom + Població (o accés d'Administrador encriptat amb SHA-256)
   */
  async enterWithMunicipality(username, municipalityName, adminPassword = '') {
    const userTerm = (username || '').trim();
    if (!userTerm) throw new Error("Escriu el teu nom o àlies per participar.");

    // 1. Verificació d'Administrador per Hash SHA-256 (cap contrasenya en text pla al codi)
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
        comarca: 'Lluçanès',
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

    // 3. Comprovar si ja existeix aquest participant (mateix nom i mateixa població, o mateix nom)
    let existing = users.find(
      u => u.role !== 'ADMIN' && normalizeText(u.username) === normUser && normalizeText(u.municipality) === normMuni
    );

    if (!existing) {
      const sameNameUser = users.find(u => u.role !== 'ADMIN' && normalizeText(u.username) === normUser);
      if (sameNameUser) {
        // Si l'usuari ja existia d'abans, actualitzem la seva població i li recuperem la sessió!
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

      if (this.isCloudEnabled && this.supabase) {
        this.supabase.from('users').update({ email: encodedMeta }).eq('id', existing.id).then();
      }

      return { user: existing, isNew: false, isAdmin: false };
    }

    // 4. Crear nou participant (sense contrasenya ni correu personal!)
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

    if (this.isCloudEnabled && this.supabase) {
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

    if (this.isCloudEnabled && this.supabase) {
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

    if (this.isCloudEnabled && this.supabase) {
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

      if (this.isCloudEnabled && this.supabase) {
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

      if (this.isCloudEnabled && this.supabase) {
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

    if (this.isCloudEnabled && this.supabase) {
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

      if (this.isCloudEnabled && this.supabase) {
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

      if (this.isCloudEnabled && this.supabase) {
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

      if (this.isCloudEnabled && this.supabase) {
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

      if (this.isCloudEnabled && this.supabase) {
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

  getCreatedLeaderboard() {
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');
    const points = this.getApprovedPoints();

    const userCreatedCounts = {};
    users.forEach(u => {
      userCreatedCounts[u.id] = 0;
    });

    points.forEach(p => {
      const matchUser = users.find(u => u.username.toLowerCase() === (p.submitted_by || '').toLowerCase());
      if (matchUser) {
        userCreatedCounts[matchUser.id] += 1;
      }
    });

    const leaderboard = users.map(u => {
      const muniMeta = decodeMunicipalityMeta(u);
      return {
        id: u.id,
        username: u.username,
        municipality: muniMeta.name,
        createdCount: userCreatedCounts[u.id] || 0
      };
    });

    leaderboard.sort((a, b) => b.createdCount - a.createdCount);

    return leaderboard.map((item, index) => ({
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
