import * as XLSX from 'xlsx';
import { resolveProvince, normalizeName } from './provinces.js';

// Keywords used to locate the header row and classify columns.
const HEADER_HINTS = [
  'provincia', 'premio', 'prezzo', 'medio', 'variazione', 'var',
  'autovetture', 'autovettura', 'auto', 'motocicli', 'motociclo',
  'ciclomotori', 'ciclomotore', 'trimestre', 'annua', 'territorio',
];

const VEHICLE_PATTERNS = [
  { type: 'autovetture', re: /autovett|auto(?!\w)/ },
  { type: 'motocicli', re: /motocicl|moto(?!r)/ },
  { type: 'ciclomotori', re: /ciclomot/ },
];

// Parse a possibly-string numeric cell. Handles Italian decimal commas and thousands dots.
export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let s = String(value).trim();
  if (!s) return null;
  s = s.replace(/[€%\s]/g, '');
  // If both separators present, assume '.' thousands and ',' decimal (IT format).
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Classify a header cell text into { vehicleType, metric }.
function classifyHeader(headerText) {
  const norm = normalizeName(headerText);
  let vehicleType = null;
  for (const { type, re } of VEHICLE_PATTERNS) {
    if (re.test(norm)) { vehicleType = type; break; }
  }
  let metric = 'premio_medio';
  if (/\bvar\b|variazione|annua|tendenz/.test(norm) || String(headerText).includes('%')) {
    metric = 'variazione_annua';
  }
  return { vehicleType, metric };
}

// Find the header row index: the row with the most HEADER_HINTS keyword hits.
function findHeaderRow(rows) {
  let best = { idx: -1, score: 0 };
  const scanLimit = Math.min(rows.length, 25);
  for (let i = 0; i < scanLimit; i++) {
    const joined = normalizeName(rows[i].join(' '));
    let score = 0;
    for (const hint of HEADER_HINTS) if (joined.includes(hint)) score++;
    if (score > best.score) best = { idx: i, score };
  }
  return best.score >= 2 ? best.idx : -1;
}

// Identify which column holds province names by scanning data rows for province matches.
function findProvinceColumn(rows, startRow) {
  const colHits = {};
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    for (let c = 0; c < row.length; c++) {
      if (resolveProvince(row[c])) colHits[c] = (colHits[c] || 0) + 1;
    }
  }
  let bestCol = -1; let bestHits = 0;
  for (const [c, hits] of Object.entries(colHits)) {
    if (hits > bestHits) { bestHits = hits; bestCol = Number(c); }
  }
  // Need a meaningful number of province matches to trust the column.
  return bestHits >= 5 ? bestCol : -1;
}

// Parse one worksheet into raw value records.
function parseSheet(sheet, sheetName) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  if (!rows.length) return [];

  const headerIdx = findHeaderRow(rows);
  const dataStart = headerIdx >= 0 ? headerIdx + 1 : 0;
  const provinceCol = findProvinceColumn(rows, dataStart);
  if (provinceCol < 0) return []; // sheet has no province table

  // Build column metadata from the header row (and the row above, if merged headers).
  const headerRow = headerIdx >= 0 ? rows[headerIdx] : [];
  const aboveRow = headerIdx > 0 ? rows[headerIdx - 1] : [];
  const sheetVehicle = classifyHeader(sheetName).vehicleType;

  const records = [];
  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const prov = resolveProvince(row[provinceCol]);
    if (!prov) continue;

    for (let c = 0; c < row.length; c++) {
      if (c === provinceCol) continue;
      const value = toNumber(row[c]);
      if (value === null) continue;

      const headerText = [aboveRow[c], headerRow[c]].filter(Boolean).join(' ');
      const cls = classifyHeader(headerText);
      const vehicleType = cls.vehicleType || sheetVehicle || 'autovetture';

      // Heuristic guard: a premio_medio in euro is realistically 50–3000.
      // Values that look like percentages get reclassified as variazione.
      let metric = cls.metric;
      if (metric === 'premio_medio' && Math.abs(value) < 50 && headerText === '') {
        metric = 'variazione_annua';
      }

      records.push({
        provincia: prov.name,
        sigla: prov.sigla,
        regione: prov.regione,
        macroarea: prov.macroarea,
        vehicleType,
        metric,
        value,
        rawProvinceLabel: String(row[provinceCol]).trim(),
        columnIndex: c,
        columnHeader: headerText || null,
        sheetName,
      });
    }
  }
  return records;
}

// Public: parse an XLSX buffer (the IVASS "tavole_*.xlsx") into raw province records.
export function parseTavoleWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const out = [];
  for (const sheetName of wb.SheetNames) {
    try {
      out.push(...parseSheet(wb.Sheets[sheetName], sheetName));
    } catch (err) {
      // Keep going on a bad sheet rather than failing the whole file.
      out.push({ _error: true, sheetName, message: err.message });
    }
  }
  return out;
}
