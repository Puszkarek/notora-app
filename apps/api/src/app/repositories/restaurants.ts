/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { ID, PublicMenu, PublicRestaurant, Restaurant, Theme, UpdatableRestaurant } from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import {
  EXCEPTIONS,
  getUpdateOneRestaurantPrismaError,
  getUpdateOneRestaurantStatusPrismaError,
} from '@server/app/helpers/error';
import { indexedMenuItemToMenuItem } from '@server/app/helpers/menu';
import {
  getPrismaThemeData,
  indexedPublicRestaurantToPublicRestaurant,
  indexedRestaurantToRestaurant,
} from '@server/app/helpers/restaurant';
import { PrismaService } from '@server/app/modules/prisma';
import { omitUndefined } from '@utils';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as TO from 'fp-ts/TaskOption';
import * as t from 'io-ts';
import { uuidv7 } from 'uuidv7';

import { Exception } from '../interfaces/error';

export type UpdateOneRestaurantFilter = {
  readonly restaurantID: ID;
  readonly organizationID: ID;
};

export type UpdateRestaurantStatusFilter = {
  readonly restaurantID: ID;
  readonly organizationID: ID;
};

const hasID = <T>(value: T): value is T & { readonly id: string } =>
  t
    .type({
      id: t.string,
    })
    .is(value);

/** This is a demo repository for testing */
@Injectable()
export class RestaurantsRepository {
  private readonly _selectParameters = {
    id: true,
    address: true,
    createdAt: true,
    description: true,
    name: true,
    organizationID: true,
    phone: true,
    isClosed: true,
    menus: {
      select: {
        id: true,
      },
    },
    orderedMenuIDs: true,
    tables: {
      select: {
        id: true,
        name: true,
      },
    },
    instagram: true,
    facebook: true,
    whatsapp: true,
    email: true,
    website: true,
    serviceFeeInPercentage: true,
    theme: {
      select: {
        type: true,
        value: true,
      },
    },
  };

  constructor(private readonly _prismaClient: PrismaService) {}

  // * Update

  public readonly updateMy = (
    organizationID: ID,
    {
      name,
      address,
      description,
      phone,
      email,
      facebook,
      instagram,
      website,
      whatsapp,
      tables,
      theme,
      menuIDs,
      serviceFeeInPercentage,
    }: UpdatableRestaurant,
  ): TE.TaskEither<Exception, Restaurant> =>
    pipe(
      TE.tryCatch(async () => {
        if (tables === undefined) {
          return undefined;
        }
        const parsedTables: ReadonlyArray<{ readonly id?: string; readonly name: string }> = tables;

        const updatableTables = parsedTables.filter(hasID);

        const currentTables = await this._prismaClient.table.findMany({
          where: {
            // * Get only the active tables in the restaurant
            restaurantID: {
              not: null,
            },
            organizationID,
          },
          select: {
            id: true,
          },
        });

        const tablesToDelete = currentTables.filter(
          currentTable => !updatableTables.some(updatableTable => updatableTable.id === currentTable.id),
        );

        return {
          disconnect: tablesToDelete.map(table => ({ id: table.id })),
          create: parsedTables
            .filter(table => !table.id)
            .map(table => ({
              id: uuidv7(),
              name: table.name,
              organization: {
                connect: {
                  id: organizationID,
                },
              },
            })),
          update: updatableTables.map(table => ({
            where: {
              id: table.id,
            },
            data: {
              name: table.name,
            },
          })),
        };
      }, getUpdateOneRestaurantPrismaError),
      TE.chain(parsedTables =>
        TE.tryCatch(async () => {
          const currentThemeID =
            theme === undefined
              ? undefined
              : await this._prismaClient.restaurant.findUnique({
                  where: {
                    organizationID,
                  },
                  select: {
                    theme: {
                      select: {
                        id: true,
                      },
                    },
                  },
                });

          const updatableRestaurant = omitUndefined({
            name,
            address,
            description,
            phone,
            email,
            facebook,
            instagram,
            website,
            whatsapp,

            theme: getPrismaThemeData(theme, currentThemeID?.theme?.id),
            serviceFeeInPercentage,
            tables: parsedTables,
          });

          const updatedMenus = omitUndefined({
            menus: menuIDs
              ? {
                  set: menuIDs.map(menuID => ({
                    id: menuID,
                  })),
                }
              : undefined,
            orderedMenuIDs: menuIDs,
          });
          const updateResponse = await this._prismaClient.restaurant.update({
            select: this._selectParameters,
            where: {
              organizationID,
            },
            data: {
              ...updatableRestaurant,
              ...updatedMenus,
            },
          });

          const themeData = (updatableRestaurant as { theme: ReturnType<typeof getPrismaThemeData> }).theme;

          if (themeData?.disconnect) {
            await this._prismaClient.theme.delete({
              where: {
                id: themeData.disconnect.id,
              },
            });
          }

          return updateResponse;
        }, getUpdateOneRestaurantPrismaError),
      ),
      TE.map(indexedRestaurantToRestaurant),
    );

  public readonly updateClosedStatus = (
    { restaurantID, organizationID }: UpdateRestaurantStatusFilter,
    isClosed: boolean,
  ): TE.TaskEither<Exception, Restaurant> =>
    pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.restaurant.update({
          select: this._selectParameters,
          where: {
            id: restaurantID,
            organizationID,
            organization: {
              subscription: {
                supervision: true,
              },
            },
          },
          data: {
            isClosed,
          },
        });
      }, getUpdateOneRestaurantStatusPrismaError),
      TE.map(indexedRestaurantToRestaurant),
    );

  // * Find Restaurants

  /**
   * Try to find an {@link Restaurant} with the given {@link ID}
   *
   * @param restaurantID - The ID to fetch
   * @returns An {@link Option} containing the found `Restaurant` or nothing
   */
  public readonly findByID = (restaurantID: ID): TO.TaskOption<Restaurant> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.restaurant.findUnique({
            select: this._selectParameters,
            where: {
              id: restaurantID,
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(indexedRestaurantToRestaurant),
    );

  public readonly findOneWithTables = ({
    userID,
    organizationID,
  }: {
    readonly userID: ID;
    readonly organizationID: ID;
  }): TO.TaskOption<{
    tables: ReadonlyArray<{ readonly id: string }>;
  }> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.restaurant.findUnique({
            select: {
              id: true,
              tables: {
                select: {
                  id: true,
                },
              },
            },
            where: {
              organizationID,
              organization: {
                members: {
                  some: {
                    id: userID,
                  },
                },
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
    );

  public readonly findOneWithMenus = (
    restaurantID: ID,
  ): TO.TaskOption<{
    readonly restaurant: PublicRestaurant;
    readonly menus: ReadonlyArray<PublicMenu>;
  }> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.restaurant.findUnique({
            select: {
              id: true,
              address: true,
              createdAt: true,
              description: true,
              name: true,
              organizationID: true,
              isClosed: true,
              phone: true,
              orderedMenuIDs: true,
              menus: {
                select: {
                  id: true,
                  name: true,
                  orderedItemIDs: true,
                  items: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      priceValue: true,
                      priceDiscount: true,
                      photo: true,
                      tag: true,
                      kitchen: true,
                    },
                  },
                },
              },
              instagram: true,
              facebook: true,
              whatsapp: true,
              email: true,
              website: true,
              theme: {
                select: {
                  type: true,
                  value: true,
                },
              },
              serviceFeeInPercentage: true,
            },
            where: {
              id: restaurantID,
              organization: {
                subscription: {
                  digitalMenu: true,
                },
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(({ menus, orderedMenuIDs, ...restaurant }) => {
        const orderedMenus = menus.sort(
          (valueA, valueB) => orderedMenuIDs.indexOf(valueA.id) - orderedMenuIDs.indexOf(valueB.id),
        );

        return {
          restaurant: indexedPublicRestaurantToPublicRestaurant(restaurant),
          menus: orderedMenus.map(({ id, items, orderedItemIDs, name }) => ({
            id,
            name,
            orderedItemIDs,
            items: items.map(indexedMenuItemToMenuItem),
          })),
        };
      }),
    );

  /**
   * Try to find all {@link Restaurant} for the given {@link ID}
   *
   * @param userID - The ID to fetch restaurants for
   * @returns An {@link Option} containing the found `Restaurant` or nothing
   */
  public readonly findAllForOrganization = (organizationID: ID): TE.TaskEither<Exception, ReadonlyArray<Restaurant>> =>
    pipe(
      TE.tryCatch(
        async () =>
          await this._prismaClient.restaurant.findMany({
            select: this._selectParameters,
            where: {
              organizationID,
            },
          }),
        EXCEPTIONS.to.bad,
      ),
      TE.map(restaurants => restaurants.map(indexedRestaurantToRestaurant)),
    );

  public readonly findIDForOrganization = (organizationID: ID): TE.TaskEither<Exception, ID> =>
    pipe(
      TE.tryCatch(
        async () =>
          await this._prismaClient.restaurant.findUniqueOrThrow({
            select: {
              id: true,
            },
            where: {
              organizationID,
            },
          }),
        EXCEPTIONS.to.bad,
      ),
      TE.map(restaurant => restaurant.id),
    );
}
