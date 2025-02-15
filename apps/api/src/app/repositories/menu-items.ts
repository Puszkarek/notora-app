import { ID, MenuItem } from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { indexedMenuItemToMenuItem } from '@server/app/helpers/menu';
import { Exception } from '@server/app/interfaces/error';
import { PrismaService } from '@server/app/modules/prisma';
import { isNotNull } from '@utils';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as TO from 'fp-ts/TaskOption';

import { EXCEPTIONS, getDeleteOneMenuItemPrismaError, getUpdateOneMenuItemPrismaError } from '../helpers/error';

type CreateFilter = {
  readonly organizationID: ID;
};

type UpdateFilter = {
  readonly id: ID;
  readonly organizationID: ID;
};

type DeleteFilter = {
  readonly id: ID;
  readonly organizationID: ID;
};

/** This is a demo repository for testing */
@Injectable()
export class MenuItemsRepository {
  constructor(private readonly _prismaClient: PrismaService) {}

  // * Create
  public readonly createMany = (
    { organizationID }: CreateFilter,
    creatableItems: ReadonlyArray<MenuItem>,
  ): TE.TaskEither<Exception, ReadonlyArray<MenuItem>> =>
    pipe(
      TE.tryCatch(async () => {
        const result = await this._prismaClient.menuItem.createMany({
          data: creatableItems.map(menuItem => ({
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description,
            tag: menuItem.tag,
            priceValue: menuItem.price.value,
            priceDiscount: menuItem.price.discount,
            photo: menuItem.photo?.filePath ?? null,
            organizationID,
          })),
        });

        if (result.count !== creatableItems.length) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Some items were not created');
        }

        return creatableItems;
      }, EXCEPTIONS.to.bad),
    );

  // * Update

  /**
   * Update many {@link MenuItem} with the given data
   * @param filter - The filter to get the items to update
   * @param updatedItems - The new data
   * @returns An {@link Option} containing the updated `Restaurant` or nothing
   */
  public readonly updateOne = (
    { id, organizationID }: UpdateFilter,
    menuItem: Omit<MenuItem, 'id'>,
  ): TE.TaskEither<Exception, MenuItem> =>
    pipe(
      TE.tryCatch(
        async () => {
          await this._prismaClient.menuItem.update({
            where: {
              id,
              organizationID,
            },
            data: {
              name: menuItem.name,
              description: menuItem.description,
              priceValue: menuItem.price.value,
              priceDiscount: menuItem.price.discount,
              photo: menuItem.photo?.filePath ?? null,
              tag: menuItem.tag,
              kitchen: menuItem.kitchen,
            },
          });

          return {
            ...menuItem,
            id,
          };
        },

        getUpdateOneMenuItemPrismaError,
      ),
    );

  // * Delete
  public readonly deleteOne = ({ id, organizationID }: DeleteFilter): TE.TaskEither<Exception, void> =>
    pipe(
      TE.tryCatch(
        async () => {
          const item = await this._prismaClient.menuItem.findUniqueOrThrow({
            where: {
              id,
              organizationID,
            },
            select: {
              menus: true,
            },
          });
          if (item.menus.length > 0) {
            // Remove the item from the orderedItemIDs
            await Promise.all(
              item.menus.map(async menu =>
                this._prismaClient.menu.update({
                  where: {
                    id: menu.id,
                  },
                  data: {
                    orderedItemIDs: {
                      set: menu.orderedItemIDs.filter(itemID => itemID !== id),
                    },
                  },
                }),
              ),
            );
          }
          await this._prismaClient.menuItem.delete({
            where: {
              id,
              organizationID,
            },
          });
        },

        getDeleteOneMenuItemPrismaError,
      ),
    );

  // eslint-disable-next-line functional/prefer-readonly-type
  public readonly findMany = (itemIDs: Array<ID>): TO.TaskOption<ReadonlyArray<MenuItem>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findMany({
            where: {
              id: {
                in: itemIDs,
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus => menus.map(indexedMenuItemToMenuItem)),
    );

  /**
   * Try to find all {@link MenuItem} for the given {@link ID} list
   *
   * @param userID - The ID to fetch restaurants for
   * @returns An {@link Option} containing the found `Restaurant` or nothing
   */
  // TODO: `findManyActiveInOrganization`
  public readonly findAllActiveInRestaurant = (restaurantID: string): TO.TaskOption<ReadonlyArray<MenuItem>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findMany({
            where: {
              menus: {
                some: {
                  restaurants: {
                    some: {
                      id: restaurantID,
                    },
                  },
                },
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus => menus.map(indexedMenuItemToMenuItem)),
    );

  public readonly findManyActiveInRestaurant = (
    restaurantID: string,
    itemIDs: ReadonlySet<string>,
  ): TO.TaskOption<ReadonlyArray<MenuItem>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findMany({
            where: {
              id: {
                in: [...itemIDs],
              },
              menus: {
                some: {
                  restaurants: {
                    some: {
                      id: restaurantID,
                    },
                  },
                },
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus => menus.map(indexedMenuItemToMenuItem)),
    );

  public readonly findManyActiveInOrganization = (
    organizationID: string,
    itemIDs: ReadonlySet<string>,
  ): TO.TaskOption<ReadonlyArray<MenuItem>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findMany({
            where: {
              id: {
                in: [...itemIDs],
              },
              menus: {
                some: {
                  restaurants: {
                    some: {
                      organizationID,
                    },
                  },
                },
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus => menus.map(indexedMenuItemToMenuItem)),
    );

  /**
   * Try to find all {@link MenuItems} for the given User's {@link ID}
   *
   * @param organizationID - The ID to fetch restaurants for
   * @returns An {@link Option} containing the found `Restaurant` or nothing
   */
  public readonly findAllForOrganization = (organizationID: ID): TO.TaskOption<ReadonlyArray<MenuItem>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findMany({
            where: {
              organizationID: organizationID,
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus => menus.map(indexedMenuItemToMenuItem)),
    );

  public readonly findOnePhoto = (menuItemID: ID, organizationID: string): TE.TaskEither<Exception, string | null> =>
    pipe(
      TE.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findFirst({
            where: {
              id: menuItemID,
              organizationID: organizationID,
            },
            select: {
              photo: true,
            },
          }),
        () => EXCEPTIONS.notFound('Menu item not found'),
      ),
      TE.filterOrElse(isNotNull, () => EXCEPTIONS.notFound('Menu item not found')),
      TE.map(menuItem => menuItem.photo),
    );

  public readonly userHasAccessToMenuItem = (
    menuItemID: ID,
    organizationID: string,
  ): TO.TaskOption<{
    photo: MenuItem['photo'];
  }> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menuItem.findUniqueOrThrow({
            select: {
              photo: true,
            },
            where: {
              id: menuItemID,
              organizationID: organizationID,
            },
          }),
      ),
      TO.map(menuItem => ({ photo: menuItem.photo ? { filePath: menuItem.photo } : null })),
    );

  public readonly userHasAccessToMenuItems = (
    menuItemIDs: ReadonlyArray<ID>,
    organizationID: string,
  ): TE.TaskEither<Exception, void> =>
    pipe(
      TE.tryCatch(async () => {
        const ownedMenuItems = await this._prismaClient.menuItem.count({
          where: {
            id: {
              in: menuItemIDs as Array<string>,
            },
            organizationID: organizationID,
          },
        });

        if (ownedMenuItems !== menuItemIDs.length) {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error('Some items were not found');
        }
      }, EXCEPTIONS.to.bad),
      TE.map(() => void 0),
    );
}
