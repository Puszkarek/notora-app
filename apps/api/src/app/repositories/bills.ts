/* eslint-disable max-nested-callbacks */
/* eslint-disable max-lines */
import {
  AddPendingItemsToBillByRestaurantFilter,
  Bill,
  ConfirmPendingOrderItemsFilter,
  CreatableBill,
  DeclinePendingOrderItemsFilter,
  GetBillByTableFilter,
  GetBillByTableForOrganizationFilter,
  GetBillFilter,
  GetManyBillsFilter,
  ID,
  Order,
  OrderItem,
} from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { PrismaService } from '@server/app/modules/prisma';
import { isNotNull } from '@utils';
import { flow, pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class BillsRepository {
  private readonly _selectParameters = {
    id: true,
    restaurantID: true,
    tableID: true,
    status: true,
    closedAt: true,
    createdAt: true,
    orders: {
      select: {
        id: true,
        customerName: true,
        items: {
          select: {
            id: true,
            status: true,
            payedValue: true,
            itemID: true,
          },
          where: {
            status: {
              notIn: ['declined', 'removed'] as Array<'declined' | 'removed'>,
            },
          },
        },
      },
    },
    payedServiceFeeInPercentage: true,
  } as const;

  constructor(private readonly _prismaClient: PrismaService) {}

  // * Helpers
  private readonly _getOnePartial = (
    billID: string,
    organizationID: string,
  ): TE.TaskEither<
    Exception,
    Pick<Bill, 'id' | 'tableID' | 'status'> & {
      readonly orders: ReadonlyArray<
        Order & {
          readonly id: string;
        }
      >;
    }
  > =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.findUnique({
            select: {
              id: true,
              tableID: true,
              status: true,
              orders: this._selectParameters.orders,
            },
            where: {
              id: billID,
              restaurant: {
                organizationID,
              },
            },
          });
        },
        () => EXCEPTIONS.bad('Failed to get current bill'),
      ),
      // * Check if the bill exists
      TE.filterOrElse(isNotNull, () => EXCEPTIONS.notFound('Bill not found')),
    );

  private readonly _getOneStatus = ({
    billID,
    organizationID,
  }: {
    readonly billID: string;
    readonly organizationID: string;
  }): TE.TaskEither<Exception, Pick<Bill, 'status'>> =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.findUnique({
            select: {
              status: true,
            },
            where: {
              id: billID,
              restaurant: {
                organizationID,
              },
            },
          });
        },
        () => EXCEPTIONS.bad('Failed to get current bill'),
      ),
      // * Check if the bill exists
      TE.filterOrElse(isNotNull, () => EXCEPTIONS.notFound('Bill not found')),
    );

  // * Private

  public readonly findMany = ({
    organizationID,
    startDate,
    endDate,
    statusList,
  }: GetManyBillsFilter): TE.TaskEither<Exception, ReadonlyArray<Bill>> =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.findMany({
            select: this._selectParameters,
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
              status: {
                in: statusList,
              },
              restaurant: {
                organizationID: organizationID,
              },
            },
          });
        },
        () => EXCEPTIONS.bad('Error fetching all bills for organization'),
      ),
    );

  public readonly findOne = ({ billID, organizationID }: GetBillFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.findUnique({
            select: this._selectParameters,
            where: {
              id: billID,
              restaurant: {
                organizationID: organizationID,
              },
            },
          });
        },
        () => EXCEPTIONS.bad('failed to fetch one bill'),
      ),

      TE.chain(bill => pipe(bill, TE.fromNullable(EXCEPTIONS.notFound('Bill not found')))),
    );

  public readonly closeOne = ({ billID, organizationID }: GetBillFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * Check if the bill exists
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.findUniqueOrThrow({
            select: {
              status: true,
              restaurant: {
                select: {
                  serviceFeeInPercentage: true,
                },
              },
              orders: {
                select: {
                  items: {
                    select: {
                      status: true,
                    },
                  },
                },
              },
            },
            where: {
              id: billID,
              restaurant: {
                organizationID,
              },
            },
          });
        },
        () => EXCEPTIONS.notFound('Bill not found'),
      ),
      // * Check if the bill is active
      TE.filterOrElse(
        bill => bill.status === 'active',
        () => EXCEPTIONS.conflict('Bill is not active'),
      ),
      // * Check there's no pending order items
      TE.filterOrElse(
        bill => bill.orders.every(order => order.items.every(item => item.status !== 'pending')),
        () => EXCEPTIONS.conflict('Bill has pending order items'),
      ),
      TE.bindTo('savedBill'),
      TE.bind('updatedOrders', () =>
        TE.tryCatch(async () => {
          // * Close any `active` orderItem item IF there's
          return await this._prismaClient.orderItem.updateMany({
            where: {
              order: {
                bill: {
                  id: billID,
                },
              },
              status: {
                // * Only active orderItems can be closed
                equals: 'active',
              },
            },
            data: {
              status: 'closed',
            },
          });
        }, EXCEPTIONS.to.bad),
      ),
      // * Close the Bill
      TE.chain(({ savedBill }) =>
        TE.tryCatch(async () => {
          return await this._prismaClient.bill.update({
            select: this._selectParameters,
            where: {
              id: billID,
              restaurant: {
                organizationID,
              },
            },
            data: {
              closedAt: new Date(),
              status: 'closed',
              payedServiceFeeInPercentage: savedBill.restaurant.serviceFeeInPercentage,
            },
          });
        }, EXCEPTIONS.to.bad),
      ),
    );

  public readonly confirmOne = ({ billID, organizationID }: GetBillFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      this._getOnePartial(billID, organizationID),
      // * Only 'pending' bills can be confirmed
      TE.filterOrElse(
        bill => bill.status === 'pending',
        () => EXCEPTIONS.conflict('Bill is not pending'),
      ),
      TE.bindTo('savedBill'),
      // * Check if the table is available
      TE.bind('isTableAvailable', ({ savedBill: { tableID } }) => {
        return TE.tryCatch(
          async () => {
            const activeBill = await this._prismaClient.bill.findFirst({
              select: this._selectParameters,
              where: {
                // * Active bill
                status: {
                  in: ['active'],
                },
                tableID: {
                  equals: tableID,
                },
                restaurant: {
                  organizationID,
                },
              },
            });

            return activeBill === null;
          },
          () => EXCEPTIONS.bad('Failed to check if table is available'),
        );
      }),
      TE.filterOrElse(
        ({ isTableAvailable }) => isTableAvailable,
        () => EXCEPTIONS.bad('Table is not available'),
      ),
      TE.chain(({ savedBill }) =>
        TE.tryCatch(
          async () => {
            return await this._prismaClient.bill.update({
              select: this._selectParameters,
              where: {
                id: billID,
                restaurant: {
                  organizationID,
                },
              },
              data: {
                // * Set the bill as active
                status: 'active',
                // * Set all the pending order items as active
                orders: {
                  update: savedBill.orders.map(order => ({
                    where: {
                      id: order.id,
                    },
                    data: {
                      items: {
                        update: order.items.map(item => ({
                          where: {
                            id: item.id,
                            status: {
                              equals: 'pending',
                            },
                          },
                          data: {
                            status: 'active',
                          },
                        })),
                      },
                    },
                  })),
                },
              },
            });
          },
          () => EXCEPTIONS.bad('Failed to confirm bill'),
        ),
      ),
    );

  public readonly declineOne = (filters: { billID: string; organizationID: string }): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * This will fail if the user organization is different from the bill's restaurant organization
      this._getOneStatus(filters),
      // * Only 'pending' bills can be confirmed
      TE.filterOrElse(
        bill => bill.status === 'pending',
        () => EXCEPTIONS.conflict('Bill is not pending'),
      ),
      // * Decline the order items
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            return await this._prismaClient.orderItem.updateMany({
              where: {
                order: {
                  bill: {
                    id: filters.billID,
                  },
                },
                // * Status of the order item
                status: {
                  equals: 'pending',
                },
              },
              data: {
                status: 'declined',
              },
            });
          },
          () => EXCEPTIONS.bad('Failed to decline order items'),
        ),
      ),
      // * Decline the bill
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            return await this._prismaClient.bill.update({
              select: this._selectParameters,
              where: {
                id: filters.billID,
                status: {
                  // * Only pending bills can be declined
                  equals: 'pending',
                },
              },
              data: {
                status: 'declined',
                closedAt: new Date(),
              },
            });
          },
          () => EXCEPTIONS.bad('Failed to decline bill'),
        ),
      ),
    );

  public readonly declinePendingOrderItems = ({
    billID,
    organizationID,
    orderItemIDs,
  }: DeclinePendingOrderItemsFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * This will fail if the user organization is different from the bill's restaurant organization
      this._getOneStatus({ billID, organizationID }),
      // * Only 'active' bills can have order items declined
      TE.filterOrElse(
        bill => bill.status === 'active',
        () => EXCEPTIONS.conflict('Bill is not active'),
      ),
      // * Update the order
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            return await this._prismaClient.orderItem.updateMany({
              where: {
                id: {
                  in: orderItemIDs as Array<string>,
                },
                order: {
                  bill: {
                    id: billID,
                    restaurant: {
                      organizationID,
                    },
                  },
                },
                // * Status of the order item
                status: {
                  equals: 'pending',
                },
              },
              data: {
                status: 'declined',
              },
            });
          },
          () => EXCEPTIONS.bad('Error fetching the current bill'),
        ),
      ),
      TE.chain(() => this.findOne({ billID, organizationID })),
    );

  public readonly removeManyOrderItems = ({
    billID,
    organizationID,
    orderItemIDs,
  }: DeclinePendingOrderItemsFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * This will fail if the user organization is different from the bill's restaurant organization
      this._getOneStatus({ billID, organizationID }),
      // * Only 'active' bills can have items removed
      TE.filterOrElse(
        bill => bill.status === 'active',
        () => EXCEPTIONS.conflict('Bill is not active'),
      ),
      // * Update the order
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            return await this._prismaClient.orderItem.updateMany({
              where: {
                id: {
                  in: orderItemIDs as Array<string>,
                },
                order: {
                  bill: {
                    id: billID,
                    restaurant: {
                      organizationID,
                    },
                  },
                },
              },
              data: {
                status: 'removed',
              },
            });
          },
          () => EXCEPTIONS.bad('Error fetching the current bill'),
        ),
      ),
      TE.chain(() => this.findOne({ billID, organizationID })),
    );

  public readonly confirmPendingOrderItems = ({
    billID,
    organizationID,
    orderItemIDs,
  }: ConfirmPendingOrderItemsFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * This will fail if the user organization is different from the bill's restaurant organization
      this._getOneStatus({ billID, organizationID }),
      // * Only 'active' bills can be confirmed
      TE.filterOrElse(
        bill => bill.status === 'active',
        () => EXCEPTIONS.conflict('Bill is not active'),
      ),
      // * Update the order
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            return await this._prismaClient.orderItem.updateMany({
              where: {
                id: {
                  in: orderItemIDs as Array<string>,
                },
                order: {
                  bill: {
                    id: billID,
                    restaurant: {
                      organizationID,
                    },
                  },
                },
                status: {
                  equals: 'pending',
                },
              },
              data: {
                status: 'active',
              },
            });
          },
          () => EXCEPTIONS.bad('Error fetching the current bill'),
        ),
      ),
      TE.chain(() => this.findOne({ billID, organizationID })),
    );

  // * Public

  public readonly findActiveFromTable = ({
    restaurantID,
    tableID,
  }: GetBillByTableFilter): TE.TaskEither<Exception, O.Option<Bill>> =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.findFirst({
            select: this._selectParameters,
            where: {
              // * Active bill
              status: {
                in: ['pending', 'active'],
              },
              tableID: {
                equals: tableID,
              },
              restaurantID,
            },
          });
        },
        () => EXCEPTIONS.notFound('Table or Restaurant not found'),
      ),

      TE.map(flow(O.fromNullable)),
    );

  public readonly findActiveFromTableByOrganization = ({
    organizationID,
    tableID,
  }: GetBillByTableForOrganizationFilter): TE.TaskEither<Exception, O.Option<Bill>> =>
    pipe(
      TE.tryCatch(
        async () => {
          // * Check if the table exists
          await this._prismaClient.table.findUniqueOrThrow({
            select: {
              id: true,
            },
            where: {
              id: tableID,
              organization: {
                id: organizationID,
                restaurant: {
                  tables: {
                    some: {
                      id: tableID,
                    },
                  },
                },
              },
            },
          });

          return await this._prismaClient.bill.findFirst({
            select: this._selectParameters,
            where: {
              // * Active bill
              status: {
                in: ['pending', 'active'],
              },
              tableID: {
                equals: tableID,
              },
              restaurant: {
                organizationID,
              },
            },
          });
        },
        () => EXCEPTIONS.notFound('Table or Restaurant not found'),
      ),

      TE.map(flow(O.fromNullable)),
    );

  public readonly createOne = (
    data: Omit<CreatableBill, 'orders'> & {
      readonly orders: ReadonlyArray<{
        readonly customerName: string;
        readonly items: ReadonlyArray<{
          readonly itemID: ID;
          readonly payedValue: number;
        }>;
      }>;
    },
  ): TE.TaskEither<Exception, Bill> =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.create({
            select: this._selectParameters,

            data: {
              id: uuidv7(),
              status: 'pending',
              restaurantID: data.restaurantID,
              tableID: data.tableID,
              orders: {
                create: data.orders.map(order => ({
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
              // ? createdAt is set by the database
            },
          });
        },
        () => EXCEPTIONS.bad('Failed to create bill'),
      ),
    );

  public readonly createInstaOne = ({
    customerName,
    orderItems,
    restaurantID,
  }: Omit<CreatableBill, 'orders' | 'tableID'> & {
    readonly orderItems: ReadonlyArray<Omit<OrderItem, 'status'>>;
    readonly customerName: string;
  }): TE.TaskEither<Exception, Bill> =>
    pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.create({
            select: this._selectParameters,
            data: {
              id: uuidv7(),
              status: 'closed',
              orders: {
                create: {
                  id: uuidv7(),
                  customerName,
                  items: {
                    create: orderItems.map(item => ({
                      id: uuidv7(),
                      payedValue: item.payedValue,
                      status: 'active',
                      menuItem: {
                        connect: {
                          id: item.itemID,
                        },
                      },
                    })),
                  },
                },
              },
              restaurantID: restaurantID,
              // ? createdAt is set by the database
            },
          });
        },
        () => EXCEPTIONS.bad('Failed to create bill'),
      ),
    );

  public readonly createConfirmedOne = (data: {
    tableID: string;
    organizationID: string;
  }): TE.TaskEither<Exception, Bill> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.bill.create({
            select: this._selectParameters,
            data: {
              id: uuidv7(),
              status: 'active',
              restaurant: {
                connect: {
                  organizationID: data.organizationID,
                },
              },
              table: {
                connect: {
                  id: data.tableID,
                },
              },
              // ? createdAt is set by the database
            },
          });
        },
        () => EXCEPTIONS.bad('Failed to create bill'),
      ),
    );
  };

  /**
   * ! For customers, this is used in a public endpoint, so be careful
   */
  public readonly addPendingItemsByRestaurant = (
    { billID, restaurantID }: AddPendingItemsToBillByRestaurantFilter,
    {
      customerName,
      orderItems,
    }: {
      readonly customerName: string;
      readonly orderItems: ReadonlyArray<Omit<OrderItem, 'status'>>;
    },
  ): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * Get the current bill
      TE.tryCatch(async () => {
        return await this._prismaClient.bill.findUniqueOrThrow({
          select: {
            orders: {
              select: {
                id: true,
                customerName: true,
              },
            },
          },
          where: {
            id: billID,
            restaurantID,
            // * Active bill
            status: {
              in: ['pending', 'active'],
            },
          },
        });
      }, EXCEPTIONS.to.notFound),
      // * Update the bill
      TE.chain(currentBill => {
        return TE.tryCatch(async () => {
          // * Check if the customer order already exists
          const customerOrder = currentBill.orders.find(order => order.customerName === customerName);
          if (customerOrder) {
            await this._prismaClient.order.update({
              where: {
                id: customerOrder.id,
              },
              data: {
                items: {
                  create: orderItems.map(item => ({
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
              },
            });

            return await this._prismaClient.bill.findUniqueOrThrow({
              select: this._selectParameters,
              where: {
                id: billID,
              },
            });
          }
          return await this._prismaClient.bill.update({
            select: this._selectParameters,
            where: {
              id: billID,
            },
            data: {
              orders: {
                create: {
                  id: uuidv7(),
                  customerName,
                  items: {
                    create: orderItems.map(item => ({
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
                },
              },
            },
          });
        }, EXCEPTIONS.to.bad);
      }),
    );

  /**
   *
   * For Managers, so we need the organizationID to confirm he is the owner of the restaurant
   */
  public readonly addActiveItems = (
    { billID, organizationID }: GetBillFilter,
    {
      customerName,
      orderItems,
    }: {
      orderItems: ReadonlyArray<Omit<OrderItem, 'status'>>;
      customerName: string;
    },
  ): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * Get the current bill
      TE.tryCatch(async () => {
        return await this._prismaClient.bill.update({
          select: this._selectParameters,
          where: {
            id: billID,
            restaurant: {
              organizationID,
            },
            // * Active bill
            status: {
              in: ['pending', 'active'],
            },
          },
          data: {
            orders: {
              create: {
                id: uuidv7(),
                customerName,
                items: {
                  create: orderItems.map(item => ({
                    id: uuidv7(),
                    payedValue: item.payedValue,
                    status: 'active',
                    menuItem: {
                      connect: {
                        id: item.itemID,
                      },
                    },
                  })),
                },
              },
            },
          },
        });
      }, EXCEPTIONS.to.bad),
    );
}
