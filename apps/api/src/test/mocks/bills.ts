/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Bill } from '@api-interfaces';
import { MAIN_MENU_ITEMS } from '@server/test/mocks/menu-items';
import { DEFAULT_RESTAURANT } from '@server/test/mocks/restaurants';
import { uuidv7 } from 'uuidv7';

const menuItem = MAIN_MENU_ITEMS[0]!;

/** The system should initialize with a default restaurant */
export const PENDING_BILL: Omit<Bill, 'restaurantID'> = {
  id: uuidv7(),
  status: 'pending',
  orders: [
    {
      customerName: 'Guilherme Puszkarek',
      items: [
        {
          id: uuidv7(),
          itemID: menuItem.id,
          payedValue: menuItem.price.value - (menuItem.price.discount ?? 0),
          status: 'pending',
        },
      ],
    },
  ],
  createdAt: new Date(),
  tableID: DEFAULT_RESTAURANT.tables[1]!.id,

  closedAt: null,
  payedServiceFeeInPercentage: null,
};

export const PENDING_BILL_2: Omit<Bill, 'restaurantID'> = {
  id: uuidv7(),
  status: 'pending',
  orders: [
    {
      customerName: 'Rapha',
      items: [
        {
          id: uuidv7(),
          itemID: menuItem.id,
          payedValue: menuItem.price.value - (menuItem.price.discount ?? 0),
          status: 'pending',
        },
      ],
    },
    {
      customerName: 'Guilherme Puszkarek',
      items: [
        {
          id: uuidv7(),
          itemID: menuItem.id,
          payedValue: menuItem.price.value - (menuItem.price.discount ?? 0),
          status: 'pending',
        },
      ],
    },
  ],
  createdAt: new Date(),
  tableID: DEFAULT_RESTAURANT.tables[2]!.id,

  closedAt: null,
  payedServiceFeeInPercentage: null,
};

export const ACTIVE_BILL: Omit<Bill, 'restaurantID'> = {
  id: uuidv7(),
  status: 'active',
  orders: [
    {
      customerName: 'Guilherme Puszkarek',
      items: [
        {
          id: uuidv7(),
          itemID: menuItem.id,
          payedValue: menuItem.price.value - (menuItem.price.discount ?? 0),
          status: 'pending',
        },
      ],
    },
  ],
  createdAt: new Date(),
  tableID: DEFAULT_RESTAURANT.tables[3]!.id,

  closedAt: null,
  payedServiceFeeInPercentage: null,
};

export const ACTIVE_BILL_2: Omit<Bill, 'restaurantID'> = {
  id: uuidv7(),
  status: 'active',
  orders: [
    {
      customerName: 'Guilherme Puszkarek',
      items: [
        {
          id: uuidv7(),
          itemID: menuItem.id,
          payedValue: menuItem.price.value - (menuItem.price.discount ?? 0),
          status: 'active',
        },
      ],
    },
    {
      customerName: 'Rapha',
      items: [
        {
          id: uuidv7(),
          itemID: menuItem.id,
          payedValue: menuItem.price.value - (menuItem.price.discount ?? 0),
          status: 'pending',
        },
      ],
    },
  ],
  createdAt: new Date(),
  tableID: DEFAULT_RESTAURANT.tables[0]!.id,

  closedAt: null,
  payedServiceFeeInPercentage: null,
};
