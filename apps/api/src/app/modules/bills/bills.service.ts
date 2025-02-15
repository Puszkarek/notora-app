/* eslint-disable max-lines */
/* eslint-disable max-nested-callbacks */
/* eslint-disable max-lines-per-function */

import {
  Bill,
  ConfirmPendingOrderItemsFilter,
  CreatableBill,
  CreatableConfirmedBill,
  DeclinePendingOrderItemsFilter,
  GetManyBillsFilter,
  OrderItem,
} from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { getActiveMenuItems, mapOrderItem } from '@server/app/helpers/bills';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { BillsRepository } from '@server/app/repositories/bills';
import { MenuItemsRepository } from '@server/app/repositories/menu-items';
import { RestaurantsRepository } from '@server/app/repositories/restaurants';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import { uuidv7 } from 'uuidv7';

type AddManyPendingOrderItemsArguments = {
  readonly restaurantID: string;
  readonly billID: string;
  readonly customerName: string;
  readonly itemIDs: ReadonlyArray<string>;
};

type AddManyConfirmedOrderItemsArguments = {
  readonly billID: string;
  readonly customerName: string;
  readonly itemIDs: ReadonlyArray<string>;
  readonly loggedUser: LoggedUser;
};

type OpenInstaOneArguments = {
  readonly itemIDs: ReadonlyArray<string>;
  readonly customerName: string;
};

@Injectable({
  scope: Scope.DEFAULT,
})
export class BillsService {
  constructor(
    private readonly _billsRepository: BillsRepository,
    private readonly _menuItemsRepository: MenuItemsRepository,
    private readonly _restaurantsRepository: RestaurantsRepository,
  ) {}

  public openPendingOne = (data: CreatableBill): TE.TaskEither<Exception, Bill> =>
    pipe(
      TE.Do,
      // * Check if the restaurant exists
      TE.bind('restaurant', () =>
        pipe(
          this._restaurantsRepository.findByID(data.restaurantID),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Restaurant not found')),
        ),
      ),
      // * Check that the table exists
      TE.filterOrElse(
        ({ restaurant }) => restaurant.tables.some(({ id }) => id === data.tableID),
        () => EXCEPTIONS.notFound('Table not found'),
      ),
      // * Check that the table is not already in use
      TE.bind('activeBill', () =>
        pipe(
          this._billsRepository.findActiveFromTable({
            restaurantID: data.restaurantID,
            tableID: data.tableID,
          }),
          TE.chain(tableOption =>
            pipe(
              tableOption,
              O.fold(
                // If there's no active bill, then it's valid
                () => TE.right(void 0),
                // If there's an active bill, then it's invalid
                () => TE.left(EXCEPTIONS.conflict("There's already an active bill for this table")),
              ),
            ),
          ),
        ),
      ),

      TE.bind('menuItems', () =>
        pipe(
          Object.entries(data.orders).map(([customerName, order]) => ({
            customerName,
            itemIDs: new Set(order.items.map(({ itemID }) => itemID)),
          })),
          orders =>
            orders.map(({ itemIDs, customerName }) =>
              pipe(
                this._menuItemsRepository.findManyActiveInRestaurant(data.restaurantID, itemIDs),
                TE.fromTaskOption(() => EXCEPTIONS.notFound('Items not found')),
                TE.map(items => ({
                  items,
                  customerName,
                })),
              ),
            ),
          TE.sequenceArray,
        ),
      ),

      // * If everything is valid, then create the bill
      TE.chain(({ menuItems }) => {
        // The filter already checks if the bill belongs to the restaurant, so no need to check again
        const orderItems = menuItems.flatMap(({ items, customerName }) => ({
          customerName,
          items: items.map(({ id, price }) => ({
            itemID: id,
            payedValue: price.value - (price.discount ?? 0),
          })),
        }));

        return this._billsRepository.createOne({
          restaurantID: data.restaurantID,
          tableID: data.tableID,
          orders: orderItems,
        });
      }),
    );

  public addManyPendingOrderItems = ({
    restaurantID,
    billID,
    itemIDs,
    customerName,
  }: AddManyPendingOrderItemsArguments): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * Get all the active menu items for the restaurant
      this._menuItemsRepository.findManyActiveInRestaurant(restaurantID, new Set(itemIDs)),
      TE.fromTaskOption(() => EXCEPTIONS.notFound('No MenuItem found for the restaurant')),
      TE.map(mapOrderItem(itemIDs)),
      TE.chain(orderItems =>
        // The filter already checks if the bill belongs to the restaurant, so no need to check again
        this._billsRepository.addPendingItemsByRestaurant(
          {
            restaurantID,
            billID,
          },
          {
            orderItems,
            customerName,
          },
        ),
      ),
    );

  public openConfirmedOne = (data: CreatableConfirmedBill, loggedUser: LoggedUser): TE.TaskEither<Exception, Bill> =>
    pipe(
      TE.Do,
      // * Check if the restaurant exists
      TE.bind('restaurant', () =>
        pipe(
          this._restaurantsRepository.findOneWithTables({
            userID: loggedUser.id,
            organizationID: loggedUser.organizationID,
          }),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Restaurant not found')),
        ),
      ),
      // * Check that the table exists
      TE.filterOrElse(
        ({ restaurant }) => restaurant.tables.some(({ id }) => id === data.tableID),
        () => EXCEPTIONS.notFound('Table not found'),
      ),
      // * Check that the table is not already in use
      TE.bind('activeBill', () =>
        pipe(
          this._billsRepository.findActiveFromTableByOrganization({
            organizationID: loggedUser.organizationID,
            tableID: data.tableID,
          }),
          TE.chain(tableOption =>
            pipe(
              tableOption,
              O.fold(
                // If there's no active bill, then it's valid
                () => TE.right(void 0),
                // If there's an active bill, then it's invalid
                () => TE.left(EXCEPTIONS.conflict("There's already an active bill for this table")),
              ),
            ),
          ),
        ),
      ),

      // * If everything is valid, then create the bill
      TE.chain(() => {
        return this._billsRepository.createConfirmedOne({
          tableID: data.tableID,
          organizationID: loggedUser.organizationID,
        });
      }),
    );

  public addManyConfirmedOrderItems = ({
    billID,
    itemIDs,
    customerName,
    loggedUser,
  }: AddManyConfirmedOrderItemsArguments): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * ONLY `admin` & `cook` can add a confirmed item to a bill
      loggedUser,
      TE.fromPredicate(
        user => user.role === 'cook' || user.role === 'admin',
        () => EXCEPTIONS.forbidden('You do not have permission to add confirmed items to bills'),
      ),
      // * Get all the active menu items for the restaurant
      TE.chain(() => getActiveMenuItems(this._menuItemsRepository, loggedUser.organizationID, itemIDs)),
      TE.map(mapOrderItem(itemIDs)),
      // * Update the bill
      TE.chain(orderItems =>
        // The filter already checks if the bill belongs to the restaurant & the restaurant belongs to the logged user organization, so no need to check again
        this._billsRepository.addActiveItems(
          {
            organizationID: loggedUser.organizationID,
            billID,
          },
          {
            orderItems,
            customerName,
          },
        ),
      ),
    );

  public openInstaOne = (
    { itemIDs, customerName }: OpenInstaOneArguments,
    loggedUser: LoggedUser,
  ): TE.TaskEither<Exception, Bill> =>
    pipe(
      // * ONLY `admin` & `cook` can add a confirmed item to a bill
      loggedUser,
      TE.fromPredicate(
        user => user.role === 'cook' || user.role === 'admin',
        () => EXCEPTIONS.forbidden('You do not have permission to add confirmed items to bills'),
      ),
      // * Get all the active menu items for the restaurant
      TE.chain(() => getActiveMenuItems(this._menuItemsRepository, loggedUser.organizationID, itemIDs)),
      TE.map(mapOrderItem(itemIDs)),
      TE.bindTo('orderItems'),
      TE.bind('restaurantID', () => pipe(this._restaurantsRepository.findIDForOrganization(loggedUser.organizationID))),
      // * Update the bill
      TE.chain(({ orderItems, restaurantID }) =>
        // The filter already checks if the bill belongs to the restaurant & the restaurant belongs to the logged user organization, so no need to check again
        this._billsRepository.createInstaOne({
          restaurantID,
          orderItems,
          customerName,
        }),
      ),
    );

  public confirmManyPendingOrderItems = (filters: ConfirmPendingOrderItemsFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      /**
       * The filter already checks if:
       * - The bill is active
       * - The bill belongs to the given organization
       *
       * so no need to check again
       *
       */
      this._billsRepository.confirmPendingOrderItems(filters),
    );

  public declineManyPendingOrderItems = (filters: DeclinePendingOrderItemsFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      /**
       * The filter already checks if:
       * - The bill is active
       * - The bill belongs to the restaurant
       * so no need to check again
       *
       */
      this._billsRepository.declinePendingOrderItems(filters),
    );

  public removeManyOrderItems = (filters: DeclinePendingOrderItemsFilter): TE.TaskEither<Exception, Bill> =>
    pipe(
      /**
       * The filter already checks if:
       * - The bill is active
       * - The bill belongs to the restaurant
       * so no need to check again
       *
       */
      this._billsRepository.removeManyOrderItems(filters),
    );

  // * Bills

  public getActiveForTable = ({
    restaurantID,
    tableID,
  }: {
    readonly restaurantID: string;
    readonly tableID: string;
  }): TE.TaskEither<Exception, O.Option<Bill>> =>
    pipe(
      TE.Do,
      // * Check if the restaurant exists
      TE.bind('restaurant', () =>
        pipe(
          this._restaurantsRepository.findByID(restaurantID),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Restaurant not found')),
        ),
      ),
      // * Check that the table exists
      TE.filterOrElse(
        ({ restaurant }) => restaurant.tables.some(({ id }) => id === tableID),
        () => EXCEPTIONS.notFound('Table not found'),
      ),
      TE.chain(() =>
        this._billsRepository.findActiveFromTable({
          tableID,
          restaurantID,
        }),
      ),
    );

  public confirmOne = (billID: string, loggedUser: LoggedUser): TE.TaskEither<Exception, Bill> =>
    pipe(
      // The filter already checks if the bill belongs to the restaurant, so no need to check again
      this._billsRepository.confirmOne({
        billID,
        organizationID: loggedUser.organizationID,
      }),
    );

  public closeOne = (billID: string, loggedUser: LoggedUser): TE.TaskEither<Exception, Bill> =>
    pipe(
      // The filter already checks if the bill belongs to the restaurant, so no need to check again
      this._billsRepository.closeOne({
        billID,
        organizationID: loggedUser.organizationID,
      }),
    );

  public declineOne = (billID: string, loggedUser: LoggedUser): TE.TaskEither<Exception, Bill> =>
    pipe(
      loggedUser,
      TE.fromPredicate(
        user => user.role === 'cook' || user.role === 'admin',
        () => EXCEPTIONS.forbidden('You are not allowed to decline a bill'),
      ),
      TE.chain(() => this._billsRepository.declineOne({ billID, organizationID: loggedUser.organizationID })),
    );

  public getManyByRange = (filters: GetManyBillsFilter): TE.TaskEither<Exception, ReadonlyArray<Bill>> =>
    pipe(
      // * The permissions are already applied to the filter, the user will only be able to get bills from his organization
      this._billsRepository.findMany(filters),
    );
}
