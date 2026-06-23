import * as XLSX from 'xlsx';
import { parseIvassWorkbook, toNumber, normalizePeriodCell } from '../src/parser.js';
import { buildMacroareaAggregates, buildNationalAggregates } from '../src/aggregate.js';
import { resolveProvinceAny, resolveRegion } from '../src/provinces.js';

let fails = 0;
const ok = (c, m) => { if (!c) { console.error('❌', m); fails++; } else console.log('✓', m); };

ok(toNumber('512,30') === 512.3, 'IT decimal comma');
ok(toNumber('.') === null && toNumber('') === null, 'rejects "." and empty');
ok(normalizePeriodCell('3 trimestre/2025').period === '2025-Q3', 'period "3 trimestre/2025" -> 2025-Q3');
ok(resolveProvinceAny('NA').regione === 'Campania', 'sigla NA -> Campania');
ok(resolveProvinceAny('Agrigento').sigla === 'AG', 'name Agrigento -> AG');
ok(resolveRegion('Friuli-V.G.').regione === 'Friuli-Venezia Giulia', 'region abbrev Friuli-V.G.');
ok(resolveRegion('Emilia Romagna').macroarea === 'Nord-Est', 'region Emilia Romagna -> Nord-Est');

// Synthetic workbook reproducing the IVASS long format (province + region tables + a cross-tab to ignore).
const wb = XLSX.utils.book_new();
const prov = [
  ['Tavola A12 - Premio per provincia nel trimestre \'3\''],
  ['Rilevazione','Periodo','Provincia','Media','5° Perc.','50° Perc.','99° Perc.','C.v. %','Num. contratti','% contratti','% variazione'],
  ['Autovetture','3 trimestre/2025','NA','617.4','277','558.5','1731.4','47.6','71190','3.6','3.1'],
  ['Autovetture','3 trimestre/2025','MI','412.7','200','380','1200','54','318111','16','5.9'],
  ['Motocicli','3 trimestre/2025','NA','590','150','450','1500','60','30000','5','8'],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prov), 'tavola_12');
const reg = [
  ['Tavola A11 - Premio per regione nel trimestre \'3\''],
  ['Rilevazione','Periodo','Regione','Media','C.v. %','% variazione','Num. contratti','% contratti'],
  ['Autovetture','3 trimestre/2025','Campania','537.9','52','3.3','156783','7.9'],
  ['Autovetture','3 trimestre/2025','Lombardia','412.7','54.7','5.9','318111','16.1'],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(reg), 'tavola_11');
const cross = [
  ['Tavola A15 - Premio per provincia e classe di età nel trimestre \'3\''],
  ['Rilevazione','Periodo','Provincia','Classe d\'età','Media','Num. contratti'],
  ['Autovetture','3 trimestre/2025','Agrigento','1: Fino a 24','797.2','142'],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cross), 'tavola_15');

const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const { province, regione } = parseIvassWorkbook(buf);

ok(province.length === 3, `parsed 3 province rows (got ${province.length})`);
ok(!province.some((r) => r.provincia === 'Agrigento'), 'ignored the age cross-tab sheet (tavola_15)');
const na = province.find((r) => r.sigla === 'NA' && r.vehicleType === 'autovetture');
ok(na.premioMedio === 617.4 && na.p50 === 558.5 && na.numContratti === 71190, 'Napoli auto fields correct');
ok(regione.length === 2 && regione[0].macroarea === 'Sud', 'parsed region table with macroarea');

const nat = buildNationalAggregates(province.filter((r) => r.vehicleType === 'autovetture'), {});
// weighted: (617.4*71190 + 412.7*318111) / (71190+318111)
const exp = Math.round(((617.4*71190 + 412.7*318111)/(71190+318111))*100)/100;
ok(nat[0].premioMedio === exp, `national weighted mean = ${exp} (got ${nat[0].premioMedio})`);

const macro = buildMacroareaAggregates(province.filter((r) => r.vehicleType === 'autovetture'), {});
ok(macro.find((m) => m.macroarea === 'Sud').premioMedio === 617.4, 'Sud macro = Napoli only');

console.log(fails ? `\n${fails} TEST FALLITI` : '\nTUTTI I TEST PASSATI');
process.exitCode = fails ? 1 : 0;
