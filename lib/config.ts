import type { CityName, ModeFilter } from '@/types/market';

const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const SUPPORTED_CITIES: CityName[] = [
  'Bridgewatch',
  'Caerleon',
  'Fort Sterling',
  'Lymhurst',
  'Martlock',
  'Thetford'
];

export const DEFAULT_ITEMS = ['T4_BAG', 'T4_CAPE', 'T4_MAIN_SWORD', 'T4_ARMOR_LEATHER_SET1', 'T5_2H_FIRESTAFF'];

export const QUICK_PRESETS: Record<string, string[]> = {
  Starter: ['T4_BAG', 'T4_CAPE', 'T4_MAIN_*'],
  Resources: ['T4_FIBER', 'T4_HIDE', 'T4_ORE'],
  Weapons: ['T4_MAIN_SWORD', 'T4_2H_FIRESTAFF', 'T4_MAIN_BOW']
};

export const MAX_ITEMS_PER_REQUEST = 50;
export const REQUEST_TIMEOUT_MS = 8_000;
export const MAX_AUTO_SCAN_ITEMS = Math.max(1, Math.floor(parseNumberEnv(process.env.MAX_AUTO_SCAN_ITEMS, 40)));
export const AUTO_SCAN_BATCH_SIZE = Math.max(1, Math.floor(parseNumberEnv(process.env.AUTO_SCAN_BATCH_SIZE, 20)));
export const AUTO_SCAN_TIMEOUT_BUDGET_MS = Math.max(
  REQUEST_TIMEOUT_MS,
  Math.floor(parseNumberEnv(process.env.AUTO_SCAN_TIMEOUT_BUDGET_MS, 18_000))
);

export const BUY_ORDER_FEE = parseNumberEnv(process.env.BUY_ORDER_FEE, 0.025);
export const SELL_ORDER_FEE = parseNumberEnv(process.env.SELL_ORDER_FEE, 0.025);
export const TRANSACTION_TAX = parseNumberEnv(process.env.TRANSACTION_TAX, 0.04);

export const PRICE_CACHE_TTL_SECONDS = Math.max(1, Math.floor(parseNumberEnv(process.env.PRICE_CACHE_TTL, 300)));

export const DEFAULT_QUALITY = 1;
export const DEFAULT_MAX_DATA_AGE_MINUTES = 120;

export const DEFAULT_MODE: ModeFilter = 'best';
