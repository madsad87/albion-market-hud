'use client';

import { useMemo, useState } from 'react';

import { Filters } from '@/components/Filters';
import { OpportunitiesTable, type SortField } from '@/components/OpportunitiesTable';
import { MAX_ITEMS_PER_REQUEST, SUPPORTED_CITIES } from '@/lib/config';
import type { ModeFilter, Opportunity, OpportunitiesMeta } from '@/types/market';

import styles from './page.module.css';

type ApiPayload = {
  opportunities: Opportunity[];
  meta: OpportunitiesMeta;
  error?: string;
  details?: string;
};

const DEFAULT_ITEMS = 'T4_BAG,T4_CAPE,T4_MAIN_SWORD';

const normalizeItemsInput = (raw: string): { items: string[]; error?: string } => {
  const ids = [...new Set(raw.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean))];
  if (ids.length > MAX_ITEMS_PER_REQUEST) {
    return { items: [], error: `Too many items. Max ${MAX_ITEMS_PER_REQUEST}.` };
  }
  return { items: ids };
};

export default function DashboardPage(): JSX.Element {
  const [itemInput, setItemInput] = useState(DEFAULT_ITEMS);
  const [startCity, setStartCity] = useState('Lymhurst');
  const [targetCities, setTargetCities] = useState<string[]>([...SUPPORTED_CITIES]);
  const [tier, setTier] = useState('Any');
  const [mode, setMode] = useState<ModeFilter>('best');
  const [minProfitPct, setMinProfitPct] = useState('0');
  const [maxDataAge, setMaxDataAge] = useState('120');
  const [sortField, setSortField] = useState<SortField>('profitPct');

  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    if (!data) return [];

    let rows = data.opportunities.filter((row) => row.fromCity === startCity && targetCities.includes(row.toCity));

    if (tier !== 'Any') {
      rows = rows.filter((row) => row.itemId.startsWith(tier));
    }

    return [...rows].sort((a, b) => {
      if (sortField === 'dataAgeMinutes') return a.dataAgeMinutes - b.dataAgeMinutes;
      return b[sortField] - a[sortField];
    });
  }, [data, startCity, targetCities, tier, sortField]);

  const loadData = async (): Promise<void> => {
    const validated = normalizeItemsInput(itemInput);
    if (validated.error) {
      setError(validated.error);
      return;
    }

    if (!validated.items.length) {
      setError('Enter at least one item ID.');
      return;
    }

    setLoading(true);
    setError(null);

    const query = new URLSearchParams({
      items: validated.items.join(','),
      cities: SUPPORTED_CITIES.join(','),
      quality: '1',
      mode,
      minProfitPct,
      maxDataAge,
      ts: String(Date.now())
    });

    try {
      const response = await fetch(`/api/opportunities?${query.toString()}`);
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? 'Failed request');
      }

      setData(payload);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unexpected request error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1>Albion Market Arbitrage Dashboard</h1>
          <button type="button" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {data && <p>Last Updated: {new Date(data.meta.lastUpdated).toLocaleString()}</p>}

        <Filters
          itemInput={itemInput}
          startCity={startCity}
          targetCities={targetCities}
          tier={tier}
          mode={mode}
          minProfitPct={minProfitPct}
          maxDataAge={maxDataAge}
          onItemInput={setItemInput}
          onStartCity={setStartCity}
          onTargetCities={setTargetCities}
          onTier={setTier}
          onMode={setMode}
          onMinProfitPct={setMinProfitPct}
          onMaxDataAge={setMaxDataAge}
          onApply={loadData}
          loading={loading}
        />

        {error && <div className={styles.errorBanner}>{error}</div>}
        {loading && <p>Loading opportunities...</p>}
        {!loading && !error && data && filteredRows.length === 0 && <p>No opportunities found for current filters.</p>}
        {!loading && !error && filteredRows.length > 0 && (
          <OpportunitiesTable rows={filteredRows} sortField={sortField} onSort={setSortField} />
        )}
      </section>
    </main>
  );
}
