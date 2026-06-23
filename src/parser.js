import * as XLSX from 'xlsx';
import { resolveProvinceAny, resolveRegion, normalizeName } from './provinces.js';

// The IVASS IPER "tavole" workbook is in tidy/long format: each data sheet has a
// header row starting with "Rilevazione" (vehicle type), then "Periodo", a dimension
// column (Regione / Provincia / …), and value columns (Media, % variazione, Num. contratti, …).
//
// This parser targets the two geographic tables we care about for a price dataset:
//   • "Premio per provincia"  (per-province average premium + percentiles + YoY + contracts)
//   • "Premio per regione"    (official contract-weighted regional average + YoY + contracts)
// It deliberately ignores the many cross-tab sheets (age, bonus-malus, gender, black-box, …).

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let s = String(value).trim();
  if (!s || s === '.' || s === '-' || s === 'n.d.' || s === 'nd') return null;
  s = s.replace(/[€%\s]/g, '');
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// "3 trimestre/2025" → { period: "2025-Q3", periodType: "trimestre", refYear: 2025 }
export function normalizePeriodCell(raw) {
  const s = String(raw || '').toLowerCase();
  const q = s.match(/(\d)\s*trimestre\s*\/?\s*(\d{4})/);
  if (q) return { period: `${q[2]}-Q${q[1]}`, periodType: 'trimestre', refYear: Number(q[2]) };
  const y = s.match(/(\d{4})/);
  return { period: y ? y[1] : null, periodType: 'annuale', refYear: y ? Number(y[1]) : null };
}

const VEHICLE_MAP = { autovetture: 'autovetture', motocicli: 'motocicli', ciclomotori: 'ciclomotori' };
function normVehicle(raw) {
  return VEHICLE_MAP[normalizeName(raw)] || null;
}

// Read a sheet, locate its "Rilevazione" header row, return { headers, headerIdx, dataRows, title }.
function readSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
  if (!rows.length) return null;
  const title = String(rows[0]?.[0] || '');
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    if (normalizeName(rows[i][0]) === 'rilevazione') { headerIdx = i; break; }
  }
  if (headerIdx < 0) return null;
  return { title, headers: rows[headerIdx].map((h) => normalizeName(h)), headerIdx, rows };
}

// Find a column index whose normalized header matches any of the given predicates/strings.
function findCol(headers, matchers) {
  for (let c = 0; c < headers.length; c++) {
    for (const m of matchers) {
      if (typeof m === 'string' ? headers[c] === m : m.test(headers[c])) return c;
    }
  }
  return -1;
}

function parseProvinceSheet(sheet) {
  const { headers, headerIdx, rows } = sheet;
  const cVehicle = findCol(headers, ['rilevazione']);
  const cPeriod = findCol(headers, ['periodo']);
  const cProv = findCol(headers, ['provincia']);
  const cMedia = findCol(headers, ['media']);
  const cVar = findCol(headers, [/variazione/]);
  const cN = findCol(headers, [/num.*contratti/, /n.*contratti/]);
  const cCv = findCol(headers, [/c\s*v/]);
  const perc = {
    p5: findCol(headers, [/5.*perc/]), p10: findCol(headers, [/10.*perc/]),
    p25: findCol(headers, [/25.*perc/]), p50: findCol(headers, [/50.*perc/]),
    p75: findCol(headers, [/75.*perc/]), p95: findCol(headers, [/95.*perc/]),
    p99: findCol(headers, [/99.*perc/]),
  };

  const out = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const vehicleType = normVehicle(r[cVehicle]);
    const prov = resolveProvinceAny(r[cProv]);
    const premioMedio = toNumber(r[cMedia]);
    if (!vehicleType || !prov || premioMedio === null) continue;
    const rec = {
      level: 'provincia',
      provincia: prov.name,
      sigla: prov.sigla,
      regione: prov.regione,
      macroarea: prov.macroarea,
      vehicleType,
      premioMedio,
      variazioneAnnua: cVar >= 0 ? toNumber(r[cVar]) : null,
      numContratti: cN >= 0 ? toNumber(r[cN]) : null,
      cv: cCv >= 0 ? toNumber(r[cCv]) : null,
      ...Object.fromEntries(Object.entries(perc).map(([k, idx]) => [k, idx >= 0 ? toNumber(r[idx]) : null])),
      ...normalizePeriodCell(r[cPeriod]),
    };
    out.push(rec);
  }
  return out;
}

function parseRegionSheet(sheet) {
  const { headers, headerIdx, rows } = sheet;
  const cVehicle = findCol(headers, ['rilevazione']);
  const cPeriod = findCol(headers, ['periodo']);
  const cReg = findCol(headers, ['regione']);
  const cMedia = findCol(headers, ['media']);
  const cVar = findCol(headers, [/variazione/]);
  const cN = findCol(headers, [/num.*contratti/, /n.*contratti/]);
  const cCv = findCol(headers, [/c\s*v/]);

  const out = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const vehicleType = normVehicle(r[cVehicle]);
    const reg = resolveRegion(r[cReg]);
    const premioMedio = toNumber(r[cMedia]);
    if (!vehicleType || !reg || premioMedio === null) continue;
    out.push({
      level: 'regione',
      regione: reg.regione,
      macroarea: reg.macroarea,
      vehicleType,
      premioMedio,
      variazioneAnnua: cVar >= 0 ? toNumber(r[cVar]) : null,
      numContratti: cN >= 0 ? toNumber(r[cN]) : null,
      cv: cCv >= 0 ? toNumber(r[cCv]) : null,
      ...normalizePeriodCell(r[cPeriod]),
    });
  }
  return out;
}

// Parse the workbook → { province: [...], regione: [...] }.
export function parseIvassWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const result = { province: [], regione: [] };

  for (const name of wb.SheetNames) {
    const sheet = readSheet(wb.Sheets[name]);
    if (!sheet) continue;
    const t = normalizeName(sheet.title);
    const headers = sheet.headers;
    const hasProvincia = headers.includes('provincia');
    const hasRegione = headers.includes('regione');
    // Geographic premium tables only: must have Media and a geo dimension, and NOT be a
    // cross-tab by age / bonus-malus / gender / black-box.
    const isCrossTab = /(classe|bonus|genere|scatola|eta)/.test(t)
      || headers.some((h) => /(classe|bonus|genere|scatola)/.test(h));

    if (hasProvincia && /premio per provincia/.test(t) && !isCrossTab) {
      result.province.push(...parseProvinceSheet(sheet));
    } else if (hasRegione && /premio per regione/.test(t) && !isCrossTab) {
      result.regione.push(...parseRegionSheet(sheet));
    }
  }
  return result;
}
