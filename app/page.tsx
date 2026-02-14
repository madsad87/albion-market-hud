'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

type Opportunity = {
  itemId: string;
  fromCity: string;
  toCity: string;
  buyPrice: number;
  sellPrice: number;
  netProfit: number;
  profitPercent: number;
  observedAt: string;
};

type ApiResponse = {
  updatedAt: string;
  count: number;
  opportunities: Opportunity[];
};

const DEFAULT_ITEMS = 'T4_BAG,T4_CAPE,T4_MAIN_SWORD,T4_ARMOR_LEATHER_SET1,T5_2H_FIRESTAFF';

export default function DashboardPage(): JSX.Element {
  const [sourceCity, setSourceCity] = useState('Any');
  const [targetCity, setTargetCity] = useState('Any');
  const [itemQuery, setItemQuery] = useState(DEFAULT_ITEMS);
  const [minProfitPct, setMinProfitPct] = useState('10');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];

    return data.opportunities.filter((row) => {
      if (sourceCity !== 'Any' && row.fromCity !== sourceCity) return false;
      if (targetCity !== 'Any' && row.toCity !== targetCity) return false;
      return true;
    });
  }, [data, sourceCity, targetCity]);

  async function loadArbitrage(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        items: itemQuery,
        minProfitPct
      });

      const response = await fetch(`/api/arbitrage?${params.toString()}`);
      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody.message ?? 'Request failed');
      }

      const payload = (await response.json()) as ApiResponse;
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown client error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1>Albion Market Arbitrage Dashboard</h1>
          <button type="button" onClick={loadArbitrage} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className={styles.filters}>
          <input
            value={itemQuery}
            onChange={(event) => setItemQuery(event.target.value)}
            placeholder="Comma-separated item IDs"
            aria-label="items"
          />
          <select value={sourceCity} onChange={(event) => setSourceCity(event.target.value)} aria-label="source-city">
            <option>Any</option>
            <option>Bridgewatch</option>
            <option>Caerleon</option>
            <option>Fort Sterling</option>
            <option>Lymhurst</option>
            <option>Martlock</option>
            <option>Thetford</option>
          </select>
          <select value={targetCity} onChange={(event) => setTargetCity(event.target.value)} aria-label="target-city">
            <option>Any</option>
            <option>Bridgewatch</option>
            <option>Caerleon</option>
            <option>Fort Sterling</option>
            <option>Lymhurst</option>
            <option>Martlock</option>
            <option>Thetford</option>
          </select>
          <input
            type="number"
            min="0"
            max="500"
            value={minProfitPct}
            onChange={(event) => setMinProfitPct(event.target.value)}
            placeholder="Min % profit"
            aria-label="min-profit-percent"
          />
          <button type="button" onClick={loadArbitrage} disabled={loading}>
            Apply Filters
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>From City</th>
              <th>Buy Price</th>
              <th>To City</th>
              <th>Sell Price</th>
              <th>Net Profit</th>
              <th>Profit %</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map((opportunity) => (
              <tr key={`${opportunity.itemId}-${opportunity.fromCity}-${opportunity.toCity}`}>
                <td>{opportunity.itemId}</td>
                <td>{opportunity.fromCity}</td>
                <td>{opportunity.buyPrice.toLocaleString()}</td>
                <td>{opportunity.toCity}</td>
                <td>{opportunity.sellPrice.toLocaleString()}</td>
                <td>{opportunity.netProfit.toLocaleString()}</td>
                <td className={styles.positive}>{opportunity.profitPercent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && data && <p>Updated: {new Date(data.updatedAt).toLocaleString()} • Rows: {data.count}</p>}
      </section>
    </main>
  );
}
// END OF FILE
