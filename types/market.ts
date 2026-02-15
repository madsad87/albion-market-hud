export type CityName =
  | 'Bridgewatch'
  | 'Caerleon'
  | 'Fort Sterling'
  | 'Lymhurst'
  | 'Martlock'
  | 'Thetford';

export type RouteType = 'flip' | 'transport';

export type ModeFilter = 'best' | 'top3' | 'flips' | 'transport';

export type PriceRow = {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
};

export type NormalizedPrice = {
  itemId: string;
  city: CityName;
  quality: number;
  buyPriceMax: number;
  sellPriceMin: number;
  buyPriceMaxDate: string;
  sellPriceMinDate: string;
};

export type Opportunity = {
  itemId: string;
  itemName: string;
  fromCity: CityName;
  toCity: CityName;
  buyPrice: number;
  sellPrice: number;
  netProfit: number;
  profitPct: number;
  feesApplied: {
    buyFee: number;
    sellFee: number;
    tax: number;
  };
  dataAgeMinutes: number;
  routeType: RouteType;
};

export type OpportunitiesMeta = {
  updatedAt: string;
  lastUpdated: string;
  itemCount: number;
  scannedItemCount: number;
  scanMode: 'manual' | 'auto';
  scanSource: 'query-items' | 'known-items-auto';
  quality: number;
  cityCount: number;
  itemCatalog: {
    source: string;
    knownItems: number;
    coveragePct: number;
  };
  scanMode: 'manual' | 'auto';
  scannedItemCount: number;
  scanSource: string;
};
