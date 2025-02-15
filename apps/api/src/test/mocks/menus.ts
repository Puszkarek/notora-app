import { Menu } from '@api-interfaces';
import { DRINK_MENU_ITEMS, MAIN_MENU_ITEMS } from '@server/test/mocks/menu-items';
import { DEFAULT_ORGANIZATION } from '@server/test/mocks/organizations';
import { uuidv7 } from 'uuidv7';

/** The system should initialize with a default restaurant */
export const MAIN_MENU: Menu = {
  id: uuidv7(),
  name: 'Principal',
  organizationID: DEFAULT_ORGANIZATION.id,
  itemIDs: MAIN_MENU_ITEMS.map(item => item.id),
};

export const DRINKS_MENU: Menu = {
  id: uuidv7(),
  name: 'Drinks',
  organizationID: DEFAULT_ORGANIZATION.id,
  itemIDs: DRINK_MENU_ITEMS.map(item => item.id),
};
