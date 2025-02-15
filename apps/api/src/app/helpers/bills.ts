/* eslint-disable functional/immutable-data */
import { MenuItem, OrderItem } from '@api-interfaces';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { MenuItemsRepository } from '@server/app/repositories/menu-items';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { uuidv7 } from 'uuidv7';

export const mapOrderItem =
  (itemIDs: ReadonlyArray<string>) =>
  (items: ReadonlyArray<MenuItem>): Array<Omit<OrderItem, 'status'>> => {
    // TODO: try to improve performance
    const orderItemList: Array<Omit<OrderItem, 'status'>> = [];
    for (const itemID of itemIDs) {
      const item = items.find(({ id }) => id === itemID);
      if (item) {
        orderItemList.push({
          id: uuidv7(),
          itemID,
          payedValue: item.price.value - (item.price.discount ?? 0),
        });
      }
    }

    return orderItemList;
  };

export const getActiveMenuItems = (
  menuItemsRepository: MenuItemsRepository,
  organizationID: string,
  itemIDs: ReadonlyArray<string>,
): TE.TaskEither<Exception, ReadonlyArray<MenuItem>> =>
  // * Get all the active menu items for the restaurant
  pipe(
    menuItemsRepository.findManyActiveInOrganization(organizationID, new Set(itemIDs)),
    TE.fromTaskOption(() => EXCEPTIONS.notFound('No MenuItem found for the restaurant')),
    // * If there's no items, then return an error
    TE.filterOrElse(
      items => items.length > 0,
      () => EXCEPTIONS.notFound('Given items not found'),
    ),
  );
