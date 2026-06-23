// Build macro-area and national aggregates from per-province records.
// Uses a CONTRACT-WEIGHTED mean (weighted by numContratti) when contract counts are
// available, falling back to an unweighted mean otherwise. This matches how IVASS
// reports territorial averages far better than a naive province mean.

function weightedMean(items) {
  const withW = items.filter((i) => i.numContratti && i.premioMedio !== null);
  if (withW.length === items.length && withW.length) {
    const num = withW.reduce((a, i) => a + i.premioMedio * i.numContratti, 0);
    const den = withW.reduce((a, i) => a + i.numContratti, 0);
    return den ? Math.round((num / den) * 100) / 100 : null;
  }
  const vals = items.map((i) => i.premioMedio).filter((v) => v !== null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

function groupBy(records, keyFn) {
  const m = new Map();
  for (const r of records) {
    if (r.premioMedio === null) continue;
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

export function buildMacroareaAggregates(provinceRecords, meta) {
  const groups = groupBy(provinceRecords, (r) => `${r.macroarea}||${r.vehicleType}`);
  const out = [];
  for (const [key, items] of groups) {
    const [macroarea, vehicleType] = key.split('||');
    const totN = items.reduce((a, i) => a + (i.numContratti || 0), 0);
    out.push({
      level: 'macroarea',
      macroarea,
      vehicleType,
      premioMedio: weightedMean(items),
      premioMin: Math.min(...items.map((i) => i.premioMedio)),
      premioMax: Math.max(...items.map((i) => i.premioMedio)),
      numContratti: totN || null,
      provinceCount: items.length,
      weighted: items.every((i) => i.numContratti),
      ...meta,
    });
  }
  return out;
}

export function buildNationalAggregates(provinceRecords, meta) {
  const groups = groupBy(provinceRecords, (r) => r.vehicleType);
  const out = [];
  for (const [vehicleType, items] of groups) {
    const totN = items.reduce((a, i) => a + (i.numContratti || 0), 0);
    out.push({
      level: 'nazionale',
      area: 'Italia',
      vehicleType,
      premioMedio: weightedMean(items),
      premioMin: Math.min(...items.map((i) => i.premioMedio)),
      premioMax: Math.max(...items.map((i) => i.premioMedio)),
      numContratti: totN || null,
      provinceCount: items.length,
      weighted: items.every((i) => i.numContratti),
      ...meta,
    });
  }
  return out;
}
