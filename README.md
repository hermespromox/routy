# Routy

Routy is a first MVP for landed-cost intelligence: a simple customs-duty calculator that uses official online tariff benchmark data by importing country.

## Current MVP

- Country selector with 179 countries/zones
- Customs value input
- Optional HS code field
- Optional manual duty-rate override when the product-specific HS rate is known
- Estimated customs duty calculation
- Indicative broker-fee estimate
- Copyable report
- Compliance guardrails and source transparency

## Data source

The current dataset is generated from the World Bank WDI/WITS indicator:

- `TM.TAX.MRCH.SM.AR.ZS`
- Label: Tariff rate, applied, simple mean, all products (%)
- Source URL: https://api.worldbank.org/v2/country/all/indicator/TM.TAX.MRCH.SM.AR.ZS?format=json

Important: product-specific maximum customs duty varies by HS code, origin, destination, preferential agreements, anti-dumping measures, and customs interpretation. This MVP stores a `maxDutyRate` field for the future HS-specific data layer, but the live calculator currently uses the official country-level benchmark rate unless the user enters a manual rate.

## Development

```bash
npm install
npm run dev
npm run build
```
