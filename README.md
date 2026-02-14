# Albion Market HUD

A Next.js dashboard and backend API for finding Albion Online city-to-city market arbitrage opportunities using the Albion Online Data Project.

## Features

- Server API route to fetch market prices from `west.albion-online-data.com`
- Input validation, timeout handling, and lightweight in-memory caching
- Normalized snapshots and arbitrage calculation after fees
- Simple web dashboard with filters for cities and minimum profit %
- Ready for deployment on Vercel

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and update as needed.

| Name | Default | Description |
| --- | --- | --- |
| `ALBION_DATA_BASE_URL` | `https://west.albion-online-data.com/api/v2/stats/prices` | Albion Data Project API base URL |

## API usage

### GET `/api/arbitrage`

Query parameters:

- `items`: comma-separated item IDs (e.g. `T4_BAG,T4_CAPE`)
- `cities`: comma-separated cities (defaults to all supported cities)
- `minProfitPct`: minimum net profit percent filter

Example:

```bash
curl "http://localhost:3000/api/arbitrage?items=T4_BAG,T5_2H_FIRESTAFF&cities=Lymhurst,Caerleon&minProfitPct=8"
```

<!-- END OF FILE -->
