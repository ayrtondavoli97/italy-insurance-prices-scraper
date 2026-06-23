// Canonical mapping of Italian provinces / metropolitan cities to
// sigla (plate code), region and macro-area (Nord-Ovest, Nord-Est, Centro, Sud, Isole).
// Used both to (a) reliably detect province rows inside IVASS tables and
// (b) build regional / macro-area aggregates.
//
// Keys are NORMALIZED province names (see normalizeName). Several historical /
// alternate spellings are included so the matcher is robust to how IVASS labels rows.

export const PROVINCES = {
  // Piemonte
  torino: { name: 'Torino', sigla: 'TO', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  vercelli: { name: 'Vercelli', sigla: 'VC', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  novara: { name: 'Novara', sigla: 'NO', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  cuneo: { name: 'Cuneo', sigla: 'CN', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  asti: { name: 'Asti', sigla: 'AT', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  alessandria: { name: 'Alessandria', sigla: 'AL', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  biella: { name: 'Biella', sigla: 'BI', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  'verbano cusio ossola': { name: 'Verbano-Cusio-Ossola', sigla: 'VB', regione: 'Piemonte', macroarea: 'Nord-Ovest' },
  // Valle d'Aosta
  aosta: { name: 'Aosta', sigla: 'AO', regione: "Valle d'Aosta", macroarea: 'Nord-Ovest' },
  'valle d aosta': { name: 'Aosta', sigla: 'AO', regione: "Valle d'Aosta", macroarea: 'Nord-Ovest' },
  // Lombardia
  varese: { name: 'Varese', sigla: 'VA', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  como: { name: 'Como', sigla: 'CO', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  sondrio: { name: 'Sondrio', sigla: 'SO', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  milano: { name: 'Milano', sigla: 'MI', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  bergamo: { name: 'Bergamo', sigla: 'BG', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  brescia: { name: 'Brescia', sigla: 'BS', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  pavia: { name: 'Pavia', sigla: 'PV', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  cremona: { name: 'Cremona', sigla: 'CR', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  mantova: { name: 'Mantova', sigla: 'MN', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  lecco: { name: 'Lecco', sigla: 'LC', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  lodi: { name: 'Lodi', sigla: 'LO', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  'monza e della brianza': { name: 'Monza e della Brianza', sigla: 'MB', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  'monza brianza': { name: 'Monza e della Brianza', sigla: 'MB', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  monza: { name: 'Monza e della Brianza', sigla: 'MB', regione: 'Lombardia', macroarea: 'Nord-Ovest' },
  // Trentino-Alto Adige
  bolzano: { name: 'Bolzano', sigla: 'BZ', regione: 'Trentino-Alto Adige', macroarea: 'Nord-Est' },
  'bolzano bozen': { name: 'Bolzano', sigla: 'BZ', regione: 'Trentino-Alto Adige', macroarea: 'Nord-Est' },
  trento: { name: 'Trento', sigla: 'TN', regione: 'Trentino-Alto Adige', macroarea: 'Nord-Est' },
  // Veneto
  verona: { name: 'Verona', sigla: 'VR', regione: 'Veneto', macroarea: 'Nord-Est' },
  vicenza: { name: 'Vicenza', sigla: 'VI', regione: 'Veneto', macroarea: 'Nord-Est' },
  belluno: { name: 'Belluno', sigla: 'BL', regione: 'Veneto', macroarea: 'Nord-Est' },
  treviso: { name: 'Treviso', sigla: 'TV', regione: 'Veneto', macroarea: 'Nord-Est' },
  venezia: { name: 'Venezia', sigla: 'VE', regione: 'Veneto', macroarea: 'Nord-Est' },
  padova: { name: 'Padova', sigla: 'PD', regione: 'Veneto', macroarea: 'Nord-Est' },
  rovigo: { name: 'Rovigo', sigla: 'RO', regione: 'Veneto', macroarea: 'Nord-Est' },
  // Friuli-Venezia Giulia
  udine: { name: 'Udine', sigla: 'UD', regione: 'Friuli-Venezia Giulia', macroarea: 'Nord-Est' },
  gorizia: { name: 'Gorizia', sigla: 'GO', regione: 'Friuli-Venezia Giulia', macroarea: 'Nord-Est' },
  trieste: { name: 'Trieste', sigla: 'TS', regione: 'Friuli-Venezia Giulia', macroarea: 'Nord-Est' },
  pordenone: { name: 'Pordenone', sigla: 'PN', regione: 'Friuli-Venezia Giulia', macroarea: 'Nord-Est' },
  // Liguria
  imperia: { name: 'Imperia', sigla: 'IM', regione: 'Liguria', macroarea: 'Nord-Ovest' },
  savona: { name: 'Savona', sigla: 'SV', regione: 'Liguria', macroarea: 'Nord-Ovest' },
  genova: { name: 'Genova', sigla: 'GE', regione: 'Liguria', macroarea: 'Nord-Ovest' },
  'la spezia': { name: 'La Spezia', sigla: 'SP', regione: 'Liguria', macroarea: 'Nord-Ovest' },
  // Emilia-Romagna
  piacenza: { name: 'Piacenza', sigla: 'PC', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  parma: { name: 'Parma', sigla: 'PR', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  'reggio emilia': { name: "Reggio nell'Emilia", sigla: 'RE', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  "reggio nell emilia": { name: "Reggio nell'Emilia", sigla: 'RE', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  modena: { name: 'Modena', sigla: 'MO', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  bologna: { name: 'Bologna', sigla: 'BO', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  ferrara: { name: 'Ferrara', sigla: 'FE', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  ravenna: { name: 'Ravenna', sigla: 'RA', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  'forli cesena': { name: 'Forlì-Cesena', sigla: 'FC', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  rimini: { name: 'Rimini', sigla: 'RN', regione: 'Emilia-Romagna', macroarea: 'Nord-Est' },
  // Toscana
  'massa carrara': { name: 'Massa-Carrara', sigla: 'MS', regione: 'Toscana', macroarea: 'Centro' },
  lucca: { name: 'Lucca', sigla: 'LU', regione: 'Toscana', macroarea: 'Centro' },
  pistoia: { name: 'Pistoia', sigla: 'PT', regione: 'Toscana', macroarea: 'Centro' },
  firenze: { name: 'Firenze', sigla: 'FI', regione: 'Toscana', macroarea: 'Centro' },
  livorno: { name: 'Livorno', sigla: 'LI', regione: 'Toscana', macroarea: 'Centro' },
  pisa: { name: 'Pisa', sigla: 'PI', regione: 'Toscana', macroarea: 'Centro' },
  arezzo: { name: 'Arezzo', sigla: 'AR', regione: 'Toscana', macroarea: 'Centro' },
  siena: { name: 'Siena', sigla: 'SI', regione: 'Toscana', macroarea: 'Centro' },
  grosseto: { name: 'Grosseto', sigla: 'GR', regione: 'Toscana', macroarea: 'Centro' },
  prato: { name: 'Prato', sigla: 'PO', regione: 'Toscana', macroarea: 'Centro' },
  // Umbria
  perugia: { name: 'Perugia', sigla: 'PG', regione: 'Umbria', macroarea: 'Centro' },
  terni: { name: 'Terni', sigla: 'TR', regione: 'Umbria', macroarea: 'Centro' },
  // Marche
  'pesaro e urbino': { name: 'Pesaro e Urbino', sigla: 'PU', regione: 'Marche', macroarea: 'Centro' },
  'pesaro urbino': { name: 'Pesaro e Urbino', sigla: 'PU', regione: 'Marche', macroarea: 'Centro' },
  ancona: { name: 'Ancona', sigla: 'AN', regione: 'Marche', macroarea: 'Centro' },
  macerata: { name: 'Macerata', sigla: 'MC', regione: 'Marche', macroarea: 'Centro' },
  'ascoli piceno': { name: 'Ascoli Piceno', sigla: 'AP', regione: 'Marche', macroarea: 'Centro' },
  fermo: { name: 'Fermo', sigla: 'FM', regione: 'Marche', macroarea: 'Centro' },
  // Lazio
  viterbo: { name: 'Viterbo', sigla: 'VT', regione: 'Lazio', macroarea: 'Centro' },
  rieti: { name: 'Rieti', sigla: 'RI', regione: 'Lazio', macroarea: 'Centro' },
  roma: { name: 'Roma', sigla: 'RM', regione: 'Lazio', macroarea: 'Centro' },
  latina: { name: 'Latina', sigla: 'LT', regione: 'Lazio', macroarea: 'Centro' },
  frosinone: { name: 'Frosinone', sigla: 'FR', regione: 'Lazio', macroarea: 'Centro' },
  // Abruzzo
  'l aquila': { name: "L'Aquila", sigla: 'AQ', regione: 'Abruzzo', macroarea: 'Sud' },
  aquila: { name: "L'Aquila", sigla: 'AQ', regione: 'Abruzzo', macroarea: 'Sud' },
  teramo: { name: 'Teramo', sigla: 'TE', regione: 'Abruzzo', macroarea: 'Sud' },
  pescara: { name: 'Pescara', sigla: 'PE', regione: 'Abruzzo', macroarea: 'Sud' },
  chieti: { name: 'Chieti', sigla: 'CH', regione: 'Abruzzo', macroarea: 'Sud' },
  // Molise
  campobasso: { name: 'Campobasso', sigla: 'CB', regione: 'Molise', macroarea: 'Sud' },
  isernia: { name: 'Isernia', sigla: 'IS', regione: 'Molise', macroarea: 'Sud' },
  // Campania
  caserta: { name: 'Caserta', sigla: 'CE', regione: 'Campania', macroarea: 'Sud' },
  benevento: { name: 'Benevento', sigla: 'BN', regione: 'Campania', macroarea: 'Sud' },
  napoli: { name: 'Napoli', sigla: 'NA', regione: 'Campania', macroarea: 'Sud' },
  avellino: { name: 'Avellino', sigla: 'AV', regione: 'Campania', macroarea: 'Sud' },
  salerno: { name: 'Salerno', sigla: 'SA', regione: 'Campania', macroarea: 'Sud' },
  // Puglia
  'foggia': { name: 'Foggia', sigla: 'FG', regione: 'Puglia', macroarea: 'Sud' },
  'bari': { name: 'Bari', sigla: 'BA', regione: 'Puglia', macroarea: 'Sud' },
  taranto: { name: 'Taranto', sigla: 'TA', regione: 'Puglia', macroarea: 'Sud' },
  brindisi: { name: 'Brindisi', sigla: 'BR', regione: 'Puglia', macroarea: 'Sud' },
  lecce: { name: 'Lecce', sigla: 'LE', regione: 'Puglia', macroarea: 'Sud' },
  'barletta andria trani': { name: 'Barletta-Andria-Trani', sigla: 'BT', regione: 'Puglia', macroarea: 'Sud' },
  // Basilicata
  potenza: { name: 'Potenza', sigla: 'PZ', regione: 'Basilicata', macroarea: 'Sud' },
  matera: { name: 'Matera', sigla: 'MT', regione: 'Basilicata', macroarea: 'Sud' },
  // Calabria
  cosenza: { name: 'Cosenza', sigla: 'CS', regione: 'Calabria', macroarea: 'Sud' },
  catanzaro: { name: 'Catanzaro', sigla: 'CZ', regione: 'Calabria', macroarea: 'Sud' },
  'reggio calabria': { name: 'Reggio di Calabria', sigla: 'RC', regione: 'Calabria', macroarea: 'Sud' },
  'reggio di calabria': { name: 'Reggio di Calabria', sigla: 'RC', regione: 'Calabria', macroarea: 'Sud' },
  crotone: { name: 'Crotone', sigla: 'KR', regione: 'Calabria', macroarea: 'Sud' },
  'vibo valentia': { name: 'Vibo Valentia', sigla: 'VV', regione: 'Calabria', macroarea: 'Sud' },
  // Sicilia
  trapani: { name: 'Trapani', sigla: 'TP', regione: 'Sicilia', macroarea: 'Isole' },
  palermo: { name: 'Palermo', sigla: 'PA', regione: 'Sicilia', macroarea: 'Isole' },
  messina: { name: 'Messina', sigla: 'ME', regione: 'Sicilia', macroarea: 'Isole' },
  agrigento: { name: 'Agrigento', sigla: 'AG', regione: 'Sicilia', macroarea: 'Isole' },
  caltanissetta: { name: 'Caltanissetta', sigla: 'CL', regione: 'Sicilia', macroarea: 'Isole' },
  enna: { name: 'Enna', sigla: 'EN', regione: 'Sicilia', macroarea: 'Isole' },
  catania: { name: 'Catania', sigla: 'CT', regione: 'Sicilia', macroarea: 'Isole' },
  ragusa: { name: 'Ragusa', sigla: 'RG', regione: 'Sicilia', macroarea: 'Isole' },
  siracusa: { name: 'Siracusa', sigla: 'SR', regione: 'Sicilia', macroarea: 'Isole' },
  // Sardegna
  sassari: { name: 'Sassari', sigla: 'SS', regione: 'Sardegna', macroarea: 'Isole' },
  nuoro: { name: 'Nuoro', sigla: 'NU', regione: 'Sardegna', macroarea: 'Isole' },
  cagliari: { name: 'Cagliari', sigla: 'CA', regione: 'Sardegna', macroarea: 'Isole' },
  oristano: { name: 'Oristano', sigla: 'OR', regione: 'Sardegna', macroarea: 'Isole' },
  'sud sardegna': { name: 'Sud Sardegna', sigla: 'SU', regione: 'Sardegna', macroarea: 'Isole' },
};

// Normalize a raw cell string into a lookup key:
// lowercase, strip accents, replace any non-alphanumeric run with a single space, trim.
export function normalizeName(raw) {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Resolve a raw province label to its canonical record, or null if not a known province.
export function resolveProvince(raw) {
  const key = normalizeName(raw);
  if (!key) return null;
  if (PROVINCES[key]) return PROVINCES[key];
  // Fallback: some tables append the sigla, e.g. "Napoli (NA)" -> "napoli na"
  const stripped = key.replace(/\b[a-z]{2}\b$/, '').trim();
  if (stripped && PROVINCES[stripped]) return PROVINCES[stripped];
  return null;
}

export const PROVINCE_COUNT = new Set(Object.values(PROVINCES).map((p) => p.sigla)).size;
