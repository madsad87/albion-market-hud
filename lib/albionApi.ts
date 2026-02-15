import { REQUEST_TIMEOUT_MS } from '@/lib/config';
import type { CityName, NormalizedPrice, PriceRow } from '@/types/market';

const ALBION_DATA_BASE_URL =
  process.env.ALBION_DATA_BASE_URL ?? 'https://west.albion-online-data.com/api/v2/stats/prices';

const isCityName = (value: string): value is CityName =>
  ['Bridgewatch', 'Caerleon', 'Fort Sterling', 'Lymhurst', 'Martlock', 'Thetford'].includes(value);

export const normalizeRows = (rows: PriceRow[]): NormalizedPrice[] => {
  return rows
    .filter((row) => isCityName(row.city))
    .map((row) => ({
      itemId: row.item_id,
      city: row.city as CityName,
      quality: row.quality,
      buyPriceMax: row.buy_price_max,
      sellPriceMin: row.sell_price_min,
      buyPriceMaxDate: row.buy_price_max_date,
      sellPriceMinDate: row.sell_price_min_date
    }));
};

const withTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
};

export async function fetchCurrentPrices(params: {
  items: string[];
  cities: CityName[];
  quality: number;
}): Promise<NormalizedPrice[]> {
  const query = new URLSearchParams({
    locations: params.cities.join(','),
    qualities: String(params.quality)
  });

  const url = `${ALBION_DATA_BASE_URL}/${params.items.join(',')}?${query.toString()}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await withTimeout(url);
      if (!response.ok) {
        throw new Error(`Albion API status ${response.status}`);
      }

      const body = (await response.json()) as unknown;
      if (!Array.isArray(body)) {
        throw new Error('Malformed response payload from Albion API');
      }

      return normalizeRows(body as PriceRow[]);
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        throw lastError;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Albion API request failed');
}
