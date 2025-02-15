/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
/* eslint-disable unicorn/prefer-top-level-await */
import { PrismaClient } from '@prisma/client';
import { uuidv7 } from 'uuidv7';
import yargs from 'yargs';

import { ACTIVE_BILL, ACTIVE_BILL_2, PENDING_BILL, PENDING_BILL_2 } from '../src/test/mocks/bills';
import { DRINK_MENU_ITEMS, MAIN_MENU_ITEMS } from '../src/test/mocks/menu-items';
import { DRINKS_MENU, MAIN_MENU } from '../src/test/mocks/menus';
import { DEFAULT_ORGANIZATION } from '../src/test/mocks/organizations';
import { DEFAULT_RESTAURANT } from '../src/test/mocks/restaurants';
import { DEFAULT_USER } from '../src/test/mocks/users';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const { argv } = yargs()
    .option('email', {
      description: 'The email of your user',
      type: 'string',
    })
    .demandOption(['email']);

  const userEmail: unknown = argv['email'];

  // * Check if the values are valid
  if (typeof userEmail !== 'string') {
    console.error('Organization name is required!');
    return;
  }

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.table.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Seeding...');

  console.log('Creating default organization and user...');

  await prisma.organization.create({
    data: {
      name: DEFAULT_ORGANIZATION.name,
      id: DEFAULT_ORGANIZATION.id,
    },
  });

  await prisma.user.create({
    data: {
      id: DEFAULT_USER.id,
      email: userEmail,
      name: DEFAULT_USER.name,
      role: DEFAULT_USER.role,
      organizationID: DEFAULT_ORGANIZATION.id,
      ownedOrganization: {
        connect: {
          id: DEFAULT_ORGANIZATION.id,
        },
      },
    },
  });

  console.log('Creating default restaurant & menus...');

  const restaurant = await prisma.restaurant.create({
    data: {
      id: DEFAULT_RESTAURANT.id,
      address: DEFAULT_RESTAURANT.address,
      name: DEFAULT_RESTAURANT.name,
      organizationID: DEFAULT_ORGANIZATION.id,
      menus: {
        create: [
          {
            id: MAIN_MENU.id,
            name: MAIN_MENU.name,
            organizationID: DEFAULT_ORGANIZATION.id,
            orderedItemIDs: [],
          },
          {
            id: DRINKS_MENU.id,
            name: DRINKS_MENU.name,
            organizationID: DEFAULT_ORGANIZATION.id,
            orderedItemIDs: [],
          },
        ],
      },
    },
  });

  console.log('Creating default menu items...');

  await Promise.all(
    MAIN_MENU_ITEMS.map(async item => {
      await prisma.menuItem.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.description,
          priceValue: item.price.value,
          priceDiscount: item.price.discount,
          tag: item.tag,
          kitchen: item.kitchen,
          menus: {
            connect: {
              id: MAIN_MENU.id,
            },
          },
          organizationID: DEFAULT_ORGANIZATION.id,
        },
      });
    }),
  );

  await Promise.all(
    DRINK_MENU_ITEMS.map(async item => {
      await prisma.menuItem.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.description,
          priceValue: item.price.value,
          priceDiscount: item.price.discount,
          tag: item.tag,
          kitchen: item.kitchen,
          menus: {
            connect: {
              id: DRINKS_MENU.id,
            },
          },
          organizationID: DEFAULT_ORGANIZATION.id,
        },
      });
    }),
  );

  console.log('Linking menu items to menus...');

  await prisma.menu.update({
    where: {
      id: MAIN_MENU.id,
    },
    data: {
      orderedItemIDs: MAIN_MENU_ITEMS.map(item => item.id),
    },
  });

  await prisma.menu.update({
    where: {
      id: DRINKS_MENU.id,
    },
    data: {
      orderedItemIDs: DRINK_MENU_ITEMS.map(item => item.id),
    },
  });

  console.log('Creating default tables and bills...');

  await prisma.table.createMany({
    data: DEFAULT_RESTAURANT.tables.map(table => ({
      id: table.id,
      name: table.name,
      restaurantID: restaurant.id,
      organizationID: DEFAULT_ORGANIZATION.id,
    })),
  });

  console.log('Creating default bills...');

  await Promise.all(
    [PENDING_BILL, PENDING_BILL_2, ACTIVE_BILL, ACTIVE_BILL_2].map(async bill =>
      prisma.bill.create({
        data: {
          id: bill.id,
          closedAt: bill.closedAt,
          createdAt: bill.createdAt,
          status: bill.status,
          tableID: bill.tableID,
          restaurantID: restaurant.id,
          orders: {
            create: bill.orders.map(order => ({
              id: uuidv7(),
              customerName: order.customerName,
              items: {
                create: order.items.map(item => ({
                  id: uuidv7(),
                  payedValue: item.payedValue,
                  status: 'pending',
                  menuItem: {
                    connect: {
                      id: item.itemID,
                    },
                  },
                })),
              },
            })),
          },
        },
      }),
    ),
  );

  console.log('Seeding complete!');
};

main().finally(() => {
  prisma.$disconnect();
});
