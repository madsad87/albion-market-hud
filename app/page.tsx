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

type QuickInsight = {
  label: string;
  description: string;
  route: Opportunity;
};

const DEFAULT_ITEMS = 'T4_BAG,T4_CAPE,T4_MAIN_SWORD';

const formatSilver = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const buildQuickInsights = (rows: Opportunity[]): QuickInsight[] => {
  const freshRows = rows.filter((row) => row.dataAgeMinutes <= 30);
  const profitable = freshRows.filter((row) => row.netProfit > 0);

  const bestFlip = profitable.filter((row) => row.routeType === 'flip').sort((a, b) => b.netProfit - a.netProfit)[0];
  const bestTransport = profitable
    .filter((row) => row.routeType === 'transport')
    .sort((a, b) => b.netProfit - a.netProfit)[0];

  return [
    bestFlip
      ? {
          label: 'Immediate Flip',
          description: 'Same-city spread with fresh market data',
          route: bestFlip
        }
      : null,
    bestTransport
      ? {
          label: 'Immediate Transport',
          description: 'Cross-city spread with strongest current net profit',
          route: bestTransport
        }
      : null
  ].filter((row): row is QuickInsight => Boolean(row));
};

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
  const [autoScan, setAutoScan] = useState(false);
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

  const quickInsights = useMemo(() => buildQuickInsights(filteredRows), [filteredRows]);

  const loadData = async (): Promise<void> => {
    const validated = normalizeItemsInput(itemInput);
    if (validated.error) {
      setError(validated.error);
      return;
    }

    const manualOverrideItems = validated.items;
    if (!autoScan && !manualOverrideItems.length) {
      setError('Enter at least one item ID or enable auto-scan market.');
      return;
    }

    setLoading(true);
    setError(null);

    const query = new URLSearchParams({
      cities: SUPPORTED_CITIES.join(','),
      quality: '1',
      mode,
      minProfitPct,
      maxDataAge,
      scanMode: autoScan ? 'auto' : 'manual',
      ts: String(Date.now())
    });

    if (manualOverrideItems.length > 0) {
      query.set('items', manualOverrideItems.join(','));
    }

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

        {data && (
          <div className={styles.insightsPanel}>
            <h2>Immediate Opportunities</h2>
            {data.meta.scanMode === 'auto' && (
              <p className={styles.insightsSubtle}>Auto-scan results · {data.meta.scannedItemCount} items scanned</p>
            )}
            <p className={styles.insightsSubtle}>
              Shows fresh ({'<='}30m) profitable routes. Item metadata source: {data.meta.itemCatalog.source}.
            </p>
            <p className={styles.insightsSubtle}>
              Metadata coverage estimate for current input: {data.meta.itemCatalog.coveragePct}% ({data.meta.itemCatalog.knownItems}{' '}
              known item records).
            </p>
            {quickInsights.length === 0 ? (
              <p className={styles.insightsSubtle}>No fresh profitable flips/transports found for active filters.</p>
            ) : (
              <div className={styles.insightGrid}>
                {quickInsights.map((insight) => (
                  <article key={`${insight.label}-${insight.route.itemId}`} className={styles.insightCard}>
                    <h3>{insight.label}</h3>
                    <p className={styles.insightsSubtle}>{insight.description}</p>
                    <p>
                      <strong>{insight.route.itemName}</strong> ({insight.route.itemId})
                    </p>
                    <p>
                      {insight.route.fromCity} → {insight.route.toCity} · {insight.route.routeType}
                    </p>
                    <p>
                      Net: {formatSilver(insight.route.netProfit)} silver · Margin: {insight.route.profitPct.toFixed(2)}%
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <Filters
          itemInput={itemInput}
          startCity={startCity}
          targetCities={targetCities}
          tier={tier}
          mode={mode}
          minProfitPct={minProfitPct}
          maxDataAge={maxDataAge}
          autoScan={autoScan}
          onItemInput={setItemInput}
          onStartCity={setStartCity}
          onTargetCities={setTargetCities}
          onTier={setTier}
          onMode={setMode}
          onMinProfitPct={setMinProfitPct}
          onMaxDataAge={setMaxDataAge}
          onAutoScan={setAutoScan}
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
