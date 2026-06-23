import * as cheerio from 'cheerio';

export const BASE = 'https://www.ivass.it';

export const SOURCES = {
  iper: `${BASE}/pubblicazioni-e-statistiche/statistiche/rilevazioni-mensili-iper/index.html`,
  comunicazioni: `${BASE}/pubblicazioni-e-statistiche/statistiche/comunicazioni-statistiche/index.html`,
  bollettino: `${BASE}/pubblicazioni-e-statistiche/statistiche/bollettino-statistico/index.html`,
};

// Year-archive search URL (used for mode "all_available" / "year_range").
export function archiveUrl(year, cat = 'rilevazioniMensiliIper') {
  return `${BASE}/pubblicazioni-e-statistiche/statistiche/rilevazioni-mensili-iper/ricerca/ricerca.html`
    + `?min_anno_pubblicazione=${year}&max_anno_pubblicazione=${year}&cat=${cat}`;
}

const MONTHS = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};
const QUARTERS = { primo: 1, secondo: 2, terzo: 3, quarto: 4 };

// Derive a normalized period from a publication title/description.
// Returns { period, periodType, refYear } e.g. { period: '2025-Q4', periodType: 'trimestre' }.
export function parsePeriod(text) {
  if (!text) return { period: null, periodType: null, refYear: null };
  const t = text.toLowerCase();

  const qMatch = t.match(/(primo|secondo|terzo|quarto)\s+trimestre\s+(\d{4})/);
  if (qMatch) {
    const q = QUARTERS[qMatch[1]];
    const y = Number(qMatch[2]);
    return { period: `${y}-Q${q}`, periodType: 'trimestre', refYear: y };
  }
  // Monthly: "r.c. auto a marzo 2025" / "a gennaio 2025"
  const mMatch = t.match(/\b(?:a\s+)?(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/);
  if (mMatch) {
    const m = String(MONTHS[mMatch[1]]).padStart(2, '0');
    const y = Number(mMatch[2]);
    return { period: `${y}-${m}`, periodType: 'mensile', refYear: y };
  }
  // Annual range, e.g. "(2019-2024)"
  const yRange = t.match(/\((\d{4})\s*[-–]\s*(\d{4})\)/);
  if (yRange) {
    return { period: `${yRange[1]}-${yRange[2]}`, periodType: 'annuale', refYear: Number(yRange[2]) };
  }
  const y = t.match(/\b(20\d{2})\b/);
  return { period: y ? y[1] : null, periodType: 'annuale', refYear: y ? Number(y[1]) : null };
}

// Parse "Data pubblicazione:20 aprile 2026" → ISO date.
export function parsePublicationDate(text) {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/);
  if (!m) return null;
  const day = String(m[1]).padStart(2, '0');
  const month = String(MONTHS[m[2]]).padStart(2, '0');
  return `${m[3]}-${month}-${day}`;
}

function abs(href) {
  if (!href) return null;
  if (href.startsWith('http')) return href.split('?')[0];
  if (href.startsWith('/')) return `${BASE}${href}`.split('?')[0];
  return null;
}

// From an index/archive listing page, return detail-page URLs (+ their listing title/desc).
export function extractDetailLinks(html, currentUrl) {
  const $ = cheerio.load(html);
  const links = [];
  const seen = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    // Detail pages are .../<year>/<period>/index.html under a publication section.
    if (!/\/(rilevazioni-mensili-iper|comunicazioni-statistiche|bollettino-statistico)\/\d{4}\/[^/]+\/index\.html/.test(href)) {
      return;
    }
    const url = abs(href);
    if (!url || url === currentUrl || seen.has(url)) return;
    seen.add(url);
    links.push({ url, title: $(el).text().trim() });
  });
  return links;
}

// From a publication detail page, extract attached files and metadata.
export function extractDetail(html, url) {
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim() || null;
  const bodyText = $('body').text().replace(/\s+/g, ' ');

  const files = { xlsx: [], pdf: [] };
  $('a[href]').each((_, el) => {
    const raw = $(el).attr('href') || '';
    const u = abs(raw);
    if (!u) return;
    if (/\.xlsx$/i.test(u)) files.xlsx.push({ url: u, label: $(el).text().trim() });
    else if (/\.pdf$/i.test(u) && /report|iper|tavole|bollettino|allegat|dati/i.test(u + ' ' + $(el).text())) {
      files.pdf.push({ url: u, label: $(el).text().trim() });
    }
  });

  const descMatch = bodyText.match(/descrizione\s*(.*?)\s*data\b/i);
  const description = descMatch ? descMatch[1].trim() : title;
  const periodSource = `${title || ''} ${description || ''}`;

  return {
    url,
    title,
    description,
    publicationDate: parsePublicationDate(bodyText),
    ...parsePeriod(periodSource),
    xlsxFiles: files.xlsx,
    pdfFiles: files.pdf,
  };
}
