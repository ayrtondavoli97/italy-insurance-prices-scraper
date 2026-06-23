import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';
import { gotScraping } from 'got-scraping';

import { SOURCES, archiveUrl, extractDetailLinks, extractDetail } from './ivass.js';
import { parseIvassWorkbook } from './parser.js';
import {
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

    const raw = parseIvassWorkbook(buffer);
    const provinceRecords = raw.province.filter((r) => vehicleSet.has(r.vehicleType));
    const regionRecords = raw.regione.filter((r) => vehicleSet.has(r.vehicleType));

    if (!provinceRecords.length && !regionRecords.length) {
      log.warning(`Parsed 0 geographic records from ${tavole.url} (unexpected layout)`);
      return;
    }

    // The workbook carries the authoritative period; fall back to the detail page.
    const filePeriod = provinceRecords[0]?.period || regionRecords[0]?.period;
    const meta = {
      period: filePeriod || detail.period,
      periodType: provinceRecords[0]?.periodType || detail.periodType,
      refYear: provinceRecords[0]?.refYear || detail.refYear,
      source: source.toUpperCase(),
      sourceFile: tavole.url,
      publicationUrl: detail.url,
      publicationTitle: detail.title,
      publicationDate: detail.publicationDate,
      scrapedAt: new Date().toISOString(),
    };

    const dataset = await Actor.openDataset();

    if (includeProvinceData) {
      await dataset.pushData(provinceRecords.map((r) => ({ ...r, ...meta })));
      state.totalProvinceRecords += provinceRecords.length;
    }
    if (includeRegionalAggregates && regionRecords.length) {
      // Official IVASS contract-weighted regional figures (from the file itself).
      await dataset.pushData(regionRecords.map((r) => ({ ...r, ...meta })));
    }
    if (includeMacroareaAggregates && provinceRecords.length) {
      await dataset.pushData(buildMacroareaAggregates(provinceRecords, meta));
    }
    if (includeNationalAggregate && provinceRecords.length) {
      await dataset.pushData(buildNationalAggregates(provinceRecords, meta));
    }

    state.publicationsWithData += 1;
    log.info(`✔ ${detail.title} [${meta.period}] → `
      + `${provinceRecords.length} province + ${regionRecords.length} region records`);
  },

  failedRequestHandler({ request }, err) {
    log.error(`Request ${request.url} failed: ${err.message}`);
  },
});

await crawler.run(startRequests);

log.info(`Done. Publications with data: ${state.publicationsWithData}, `
  + `province records pushed: ${state.totalProvinceRecords}`);

await Actor.exit();
