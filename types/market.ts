export type CityName =
  | 'Bridgewatch'
  | 'Caerleon'
  | 'Fort Sterling'
  | 'Lymhurst'
  | 'Martlock'
  | 'Thetford';

export type AlbionPriceRow = {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
};

export type PriceSnapshot = {
  itemId: string;
  city: CityName;
  buyPrice: number;
  sellPrice: number;
  observedAt: string;
};

export type ArbitrageOpportunity = {
  itemId: string;
  fromCity: CityName;
  toCity: CityName;
  buyPrice: number;
  sellPrice: number;
  grossSpread: number;
  netProfit: number;
  profitPercent: number;
  observedAt: string;
};
// END OF FILE
