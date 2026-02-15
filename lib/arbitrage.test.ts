import { describe, expect, it } from 'vitest';

import { calculateProfitWithFees } from '@/lib/arbitrage';

describe('calculateProfitWithFees', () => {
  it('calculates net profit and percent with fee formula', () => {
    const result = calculateProfitWithFees(1000, 1400, {
      buyOrderFee: 0.025,
      sellOrderFee: 0.025,
      tax: 0.04
    });

    expect(Math.round(result.netProfit)).toBe(216);
    expect(result.profitPct).toBeCloseTo(21.07, 2);
  });

  it('ignores zero prices', () => {
    expect(calculateProfitWithFees(0, 1000).netProfit).toBe(0);
    expect(calculateProfitWithFees(1000, 0).netProfit).toBe(0);
  });

  it('changes output when fees change', () => {
    const lowFees = calculateProfitWithFees(1000, 1400, {
      buyOrderFee: 0.01,
      sellOrderFee: 0.01,
      tax: 0.02
    });

    const highFees = calculateProfitWithFees(1000, 1400, {
      buyOrderFee: 0.04,
      sellOrderFee: 0.04,
      tax: 0.08
    });

    expect(lowFees.netProfit).toBeGreaterThan(highFees.netProfit);
  });
});
