'use client';

import { QUICK_PRESETS, SUPPORTED_CITIES } from '@/lib/config';
import type { ModeFilter } from '@/types/market';

type FiltersProps = {
  itemInput: string;
  startCity: string;
  targetCities: string[];
  tier: string;
  mode: ModeFilter;
  minProfitPct: string;
  maxDataAge: string;
  onItemInput: (value: string) => void;
  onStartCity: (value: string) => void;
  onTargetCities: (value: string[]) => void;
  onTier: (value: string) => void;
  onMode: (value: ModeFilter) => void;
  onMinProfitPct: (value: string) => void;
  onMaxDataAge: (value: string) => void;
  onApply: () => void;
  loading: boolean;
};

export function Filters(props: FiltersProps): JSX.Element {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.entries(QUICK_PRESETS).map(([label, preset]) => (
          <button key={label} type="button" onClick={() => props.onItemInput(preset.join(','))}>
            {label}
          </button>
        ))}
      </div>

      <div className="filtersGrid">
        <input
          value={props.itemInput}
          onChange={(event) => props.onItemInput(event.target.value)}
          placeholder="Comma-separated item IDs"
        />

        <select value={props.startCity} onChange={(event) => props.onStartCity(event.target.value)}>
          {SUPPORTED_CITIES.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>

        <select
          multiple
          value={props.targetCities}
          onChange={(event) => props.onTargetCities(Array.from(event.target.selectedOptions).map((x) => x.value))}
        >
          {SUPPORTED_CITIES.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>

        <select value={props.tier} onChange={(event) => props.onTier(event.target.value)}>
          <option value="Any">Any Tier</option>
          {['T4', 'T5', 'T6', 'T7', 'T8'].map((tier) => (
            <option key={tier}>{tier}</option>
          ))}
        </select>

        <select value={props.mode} onChange={(event) => props.onMode(event.target.value as ModeFilter)}>
          <option value="best">Best Route Only</option>
          <option value="top3">Top 3 Routes</option>
          <option value="flips">Flips Only</option>
          <option value="transport">Transport Only</option>
        </select>

        <input
          type="number"
          value={props.minProfitPct}
          onChange={(event) => props.onMinProfitPct(event.target.value)}
          placeholder="Min Profit %"
        />

        <input
          type="number"
          value={props.maxDataAge}
          onChange={(event) => props.onMaxDataAge(event.target.value)}
          placeholder="Max data age (min)"
        />

        <button type="button" onClick={props.onApply} disabled={props.loading}>
          {props.loading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
}
