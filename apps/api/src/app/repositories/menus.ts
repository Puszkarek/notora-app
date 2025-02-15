import {
  CreatableMenu,
  CreateOneMenuFilter,
  DeleteOneMenuFilter,
  ID,
  Menu,
  PublicMenu,
  UpdatableMenu,
  UpdateOneMenuFilter,
} from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { indexedMenuItemToMenuItem } from '@server/app/helpers/menu';
import { PrismaService } from '@server/app/modules/prisma';
import { pipe } from 'fp-ts/lib/function';
import * as TO from 'fp-ts/TaskOption';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class MenusRepository {
  private readonly _selectParameters = {
    id: true,
    orderedItemIDs: true,
    name: true,
    organizationID: true,
  };

  constructor(private readonly _prismaClient: PrismaService) {}

  // * Create

  public readonly createOne = (
    { organizationID }: CreateOneMenuFilter,
    updatableMenu: CreatableMenu,
  ): TO.TaskOption<Menu> =>
    pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.menu.create({
          select: this._selectParameters,
          data: {
            id: uuidv7(),
            name: updatableMenu.name,
            organizationID,
          },
        });
      }),
      TO.map(menu => ({
        id: menu.id,
        name: menu.name,
        organizationID: menu.organizationID,
        itemIDs: menu.orderedItemIDs,
      })),
    );

  // * Update

  public readonly updateOne = (
    { id, organizationID }: UpdateOneMenuFilter,
    updatableMenu: UpdatableMenu,
  ): TO.TaskOption<Menu> =>
    pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.menu.update({
          select: this._selectParameters,
          where: {
            id,
            organizationID,
          },
          data: {
            name: updatableMenu.name,
            items: {
              set: updatableMenu.itemIDs.map(itemID => ({
                id: itemID,
              })),
            },
            orderedItemIDs: updatableMenu.itemIDs as Array<string>,
          },
        });
      }),
      TO.map(menu => ({
        id: menu.id,
        name: menu.name,
        organizationID: menu.organizationID,
        itemIDs: menu.orderedItemIDs,
      })),
    );

  // * Delete

  public readonly deleteOne = ({ id, organizationID }: DeleteOneMenuFilter): TO.TaskOption<void> =>
    pipe(
      TO.tryCatch(async () => {
        await this._prismaClient.menu.delete({
          select: this._selectParameters,
          where: {
            id,
            organizationID,
          },
        });
      }),
    );

  // * Find Menus

  public readonly findByID = (menuID: ID): TO.TaskOption<Menu> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menu.findUnique({
            select: this._selectParameters,
            where: {
              id: menuID,
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(({ id, name, organizationID, orderedItemIDs }) => ({
        id,
        name,
        organizationID,
        itemIDs: orderedItemIDs,
      })),
    );

  public readonly findPublicByID = (menuID: ID): TO.TaskOption<PublicMenu> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menu.findUnique({
            select: {
              id: true,
              items: true,
              orderedItemIDs: true,
              name: true,
            },
            where: {
              id: menuID,
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(({ id, items, name, orderedItemIDs }) => ({
        id,
        name,
        orderedItemIDs,
        items: items.map(indexedMenuItemToMenuItem),
      })),
    );

  public readonly findAllForOrganization = (organizationID: ID): TO.TaskOption<ReadonlyArray<Menu>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menu.findMany({
            select: this._selectParameters,
            where: {
              organizationID,
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus =>
        menus.map(({ id, orderedItemIDs, name }) => ({
          id,
          name,
          organizationID,
          itemIDs: orderedItemIDs,
        })),
      ),
    );

  // TODO: Find all for organization
  public readonly findAllForRestaurant = (restaurantID: ID): TO.TaskOption<ReadonlyArray<Menu>> =>
    pipe(
      TO.tryCatch(
        async () =>
          await this._prismaClient.menu.findMany({
            select: this._selectParameters,
            where: {
              restaurants: {
                some: {
                  id: restaurantID,
                },
              },
            },
          }),
      ),
      TO.chain(TO.fromNullable),
      TO.map(menus =>
        menus.map(({ id, orderedItemIDs, name, organizationID }) => ({
          id,
          name,
          organizationID,
          itemIDs: orderedItemIDs,
        })),
      ),
    );
}
