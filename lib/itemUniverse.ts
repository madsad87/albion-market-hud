import { MAX_AUTO_SCAN_ITEMS } from '@/lib/config';
import { hasLoadedItemMeta } from '@/lib/itemMeta';

const BASE_AUTO_SCAN_ITEMS = [
  // High-liquidity resources
  'T4_FIBER',
  'T4_HIDE',
  'T4_ORE',
  'T4_WOOD',
  'T4_ROCK',
  'T5_FIBER',
  'T5_HIDE',
  'T5_ORE',
  'T5_WOOD',
  'T5_ROCK',
  // Accessories
  'T4_BAG',
  'T5_BAG',
  'T4_CAPE',
  'T5_CAPE',
  // Popular weapons
  'T4_MAIN_SWORD',
  'T4_MAIN_BOW',
  'T4_2H_FIRESTAFF',
  'T5_MAIN_SWORD',
  'T5_MAIN_BOW',
  'T5_2H_FIRESTAFF',
  // Popular armor
  'T4_ARMOR_LEATHER_SET1',
  'T4_ARMOR_CLOTH_SET1',
  'T4_ARMOR_PLATE_SET1',
  'T5_ARMOR_LEATHER_SET1',
  'T5_ARMOR_CLOTH_SET1',
  'T5_ARMOR_PLATE_SET1',
  // Consumables
  'T4_POTION_HEAL',
  'T4_POTION_ENERGY',
  'T4_MEAL_SOUP',
  'T5_POTION_HEAL',
  'T5_POTION_ENERGY',
  'T5_MEAL_SOUP'
] as const;

export type ScanUniverseResult = {
  itemIds: string[];
  scanSource: string;
};

export const getCuratedScanUniverse = (): ScanUniverseResult => {
  const itemIds = [...new Set(BASE_AUTO_SCAN_ITEMS)].slice(0, MAX_AUTO_SCAN_ITEMS);

  // Once full ao-data dump integration is in place, expand category picks from itemMeta.
  const scanSource = hasLoadedItemMeta()
    ? 'curated-liquidity-universe+item-meta-ready'
    : 'curated-liquidity-universe';

  return { itemIds, scanSource };
};
