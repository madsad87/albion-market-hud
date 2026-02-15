# Albion Market HUD

Next.js dashboard for fee-aware Albion Online arbitrage opportunities powered by the Albion Online Data Project (`west` host).

## Features

- Server-side opportunity engine (`/api/opportunities`) with fee-aware profit math
- Route modes: best transport route, top 3 routes, flips-only, transport-only
- Data freshness filter (`Max data age`) and last-updated metadata
- Quick item presets + comma-separated custom item IDs with dedupe and max-item validation
- Immediate Opportunities panel highlighting fresh profitable flip + transport routes
- Item metadata enrichment hook (designed to be fed by ao-data item dumps)
- Vercel-friendly cache headers with stale-while-revalidate behavior
- Timeout + retry hardening for external API calls

## Quick start

```bash
npm install
npm run dev
```

## Environment variables

| Name | Default | Description |
| --- | --- | --- |
| `ALBION_DATA_BASE_URL` | `https://west.albion-online-data.com/api/v2/stats/prices` | Albion Data Project endpoint |
| `BUY_ORDER_FEE` | `0.025` | Buy-side order fee rate |
| `SELL_ORDER_FEE` | `0.025` | Sell-side order fee rate |
| `TRANSACTION_TAX` | `0.04` | Sell-side transaction tax |
| `PRICE_CACHE_TTL` | `300` | Edge cache TTL in seconds (`s-maxage`) |

## Profit formula

Premium default formula:

```text
netProfit = (sellPrice * (1 - SELL_ORDER_FEE - TRANSACTION_TAX))
            - (buyPrice * (1 + BUY_ORDER_FEE))

profitPct = netProfit / (buyPrice * (1 + BUY_ORDER_FEE)) * 100
```

Rows with `buyPrice <= 0` or `sellPrice <= 0` are ignored.

## API

### GET `/api/opportunities`

Query params:

- `items` (required): comma-separated item IDs, deduped, max 50
- `cities` (optional): comma-separated supported cities
- `quality` (optional, default `1`)
- `mode` (optional): `best | top3 | flips | transport`
- `minProfitPct` (optional)
- `maxDataAge` (optional, minutes)

Returns:

```json
{
  "opportunities": [],
  "meta": {
    "updatedAt": "...",
    "lastUpdated": "...",
    "itemCount": 3,
    "quality": 1,
    "cityCount": 6,
    "itemCatalog": {
      "source": "Local snapshot inspired by ao-data item metadata (extensible to full dump)",
      "knownItems": 10,
      "coveragePct": 20
    }
  }
}
```

## Caching behavior

API responses set:

```text
Cache-Control: max-age=0, s-maxage=<PRICE_CACHE_TTL>, stale-while-revalidate=<2x TTL>
```

The dashboard refresh button adds `ts=Date.now()` to the browser request URL to force a client refetch while preserving the edge cache policy.
