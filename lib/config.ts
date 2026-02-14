import type { CityName } from '@/types/market';

export const SUPPORTED_CITIES: CityName[] = [
  'Bridgewatch',
  'Caerleon',
  'Fort Sterling',
  'Lymhurst',
  'Martlock',
  'Thetford'
];

export const DEFAULT_ITEMS = [
  'T4_BAG',
  'T4_CAPE',
  'T4_MAIN_SWORD',
  'T4_ARMOR_LEATHER_SET1',
  'T5_2H_FIRESTAFF'
];

export const MAX_ITEMS_PER_REQUEST = 50;
export const REQUEST_TIMEOUT_MS = 12_000;
export const CACHE_TTL_MS = 30_000;
export const TRANSACTION_FEE_RATE = 0.065; // market + setup fee estimate
// END OF FILE
