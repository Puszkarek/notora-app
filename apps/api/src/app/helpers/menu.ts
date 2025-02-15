import { MenuItem } from '@api-interfaces';

type IndexedMenuItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceValue: number;
  readonly priceDiscount: number | null;
  readonly photo: string | null;
  readonly tag: string | null;
  readonly kitchen: string | null;
};

export const indexedMenuItemToMenuItem = (menuItem: IndexedMenuItem): MenuItem => ({
  id: menuItem.id,
  name: menuItem.name,
  description: menuItem.description,
  tag: menuItem.tag,
  kitchen: menuItem.kitchen,
  price: {
    value: menuItem.priceValue,
    discount: menuItem.priceDiscount,
  },
  photo: menuItem.photo ? { filePath: menuItem.photo } : null,
});
