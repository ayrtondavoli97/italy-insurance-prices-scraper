# Italy Insurance Prices (RC Auto) by Province & Region

Build a clean, structured dataset of **Italian motor-liability (RC Auto) insurance prices**
broken down by **province**, **region** and **macro-area (Nord-Ovest / Nord-Est / Centro / Sud / Isole)**,
plus a **national average** — sourced from the official **IVASS IPER** statistical survey
(*Indagine sui Prezzi Effettivi della R.C. auto*).

It covers **cars (autovetture)**, **motorcycles (motocicli)** and **mopeds (ciclomotori)**,
with the average premium (`premioMedio`) and year-over-year change (`variazioneAnnua`) where published.

> This actor reads the **average effective prices actually paid** that IVASS publishes for the whole
> Italian market. It is **not** a per-company quote engine and it does **not** submit any personal data.

## How it works

1. Crawls the IVASS publication index (IPER monthly / quarterly *Comunicazioni statistiche*).
2. On each publication page it locates the attached **`tavole_*.xlsx`** (province tables).
3. Downloads and parses the workbook, matching each row against the 107 Italian provinces.
4. Emits per-province rows, then computes regional, macro-area and national averages.

The XLSX parser is layout-tolerant: it auto-detects the header row, the province column and the
vehicle/metric of each value column, so it keeps working if IVASS reorders the tables between releases.

## Input

| Field | Type | Default | Notes |
|---|---|---|---|
| `source` | enum | `iper` | `iper` \| `comunicazioni` \| `bollettino` |
| `mode` | enum | `latest` | `latest` \| `year_range` \| `all_available` |
| `maxPublications` | int | `1` | how many recent publications to collect (latest mode) |
| `yearFrom` / `yearTo` | int | `2024` / `2026` | used in `year_range` mode |
| `vehicleTypes` | array | all three | `autovetture`, `motocicli`, `ciclomotori` |
| `includeProvinceData` | bool | `true` | per-province rows |
| `includeRegionalAggregates` | bool | `true` | per-region averages |
| `includeMacroareaAggregates` | bool | `true` | Nord/Centro/Sud/Isole averages |
| `includeNationalAggregate` | bool | `true` | national average |
| `proxyConfiguration` | object | Apify RESIDENTIAL / IT | Italian IP recommended |

### Example input

```json
{
  "source": "iper",
  "mode": "latest",
  "maxPublications": 1,
  "vehicleTypes": ["autovetture", "motocicli", "ciclomotori"]
}
```

## Output

Per-province record:

```json
{
  "level": "provincia",
  "provincia": "Napoli",
  "sigla": "NA",
  "regione": "Campania",
  "macroarea": "Sud",
  "vehicleType": "autovetture",
  "metric": "premio_medio",
  "premioMedio": 512.3,
  "variazioneAnnua": null,
  "period": "2025-Q4",
  "periodType": "trimestre",
  "source": "IPER",
  "sourceFile": "https://www.ivass.it/.../tavole_IV_trimestre.xlsx",
  "publicationUrl": "https://www.ivass.it/.../index.html",
  "publicationDate": "2026-04-20",
  "scrapedAt": "2026-06-23T10:00:00.000Z"
}
```

Aggregate records carry `level` = `regione` | `macroarea` | `nazionale`, with
`premioMedio`, `premioMin`, `premioMax` and `provinceCount`.

> **Note on aggregates:** regional / macro-area / national averages are **unweighted means**
> across provinces, not contract-weighted. They are useful for territorial comparison; for the
> official weighted national figure refer to the IVASS report directly.

## Source & legal note

Data is published by **IVASS** (Istituto per la Vigilanza sulle Assicurazioni) within the IPER survey.
IVASS's website terms state that its content may be saved **for personal use only** and that
**reproduction or reuse for commercial purposes, or modification of the data, requires prior written
authorisation from IVASS.**

Therefore this actor is provided as an **automation tool for retrieving public statistical data**:
the responsibility for any further use, redistribution or commercial exploitation of the retrieved
data lies with the end user, who should obtain the appropriate authorisation from IVASS and always
**attribute the source** (e.g. *"Fonte: IVASS — Indagine IPER"*). It does not bypass authentication
and only reads documents IVASS publishes openly.

## Local development / tests

```bash
npm install
npm run test:parser   # validates parsing + aggregation on a synthetic IVASS-shaped workbook
```

Stack: Node.js 20, Apify SDK 3, Crawlee (CheerioCrawler), SheetJS (xlsx), cheerio, got-scraping.
