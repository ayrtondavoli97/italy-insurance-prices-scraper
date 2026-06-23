import * as XLSX from 'xlsx';
import { parseTavoleWorkbook, toNumber } from '../src/parser.js';
import {
  buildRegionalAggregates,
  buildNationalAggregates,
  buildMacroareaAggregates,
} from '../src/aggregate.js';
import { resolveProvince, PROVINCE_COUNT } from '../src/provinces.js';

function assert(cond, msg) {
  if (!cond) { console.error('❌ FAIL:', msg); process.exitCode = 1; }
  else console.log('✓', msg);
}

// --- unit: number parsing (Italian formats) ---
assert(toNumber('512,30') === 512.3, 'parses Italian decimal comma');
assert(toNumber('1.234,50') === 1234.5, 'parses IT thousands dot + decimal comma');
assert(toNumber('436.8') === 436.8, 'parses plain decimal point');
assert(toNumber('  4,1%') === 4.1, 'strips percent and spaces');
assert(toNumber('') === null && toNumber('n.d.') === null, 'rejects empty / non-numeric');

// --- unit: province resolution ---
assert(resolveProvince('Napoli').regione === 'Campania', 'resolves Napoli → Campania');
assert(resolveProvince("Reggio Emilia").sigla === 'RE', 'resolves alt spelling Reggio Emilia');
assert(resolveProvince('Forlì-Cesena').sigla === 'FC', 'resolves accented Forlì-Cesena');
assert(resolveProvince('xyz') === null, 'rejects non-province');
console.log(`   (province table has ${PROVINCE_COUNT} distinct provinces)`);

// --- build a synthetic workbook resembling the IVASS "tavole" layout ---
const aoa = [
  ['Tavola 3 - Premio medio r.c. auto per provincia (euro) - IV trimestre 2025'],
  [],
  ['Provincia', 'Premio medio autovetture', 'Var. annua autovetture', 'Premio medio motocicli', 'Premio medio ciclomotori'],
  ['Torino',   '395,20', '2,1', '210,00', '150,00'],
  ['Milano',   '380,10', '1,8', '230,50', '160,00'],
  ['Bologna',  '372,00', '2,5', '205,00', '140,00'],
  ['Firenze',  '410,40', '3,0', '240,00', '170,00'],
  ['Roma',     '430,90', '3,4', '260,00', '180,00'],
  ['Napoli',   '512,30', '4,5', '590,00', '452,00'],
  ['Caserta',  '498,70', '4,2', '470,00', '400,00'],
  ['Salerno',  '450,10', '3,9', '300,00', '250,00'],
  ['Palermo',  '470,00', '4,0', '320,00', '260,00'],
  ['Cagliari', '405,00', '2,8', '215,00', '155,00'],
  ['Totale Italia', '436,80', '5,0', '329,00', '211,00'], // should be ignored (not a province)
  [],
  ['Fonte: IVASS, indagine IPER'],
];
const ws = XLSX.utils.aoa_to_sheet(aoa);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Premio medio provincia');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

// --- run the parser ---
const records = parseTavoleWorkbook(buffer).filter((r) => !r._error);
const provinces = new Set(records.map((r) => r.provincia));

console.log('\n--- parser output sample ---');
console.table(records.slice(0, 6).map((r) => ({
  provincia: r.provincia, regione: r.regione, vehicle: r.vehicleType, metric: r.metric, value: r.value,
})));

assert(provinces.size === 10, `parsed all 10 provinces (got ${provinces.size})`);
assert(!provinces.has('Totale Italia'), 'ignored the "Totale Italia" non-province row');

const napoliAuto = records.find((r) => r.provincia === 'Napoli' && r.vehicleType === 'autovetture' && r.metric === 'premio_medio');
assert(napoliAuto && napoliAuto.value === 512.3, `Napoli car premium = 512.30 (got ${napoliAuto?.value})`);

const napoliVar = records.find((r) => r.provincia === 'Napoli' && r.vehicleType === 'autovetture' && r.metric === 'variazione_annua');
assert(napoliVar && napoliVar.value === 4.5, `Napoli car YoY var classified correctly (got ${napoliVar?.value})`);

const napoliMoto = records.find((r) => r.provincia === 'Napoli' && r.vehicleType === 'motocicli' && r.metric === 'premio_medio');
assert(napoliMoto && napoliMoto.value === 590, `Napoli motorcycle premium = 590 (got ${napoliMoto?.value})`);

// --- aggregation ---
const meta = { period: '2025-Q4', source: 'IPER' };
const regional = buildRegionalAggregates(records, meta);
const campaniaAuto = regional.find((r) => r.regione === 'Campania' && r.vehicleType === 'autovetture');
const expectedCampania = Math.round(((512.3 + 498.7 + 450.1) / 3) * 100) / 100;
assert(campaniaAuto && campaniaAuto.premioMedio === expectedCampania,
  `Campania regional avg car premium = ${expectedCampania} (got ${campaniaAuto?.premioMedio})`);
assert(campaniaAuto.provinceCount === 3, 'Campania aggregate counts 3 provinces');

const macro = buildMacroareaAggregates(records, meta);
const sudAuto = macro.find((r) => r.macroarea === 'Sud' && r.vehicleType === 'autovetture');
assert(sudAuto && sudAuto.provinceCount === 3, 'Sud macro-area counts Napoli+Caserta+Salerno');

const national = buildNationalAggregates(records, meta);
const natAuto = national.find((r) => r.vehicleType === 'autovetture');
assert(natAuto && natAuto.provinceCount === 10, 'national car aggregate spans all 10 provinces');

console.log('\n--- regional aggregates (cars) ---');
console.table(regional.filter((r) => r.vehicleType === 'autovetture')
  .map((r) => ({ regione: r.regione, premioMedio: r.premioMedio, n: r.provinceCount })));

console.log('\n--- national (cars) ---', national.filter((r) => r.vehicleType === 'autovetture'));

console.log(`\n${process.exitCode ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED'}`);
