// Build region / macro-area / national aggregates from province-level premio_medio records.
// Aggregates are simple (unweighted) means across provinces — note: a contract-weighted
// mean would differ; this is documented as an unweighted territorial average.

function mean(nums) {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round((s / nums.length) * 100) / 100;
}

function summarize(records, level, keyField, meta) {
  const groups = new Map();
  for (const r of records) {
    if (r.metric !== 'premio_medio' || r.value === null) continue;
    const groupKey = `${r[keyField]}||${r.vehicleType}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(r);
  }

  const out = [];
  for (const [groupKey, items] of groups) {
    const [name, vehicleType] = groupKey.split('||');
    const values = items.map((i) => i.value);
    out.push({
      level,
      [keyField]: name,
      vehicleType,
      premioMedio: mean(values),
      premioMin: Math.min(...values),
      premioMax: Math.max(...values),
      provinceCount: items.length,
      ...meta,
    });
  }
  return out;
}

export function buildRegionalAggregates(provinceRecords, meta) {
  return summarize(provinceRecords, 'regione', 'regione', meta);
}

export function buildMacroareaAggregates(provinceRecords, meta) {
  return summarize(provinceRecords, 'macroarea', 'macroarea', meta);
}

export function buildNationalAggregates(provinceRecords, meta) {
  const groups = new Map();
  for (const r of provinceRecords) {
    if (r.metric !== 'premio_medio' || r.value === null) continue;
    if (!groups.has(r.vehicleType)) groups.set(r.vehicleType, []);
    groups.get(r.vehicleType).push(r.value);
  }
  const out = [];
  for (const [vehicleType, values] of groups) {
    out.push({
      level: 'nazionale',
      area: 'Italia',
      vehicleType,
      premioMedio: mean(values),
      premioMin: Math.min(...values),
      premioMax: Math.max(...values),
      provinceCount: values.length,
      ...meta,
    });
  }
  return out;
}
