import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';
import { gotScraping } from 'got-scraping';

import { SOURCES, archiveUrl, extractDetailLinks, extractDetail } from './ivass.js';
import { parseTavoleWorkbook } from './parser.js';
import {
  buildRegionalAggregates,
  buildMacroareaAggregates,
  buildNationalAggregates,
} from './aggregate.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const {
  source = 'iper',                     // iper | comunicazioni | bollettino
  mode = 'latest',                     // latest | all_available | year_range
  yearFrom = new Date().getFullYear() - 1,
  yearTo = new Date().getFullYear(),
  maxPublications = 1,
  vehicleTypes = ['autovetture', 'motocicli', 'ciclomotori'],
  includeProvinceData = true,
  includeRegionalAggregates = true,
  includeMacroareaAggregates = true,
  includeNationalAggregate = true,
  proxyConfiguration: proxyInput,
} = input;

const vehicleSet = new Set(vehicleTypes);

const proxyConfiguration = await Actor.createProxyConfiguration(
  proxyInput ?? { groups: ['RESIDENTIAL'], countryCode: 'IT' },
);

// ---- Build start requests -------------------------------------------------
const startRequests = [];
if (mode === 'year_range' || mode === 'all_available') {
  const from = mode === 'all_available' ? 2021 : yearFrom;
  const to = mode === 'all_available' ? new Date().getFullYear() : yearTo;
  for (let y = to; y >= from; y--) {
    startRequests.push({ url: archiveUrl(y), label: 'LIST' });
  }
} else {
  startRequests.push({ url: SOURCES[source] ?? SOURCES.iper, label: 'LIST' });
}

// Shared run state.
const state = {
  publicationsWithData: 0,
  publicationsTarget: mode === 'latest' ? maxPublications : Infinity,
  detailEnqueued: 0,
  totalProvinceRecords: 0,
};

// ---- Download a binary file honoring the proxy ----------------------------
async function downloadBuffer(url) {
  const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;
  const res = await gotScraping({
    url,
    proxyUrl,
    responseType: 'buffer',
    timeout: { request: 120_000 },
    headers: { referer: SOURCES.iper },
  });
  return res.body;
}

const crawler = new CheerioCrawler({
  proxyConfiguration,
  maxRequestRetries: 4,
  requestHandlerTimeoutSecs: 240,
  maxConcurrency: 3,

  async requestHandler({ request, body, enqueueLinks, addRequests }) {
    const html = body.toString();

    if (request.label === 'LIST') {
      const links = extractDetailLinks(html, request.url);
      log.info(`LIST ${request.url} → ${links.length} detail pages found`);

      // In "latest" mode we only need the newest few; the listing is newest-first.
      const slice = mode === 'latest' ? links.slice(0, Math.max(maxPublications * 4, 4)) : links;
      const toAdd = slice.map((l) => ({ url: l.url, label: 'DETAIL', userData: { listTitle: l.title } }));
      state.detailEnqueued += toAdd.length;
      await addRequests(toAdd);
      return;
    }

    // DETAIL page
    if (mode === 'latest' && state.publicationsWithData >= state.publicationsTarget) {
      return; // already have what we need
    }

    const detail = extractDetail(html, request.url);
    if (!detail.xlsxFiles.length) {
      log.warning(`No XLSX on ${request.url} (title: ${detail.title}) — skipping`);
      return;
    }

    // Prefer the "tavole" workbook (province tables) when several xlsx are present.
    const tavole = detail.xlsxFiles.find((f) => /tavol|provinc|dati/i.test(f.url + ' ' + f.label))
      ?? detail.xlsxFiles[0];

    let buffer;
    try {
      buffer = await downloadBuffer(tavole.url);
    } catch (err) {
      log.error(`Download failed ${tavole.url}: ${err.message}`);
      throw err; // let Crawlee retry
    }

    const raw = parseTavoleWorkbook(buffer);
    const errors = raw.filter((r) => r._error);
    const provinceRecords = raw.filter((r) => !r._error && vehicleSet.has(r.vehicleType));

    if (!provinceRecords.length) {
      log.warning(`Parsed 0 province records from ${tavole.url} (sheets may have an unexpected layout)`);
      return;
    }

    const meta = {
      period: detail.period,
      periodType: detail.periodType,
      refYear: detail.refYear,
      source: source.toUpperCase(),
      sourceFile: tavole.url,
      publicationUrl: detail.url,
      publicationTitle: detail.title,
      publicationDate: detail.publicationDate,
      scrapedAt: new Date().toISOString(),
    };

    const dataset = await Actor.openDataset();

    if (includeProvinceData) {
      const rows = provinceRecords.map((r) => ({
        level: 'provincia',
        provincia: r.provincia,
        sigla: r.sigla,
        regione: r.regione,
        macroarea: r.macroarea,
        vehicleType: r.vehicleType,
        metric: r.metric,
        premioMedio: r.metric === 'premio_medio' ? r.value : null,
        variazioneAnnua: r.metric === 'variazione_annua' ? r.value : null,
        columnHeader: r.columnHeader,
        ...meta,
      }));
      await dataset.pushData(rows);
      state.totalProvinceRecords += rows.length;
    }

    if (includeRegionalAggregates) {
      await dataset.pushData(buildRegionalAggregates(provinceRecords, meta));
    }
    if (includeMacroareaAggregates) {
      await dataset.pushData(buildMacroareaAggregates(provinceRecords, meta));
    }
    if (includeNationalAggregate) {
      await dataset.pushData(buildNationalAggregates(provinceRecords, meta));
    }

    state.publicationsWithData += 1;
    log.info(`✔ ${detail.title} [${detail.period}] → ${provinceRecords.length} province values`
      + (errors.length ? ` (${errors.length} sheet errors)` : ''));
  },

  failedRequestHandler({ request }, err) {
    log.error(`Request ${request.url} failed: ${err.message}`);
  },
});

await crawler.run(startRequests);

log.info(`Done. Publications with data: ${state.publicationsWithData}, `
  + `province records pushed: ${state.totalProvinceRecords}`);

await Actor.exit();
