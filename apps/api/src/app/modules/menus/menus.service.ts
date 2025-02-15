import { CreatableMenu, Menu, PublicMenu, PublicRestaurant, UpdatableMenu, USER_ROLE } from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { MenuItemsRepository } from '@server/app/repositories/menu-items';
import { MenusRepository } from '@server/app/repositories/menus';
import { RestaurantsRepository } from '@server/app/repositories/restaurants';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

@Injectable({
  scope: Scope.DEFAULT,
})
export class MenusService {
  constructor(
    private readonly _restaurantsRepository: RestaurantsRepository,
    private readonly _menuItemsRepository: MenuItemsRepository,
    private readonly _menusRepository: MenusRepository,
  ) {}

  public createOne = ({
    creatableMenu,
    loggedUser,
  }: {
    readonly creatableMenu: CreatableMenu;
    readonly loggedUser: LoggedUser;
  }): TE.TaskEither<Exception, Menu> => {
    return pipe(
      // * Only Admins can create menus
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('Only admins can create menus'),
      ),
      // * Create the menu
      TE.chain(() =>
        pipe(
          this._menusRepository.createOne(
            {
              organizationID: loggedUser.organizationID,
            },
            creatableMenu,
          ),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Failed to update the menu')),
        ),
      ),
    );
  };

  public updateOne = ({
    updatableMenu,
    menuID,
    loggedUser,
  }: {
    readonly menuID: string;
    readonly updatableMenu: UpdatableMenu;
    readonly loggedUser: LoggedUser;
  }): TE.TaskEither<Exception, Menu> => {
    return pipe(
      // * Only Admins can update menus
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('Only admins can update menus'),
      ),
      // * Check if the user is the owner of the menu
      TE.chain(() =>
        pipe(
          this._menusRepository.findByID(menuID),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Menu not found')),
          TE.filterOrElse(
            menu => menu.organizationID === loggedUser.organizationID,
            () => EXCEPTIONS.notFound('Menu not found'),
          ),
        ),
      ),
      // * Check if the user is the owner all the menu items
      TE.chain(() =>
        pipe(this._menuItemsRepository.userHasAccessToMenuItems(updatableMenu.itemIDs, loggedUser.organizationID)),
      ),
      // * Update the menu
      TE.chain(() =>
        pipe(
          this._menusRepository.updateOne(
            {
              id: menuID,
              organizationID: loggedUser.organizationID,
            },
            updatableMenu,
          ),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Failed to update the menu')),
        ),
      ),
    );
  };

  public deleteOne = ({
    menuID,
    loggedUser,
  }: {
    readonly menuID: string;
    readonly loggedUser: LoggedUser;
  }): TE.TaskEither<Exception, void> => {
    return pipe(
      // * Only Admins can update menus
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('Only admins can delete menus'),
      ),
      // ? The repository `deleteOne` will check if the user is the owner of the menu in the query by searching the item by ID and organizationID
      // * Update the menu
      TE.chain(() =>
        pipe(
          this._menusRepository.deleteOne({
            id: menuID,
            organizationID: loggedUser.organizationID,
          }),
          TE.fromTaskOption(() => EXCEPTIONS.notFound('Failed to update the menu')),
        ),
      ),
    );
  };

  public getAllForOrganization = (organizationID: string): TE.TaskEither<Exception, ReadonlyArray<Menu>> => {
    return pipe(
      organizationID,
      this._menusRepository.findAllForOrganization,
      TE.fromTaskOption(() => EXCEPTIONS.notFound('User not found')),
    );
  };

  public getRestaurantMenus = (
    restaurantID: string,
  ): TE.TaskEither<
    Exception,
    {
      readonly restaurant: PublicRestaurant;
      readonly menus: ReadonlyArray<PublicMenu>;
    }
  > =>
    pipe(
      restaurantID,
      this._restaurantsRepository.findOneWithMenus,
      TE.fromTaskOption(() => EXCEPTIONS.notFound('Restaurant not found')),
    );

  // * Public
  public getOneMenu = (id: string): TE.TaskEither<Exception, PublicMenu> => {
    return pipe(
      id,
      this._menusRepository.findPublicByID,
      TE.fromTaskOption(() => EXCEPTIONS.notFound('Menu not found')),
    );
  };
}
