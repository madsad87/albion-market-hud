import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { fetchCurrentPrices } from '@/lib/albionApi';
import {
  DEFAULT_MAX_DATA_AGE_MINUTES,
  DEFAULT_MODE,
  DEFAULT_QUALITY,
  MAX_ITEMS_PER_REQUEST,
  PRICE_CACHE_TTL_SECONDS,
  SUPPORTED_CITIES
} from '@/lib/config';
import { generateOpportunities } from '@/lib/arbitrage';
import { getKnownItemCount, getKnownItemIds, hasLoadedItemMeta } from '@/lib/itemMeta';
import type { CityName, ModeFilter, OpportunitiesMeta } from '@/types/market';

const scanModes = ['manual', 'auto'] as const;
type ScanMode = (typeof scanModes)[number];

const modeValues: ModeFilter[] = ['best', 'top3', 'flips', 'transport'];

const parseItems = (value: string | null): { items: string[]; error?: string } => {
  const split = (value ?? '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const deduped = [...new Set(split)];
  if (!deduped.length) return { items: [] };
  if (deduped.length > MAX_ITEMS_PER_REQUEST) {
    return { items: [], error: `Maximum ${MAX_ITEMS_PER_REQUEST} item IDs allowed` };
  }

  const invalid = deduped.find((itemId) => !/^[A-Z0-9_*.@]+$/.test(itemId));
  if (invalid) return { items: [], error: `Invalid item ID: ${invalid}` };

  return { items: deduped };
};

const querySchema = z.object({
  cities: z
    .string()
    .optional()
    .transform((value) => {
      const parsed =
        value
          ?.split(',')
          .map((city) => city.trim())
          .filter((city): city is CityName => SUPPORTED_CITIES.includes(city as CityName)) ?? SUPPORTED_CITIES;

      return parsed.length ? [...new Set(parsed)] : SUPPORTED_CITIES;
    }),
  quality: z.coerce.number().int().min(1).max(5).default(DEFAULT_QUALITY),
  minProfitPct: z.coerce.number().min(0).max(1000).default(0),
  maxDataAge: z.coerce.number().min(1).max(1440).default(DEFAULT_MAX_DATA_AGE_MINUTES),
  mode: z
    .string()
    .optional()
    .transform((value) => (modeValues.includes(value as ModeFilter) ? (value as ModeFilter) : DEFAULT_MODE)),
  scanMode: z
    .string()
    .optional()
    .transform((value): ScanMode => (scanModes.includes(value as ScanMode) ? (value as ScanMode) : 'manual'))
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const queryParams = request.nextUrl.searchParams;
  const { items, error: itemError } = parseItems(queryParams.get('items'));

  if (itemError) {
    return NextResponse.json({ error: 'Invalid request', details: itemError }, { status: 400 });
  }

  try {
    const parsed = querySchema.parse(Object.fromEntries(queryParams.entries()));
    const knownItemIds = getKnownItemIds();
    const knownItemIdSet = new Set(knownItemIds);
    const fallbackAutoItems = knownItemIds.slice(0, MAX_ITEMS_PER_REQUEST);
    const resolvedItems = items.length ? items : parsed.scanMode === 'auto' ? fallbackAutoItems : [];

    if (!resolvedItems.length) {
      return NextResponse.json({ error: 'Invalid request', details: 'At least one item ID is required' }, { status: 400 });
    }

    const normalized = await fetchCurrentPrices({
      items: resolvedItems,
      cities: parsed.cities,
      quality: parsed.quality
    });

    const opportunities = generateOpportunities(normalized, parsed.mode)
      .filter((opportunity) => opportunity.profitPct >= parsed.minProfitPct)
      .filter((opportunity) => opportunity.dataAgeMinutes <= parsed.maxDataAge);

    const knownItemsForRequest = resolvedItems.filter((itemId) => knownItemIdSet.has(itemId)).length;

    const meta: OpportunitiesMeta = {
      updatedAt: new Date().toISOString(),
      lastUpdated: normalized
        .flatMap((row) => [row.buyPriceMaxDate, row.sellPriceMinDate])
        .sort()
        .at(-1) ?? new Date().toISOString(),
      itemCount: resolvedItems.length,
      scannedItemCount: resolvedItems.length,
      scanMode: parsed.scanMode,
      quality: parsed.quality,
      cityCount: parsed.cities.length,
      itemCatalog: {
        source: hasLoadedItemMeta()
          ? 'Local snapshot inspired by ao-data item metadata (extensible to full dump)'
          : 'No item metadata loaded',
        knownItems: getKnownItemCount(),
        coveragePct: Number(((knownItemsForRequest / resolvedItems.length) * 100).toFixed(2))
      }
    };

    return NextResponse.json(
      { opportunities, meta },
      {
        headers: {
          'Cache-Control': `max-age=0, s-maxage=${PRICE_CACHE_TTL_SECONDS}, stale-while-revalidate=${PRICE_CACHE_TTL_SECONDS * 2}`
        }
      }
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown upstream error';
    const malformed = details.includes('Malformed response payload');

    return NextResponse.json(
      { error: malformed ? 'Malformed data received from Albion API' : 'Failed to load market data', details },
      { status: malformed ? 502 : 503 }
    );
  }
}
