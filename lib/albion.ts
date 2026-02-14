import { CACHE_TTL_MS, REQUEST_TIMEOUT_MS } from '@/lib/config';
import type { AlbionPriceRow, CityName, PriceSnapshot } from '@/types/market';

const ALBION_DATA_BASE_URL =
  process.env.ALBION_DATA_BASE_URL ?? 'https://west.albion-online-data.com/api/v2/stats/prices';

type CacheRecord = {
  data: PriceSnapshot[];
  expiresAt: number;
};

const inMemoryCache = new Map<string, CacheRecord>();

function createCacheKey(items: string[], cities: CityName[]): string {
  return `${items.sort().join(',')}::${cities.sort().join(',')}`;
}

function normalizeRows(rows: AlbionPriceRow[]): PriceSnapshot[] {
  return rows
    .filter((row) => row.sell_price_min > 0 && row.buy_price_max > 0)
    .map((row) => ({
      itemId: row.item_id,
      city: row.city as CityName,
      buyPrice: row.sell_price_min,
      sellPrice: row.buy_price_max,
      observedAt: row.sell_price_min_date || row.buy_price_max_date || new Date().toISOString()
    }));
}

export async function fetchAlbionPrices(items: string[], cities: CityName[]): Promise<PriceSnapshot[]> {
  const cacheKey = createCacheKey(items, cities);
  const cached = inMemoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const query = new URLSearchParams({
    locations: cities.join(','),
    qualities: '1'
  });

  const url = `${ALBION_DATA_BASE_URL}/${items.join(',')}?${query.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Albion Data API request failed with status ${response.status}`);
    }

    const rows = (await response.json()) as AlbionPriceRow[];
    const normalized = normalizeRows(rows);

    inMemoryCache.set(cacheKey, {
      data: normalized,
      expiresAt: now + CACHE_TTL_MS
    });

    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}
// END OF FILE
