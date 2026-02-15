'use client';

import type { Opportunity } from '@/types/market';

export type SortField = 'profitPct' | 'netProfit' | 'dataAgeMinutes';

type Props = {
  rows: Opportunity[];
  sortField: SortField;
  onSort: (field: SortField) => void;
};

const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export function OpportunitiesTable({ rows, sortField, onSort }: Props): JSX.Element {
  return (
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>From</th>
            <th>To</th>
            <th>Buy</th>
            <th>Sell</th>
            <th onClick={() => onSort('netProfit')}>Net Profit {sortField === 'netProfit' ? '▼' : ''}</th>
            <th onClick={() => onSort('profitPct')}>Profit % {sortField === 'profitPct' ? '▼' : ''}</th>
            <th onClick={() => onSort('dataAgeMinutes')}>Data Age {sortField === 'dataAgeMinutes' ? '▲' : ''}</th>
            <th>Route</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.itemId}-${row.fromCity}-${row.toCity}-${row.routeType}`}>
              <td>
                <strong>{row.itemName}</strong>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{row.itemId}</div>
              </td>
              <td>{row.fromCity}</td>
              <td>{row.toCity}</td>
              <td>{formatNumber(row.buyPrice)}</td>
              <td>{formatNumber(row.sellPrice)}</td>
              <td>{formatNumber(row.netProfit)}</td>
              <td>{row.profitPct.toFixed(2)}%</td>
              <td>{row.dataAgeMinutes}m</td>
              <td>{row.routeType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
