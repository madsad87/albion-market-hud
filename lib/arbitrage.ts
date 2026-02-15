import { BUY_ORDER_FEE, SELL_ORDER_FEE, TRANSACTION_TAX } from '@/lib/config';
import type { ModeFilter, NormalizedPrice, Opportunity } from '@/types/market';

type FeeConfig = {
  buyOrderFee: number;
  sellOrderFee: number;
  tax: number;
};

const defaultFees: FeeConfig = {
  buyOrderFee: BUY_ORDER_FEE,
  sellOrderFee: SELL_ORDER_FEE,
  tax: TRANSACTION_TAX
};

const minutesOld = (timestamps: string[]): number => {
  const valid = timestamps.map((v) => Date.parse(v)).filter((v) => Number.isFinite(v));
  if (!valid.length) return 999999;
  const oldest = Math.min(...valid);
  return Math.max(0, Math.round((Date.now() - oldest) / 60000));
};

export const calculateProfitWithFees = (
  buyPrice: number,
  sellPrice: number,
  fees: FeeConfig = defaultFees
): { netProfit: number; profitPct: number } => {
  if (buyPrice <= 0 || sellPrice <= 0) {
    return { netProfit: 0, profitPct: 0 };
  }

  const costBasis = buyPrice * (1 + fees.buyOrderFee);
  const netSell = sellPrice * (1 - fees.sellOrderFee - fees.tax);
  const netProfit = netSell - costBasis;
  const profitPct = (netProfit / costBasis) * 100;

  return { netProfit, profitPct };
};

const buildOpportunity = (source: NormalizedPrice, target: NormalizedPrice): Opportunity | null => {
  const buyPrice = source.sellPriceMin;
  const sellPrice = target.buyPriceMax;
  const { netProfit, profitPct } = calculateProfitWithFees(buyPrice, sellPrice);

  if (buyPrice <= 0 || sellPrice <= 0 || netProfit <= 0) return null;

  return {
    itemId: source.itemId,
    fromCity: source.city,
    toCity: target.city,
    buyPrice,
    sellPrice,
    netProfit,
    profitPct,
    feesApplied: {
      buyFee: BUY_ORDER_FEE,
      sellFee: SELL_ORDER_FEE,
      tax: TRANSACTION_TAX
    },
    dataAgeMinutes: minutesOld([source.sellPriceMinDate, target.buyPriceMaxDate]),
    routeType: source.city === target.city ? 'flip' : 'transport'
  };
};

export function generateOpportunities(prices: NormalizedPrice[], mode: ModeFilter = 'best'): Opportunity[] {
  const byItem = new Map<string, NormalizedPrice[]>();
  for (const row of prices) {
    const list = byItem.get(row.itemId) ?? [];
    list.push(row);
    byItem.set(row.itemId, list);
  }

  const flips: Opportunity[] = [];
  const transports: Opportunity[] = [];

  for (const entries of byItem.values()) {
    for (const source of entries) {
      for (const target of entries) {
        const opportunity = buildOpportunity(source, target);
        if (!opportunity) continue;
        if (opportunity.routeType === 'flip') flips.push(opportunity);
        else transports.push(opportunity);
      }
    }
  }

  const sortedTransports = transports.sort((a, b) => b.netProfit - a.netProfit);
  const sortedFlips = flips.sort((a, b) => b.netProfit - a.netProfit);

  if (mode === 'flips') return sortedFlips;
  if (mode === 'transport') return sortedTransports;

  if (mode === 'top3') {
    const grouped = new Map<string, Opportunity[]>();
    for (const route of sortedTransports) {
      const key = route.itemId;
      const existing = grouped.get(key) ?? [];
      if (existing.length < 3) {
        existing.push(route);
        grouped.set(key, existing);
      }
    }
    return Array.from(grouped.values()).flat();
  }

  const bestByItem = new Map<string, Opportunity>();
  for (const route of sortedTransports) {
    const current = bestByItem.get(route.itemId);
    if (!current || route.netProfit > current.netProfit) {
      bestByItem.set(route.itemId, route);
    }
  }

  return Array.from(bestByItem.values()).sort((a, b) => b.netProfit - a.netProfit);
}
