# 🇮🇹 Italy Car Insurance Prices — RC Auto by Province & Region

**The only ready-to-use dataset of Italian motor-insurance (RC Auto) prices broken down by province, region and macro-area — straight from the official IVASS regulator.**

Get the **average premium actually paid** for car, motorcycle and moped insurance in **every one of Italy's 107 provinces**, with year-over-year change, price percentiles and contract volumes — refreshed every quarter. No quote forms, no personal data, no guesswork: just clean, structured, analysis-ready numbers.

---

## 💡 Why this actor

Italian RC Auto pricing is famously **territorial** — a driver in Naples can pay €270+ more than the same driver in Aosta. Until now, that territorial price map lived inside PDF reports and multi-tab Excel files published by IVASS (the Italian insurance authority). This actor turns it into a single tidy dataset you can drop into a spreadsheet, BI tool, database or model in seconds.

- ✅ **Official source** — IVASS *IPER* survey (the same data ISTAT uses for the national CPI)
- ✅ **Full territorial coverage** — all 107 provinces + 20 regions + 5 macro-areas + national
- ✅ **3 vehicle types** — cars (autovetture), motorcycles (motocicli), mopeds (ciclomotori)
- ✅ **Rich fields** — average premium, YoY %, price percentiles (5th–99th), contract counts, coefficient of variation
- ✅ **Time series** — pull the latest quarter or the entire history back to 2021
- ✅ **Zero PII** — reads published aggregate statistics only

---

## 🎯 Who uses it & how

| Use case | What you do with the data |
|---|---|
| **Insurance brokers & agents** | Benchmark your quotes against the true local market average; show clients how their province compares. |
| **Insurtech & comparison sites** | Power "average price in your area" widgets, lead-gen calculators and pricing pages with authoritative numbers. |
| **Pricing & actuarial teams** | Feed territorial baselines and percentiles into pricing models and competitiveness analyses. |
| **Market researchers & analysts** | Map regional price gaps, track YoY inflation in motor insurance, build reports and dashboards. |
| **Data scientists / ML** | Use province-level premiums + percentiles + contract volumes as features or training data. |
| **Journalists & consumer associations** | Source verifiable, citable figures on how much Italians pay for car insurance by area. |
| **Fintech & lead generation** | Geo-segment campaigns by price level (target high-premium provinces with savings offers). |

---

## 📦 What you get (output)

The actor outputs **~356 rows per quarter**, organised on four levels via the `level` field.

### `provincia` — the core: 107 provinces × 3 vehicle types

```json
{
  "level": "provincia",
  "provincia": "Napoli",
  "sigla": "NA",
  "regione": "Campania",
  "macroarea": "Sud",
  "vehicleType": "autovetture",
  "premioMedio": 604.7,
  "variazioneAnnua": 0.6,
  "numContratti": 71190,
  "cv": 47.6,
  "p5": 277, "p10": 333.9, "p25": 435.5, "p50": 558.5, "p75": 723.9, "p95": 1147.8, "p99": 1731.4,
  "period": "2025-Q4",
  "periodType": "trimestre",
  "source": "IPER",
  "publicationDate": "2026-04-20",
  "sourceFile": "https://www.ivass.it/.../tavole_IV_trimestre.xlsx"
}
```

| Field | Meaning |
|---|---|
| `provincia` / `sigla` | Province name and plate code (e.g. Napoli / NA) |
| `regione` / `macroarea` | Region and macro-area (Nord-Ovest, Nord-Est, Centro, Sud, Isole) |
| `vehicleType` | `autovetture` (cars), `motocicli` (motorcycles), `ciclomotori` (mopeds) |
| `premioMedio` | **Average premium actually paid, in €** |
| `variazioneAnnua` | Year-over-year change, % |
| `numContratti` | Number of contracts in the sample (sample size / weight) |
| `cv` | Coefficient of variation, % (price dispersion) |
| `p5`–`p99` | Price percentiles, € (5th / 10th / 25th / 50th-median / 75th / 95th / 99th) |
| `period` | Reference quarter, e.g. `2025-Q4` |

### `regione`, `macroarea`, `nazionale` — ready aggregates

- **`regione`** — official IVASS contract-weighted regional average (cars).
- **`macroarea`** — Nord-Ovest / Nord-Est / Centro / Sud / Isole, contract-weighted from province data (all 3 vehicle types), with `premioMin` / `premioMax`.
- **`nazionale`** — national contract-weighted average per vehicle type. *(Sanity check: cars ≈ €432–437, matching the official IVASS headline.)*

> Aggregates are weighted by `numContratti`, reproducing the IVASS methodology — not a naive province mean.

---

## ⚙️ Input — quick start

The defaults already give you the **latest quarter, all vehicle types, all territorial levels**. Just hit **Start**.

```json
{
  "source": "iper",
  "mode": "latest",
  "maxPublications": 1,
  "vehicleTypes": ["autovetture", "motocicli", "ciclomotori"]
}
```

**Want the full history (every quarter since 2021)?**

```json
{ "source": "iper", "mode": "all_available" }
```

**Want a specific span of years?**

```json
{ "source": "iper", "mode": "year_range", "yearFrom": 2023, "yearTo": 2025 }
```

| Option | What it does |
|---|---|
| `mode` | `latest` (most recent period) · `year_range` · `all_available` (since 2021) |
| `maxPublications` | How many recent periods to pull in `latest` mode |
| `vehicleTypes` | Pick cars / motorcycles / mopeds |
| `includeProvinceData` | Per-province rows (on by default) |
| `includeRegionalAggregates` | Official regional averages |
| `includeMacroareaAggregates` | Nord/Centro/Sud/Isole averages |
| `includeNationalAggregate` | National average |
| `proxyConfiguration` | Italian proxy recommended (default) |

---

## 📤 Exporting

From the run's **Output** tab, export to **Excel, CSV, JSON, or via API** — or connect it to Google Sheets / your database with Apify integrations. Schedule it quarterly to keep a fresh price feed automatically.

---

## 📑 Source & terms

Data originates from **IVASS** (Istituto per la Vigilanza sulle Assicurazioni), *Indagine IPER* — the official survey of effective RC Auto prices, published openly on `ivass.it`.

This actor automates the **retrieval and structuring of public statistical data**; it does not bypass authentication and submits no personal data. Any onward use or redistribution of the retrieved data is the user's responsibility — always **cite the source** (*"Fonte: IVASS — Indagine IPER"*), and for commercial reuse check IVASS's reuse terms / request authorisation where required.

---

## 🛠️ Tech & local dev

Node.js 20 · Apify SDK 3 · Crawlee (CheerioCrawler) · SheetJS · cheerio · got-scraping.

```bash
npm install
npm run test:parser   # validates parsing + aggregation
```

Questions or a custom breakdown (extra fields, other IVASS tables, weekly schedule)? Open an issue or contact the author.
