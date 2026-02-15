export type ItemMeta = {
  itemId: string;
  itemName: string;
  category: string;
  weight: number;
  enchantment: number;
  canBeEquipped: boolean;
};

const FALLBACK_NAME = 'Unknown Item';

const RAW_ITEM_META = `
T4_BAG|Novice's Bag|Accessories|8|0|true
T4_CAPE|Novice's Cape|Accessories|5|0|true
T4_MAIN_SWORD|Novice's Broadsword|Weapon|3|0|true
T4_ARMOR_LEATHER_SET1|Adept's Mercenary Jacket|Armor|11|0|true
T5_2H_FIRESTAFF|Expert's Great Fire Staff|Weapon|4|0|true
T4_MAIN_BOW|Novice's Bow|Weapon|3|0|true
T4_2H_FIRESTAFF|Novice's Great Fire Staff|Weapon|4|0|true
T4_FIBER|Tier 4 Fiber|Resource|0.5|0|false
T4_HIDE|Tier 4 Hide|Resource|0.5|0|false
T4_ORE|Tier 4 Ore|Resource|1.2|0|false
`.trim();

const parseRawMeta = (): Map<string, ItemMeta> => {
  const rows = RAW_ITEM_META.split('\n').map((line) => line.trim()).filter(Boolean);
  return rows.reduce((acc, row) => {
    const [itemId, itemName, category, weightRaw, enchantmentRaw, equippedRaw] = row.split('|');
    if (!itemId || !itemName || !category) return acc;

    acc.set(itemId, {
      itemId,
      itemName,
      category,
      weight: Number(weightRaw) || 0,
      enchantment: Number(enchantmentRaw) || 0,
      canBeEquipped: equippedRaw === 'true'
    });

    return acc;
  }, new Map<string, ItemMeta>());
};

const itemMetaById = parseRawMeta();

const humanizeItemId = (itemId: string): string => {
  const compact = itemId.replace(/@\d+$/, '').replace(/^[A-Z]\d_/, '').replace(/_/g, ' ');
  return compact
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
};

export const getItemMeta = (itemId: string): ItemMeta => {
  const existing = itemMetaById.get(itemId);
  if (existing) return existing;

  return {
    itemId,
    itemName: humanizeItemId(itemId) || FALLBACK_NAME,
    category: 'Unknown',
    weight: 0,
    enchantment: 0,
    canBeEquipped: false
  };
};

export const hasLoadedItemMeta = (): boolean => itemMetaById.size > 0;

export const getKnownItemCount = (): number => itemMetaById.size;

export const getKnownItemIds = (): string[] => Array.from(itemMetaById.keys());
