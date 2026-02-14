import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { computeArbitrage } from '@/lib/arbitrage';
import { DEFAULT_ITEMS, MAX_ITEMS_PER_REQUEST, SUPPORTED_CITIES } from '@/lib/config';
import { fetchAlbionPrices } from '@/lib/albion';
import type { CityName } from '@/types/market';

const querySchema = z.object({
  items: z
    .string()
    .optional()
    .transform((value) => {
      const raw = value?.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean) ?? DEFAULT_ITEMS;
      return [...new Set(raw)].slice(0, MAX_ITEMS_PER_REQUEST);
    })
    .refine((items) => items.every((id) => /^[A-Z0-9_@.]+$/.test(id)), 'Invalid item IDs supplied'),
  cities: z
    .string()
    .optional()
    .transform((value) => {
      const raw = value?.split(',').map((v) => v.trim()).filter(Boolean) ?? SUPPORTED_CITIES;
      return [...new Set(raw)] as CityName[];
    })
    .refine((cities) => cities.every((city) => SUPPORTED_CITIES.includes(city)), 'Invalid cities supplied'),
  minProfitPct: z
    .string()
    .optional()
    .transform((value) => Number(value ?? '0'))
    .refine((value) => Number.isFinite(value) && value >= 0 && value <= 500, 'Invalid minProfitPct')
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));

    const snapshots = await fetchAlbionPrices(parsed.items, parsed.cities);
    const opportunities = computeArbitrage(snapshots).filter(
      (opportunity) => opportunity.profitPercent >= parsed.minProfitPct
    );

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        filters: parsed,
        count: opportunities.length,
        opportunities
      },
      {
        headers: {
          'Cache-Control': 's-maxage=20, stale-while-revalidate=40'
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';

    return NextResponse.json(
      {
        error: 'Unable to generate arbitrage opportunities',
        message
      },
      { status: 400 }
    );
  }
}
// END OF FILE
