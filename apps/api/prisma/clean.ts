/* eslint-disable max-lines-per-function */
/* eslint-disable unicorn/prefer-top-level-await */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  console.log('Cleaning...');

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

  console.log('Cleaning done');
};

main().finally(() => {
  prisma.$disconnect();
});
