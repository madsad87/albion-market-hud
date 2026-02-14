import { TRANSACTION_FEE_RATE } from '@/lib/config';
import type { ArbitrageOpportunity, PriceSnapshot } from '@/types/market';

export function computeArbitrage(priceSnapshots: PriceSnapshot[]): ArbitrageOpportunity[] {
  const byItem = new Map<string, PriceSnapshot[]>();

  for (const row of priceSnapshots) {
    const bucket = byItem.get(row.itemId) ?? [];
    bucket.push(row);
    byItem.set(row.itemId, bucket);
  }

  const opportunities: ArbitrageOpportunity[] = [];

  for (const [itemId, listings] of byItem.entries()) {
    for (const source of listings) {
      for (const target of listings) {
        if (source.city === target.city) continue;

        const grossSpread = target.sellPrice - source.buyPrice;
        if (grossSpread <= 0) continue;

        const fees = target.sellPrice * TRANSACTION_FEE_RATE;
        const netProfit = Math.round(grossSpread - fees);

        if (netProfit <= 0) continue;

        const profitPercent = (netProfit / source.buyPrice) * 100;

        opportunities.push({
          itemId,
          fromCity: source.city,
          toCity: target.city,
          buyPrice: source.buyPrice,
          sellPrice: target.sellPrice,
          grossSpread,
          netProfit,
          profitPercent,
          observedAt: source.observedAt > target.observedAt ? source.observedAt : target.observedAt
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.netProfit - a.netProfit);
}
// END OF FILE
