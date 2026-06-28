# Routy

Routy is a landed-cost intelligence MVP. The calculator is now intentionally conservative: it only calculates customs duty when a route has an explicit rule or when the user provides a documented manual duty rate.

## Current MVP

- Exporter/origin country selector
- Importer/destination country selector
- Mandatory HS code input for official lookups
- Customs value input
- Manual duty-rate fallback when the exact official rate is known
- Intra-EU rule: EU origin to EU destination = 0% customs duty
- Missing-data state instead of fake country-average calculations
- Copyable report with source, confidence, and broker-review flag
- Compliance guardrails

## Target data model

The useful product requires a full tariff matrix:

```text
origin country × importing country × HS code → MFN rate / preferential rate / extra measures / source
```

Examples:

- EU import: TARIC / Access2Markets with origin, destination, HS code, preferences, anti-dumping and additional measures.
- US import: HTSUS + Chapter 99 with country-specific measures such as Section 301, quotas, sanctions and preference programs.
- UK import: UK Global Tariff + preferential agreements.
- Other destinations: official national customs tariff sources.

## Removed benchmark calculation

The repository still contains the World Bank/WITS country-level benchmark dataset for country names and historical reference, but the live calculator no longer uses it as a duty-rate calculation.

The old indicator was:

- `TM.TAX.MRCH.SM.AR.ZS`
- Label: Tariff rate, applied, simple mean, all products (%)
- Source URL: https://api.worldbank.org/v2/country/all/indicator/TM.TAX.MRCH.SM.AR.ZS?format=json

That indicator is **not** product-specific and is **not** enough for real customs-duty calculation.

## Development

```bash
npm install
npm run dev
npm run build
```
