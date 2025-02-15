import {
  CreatableMenu,
  creatableMenuCodec,
  Menu,
  PublicMenu,
  PublicRestaurant,
  UpdatableMenu,
  updatableMenuCodec,
} from '@api-interfaces';
import { Body, Controller, Delete, Get, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(private readonly _menusService: MenusService) {}

  // * Create
  @Post()
  @UseGuards(AuthGuard)
  public async createOne(@Body() data: CreatableMenu, @UserParam() loggedUser: LoggedUser): Promise<unknown> {
    const task = pipe(
      data,
      TE.fromPredicate(creatableMenuCodec.is, error => {
        console.dir(error, { depth: null });
        return EXCEPTIONS.bad('Invalid restaurant data');
      }),
      TE.chain(creatableMenu => {
        return this._menusService.createOne({
          creatableMenu,
          loggedUser,
        });
      }),
      executeTaskEither,
    );

    return await task();
  }

  // * Update
  @Put(':id')
  @UseGuards(AuthGuard)
  public async updateOne(
    @Param('id') id: string,
    @Body() data: UpdatableMenu,
    @UserParam() loggedUser: LoggedUser,
  ): Promise<unknown> {
    const task = pipe(
      data,
      TE.fromPredicate(updatableMenuCodec.is, error => {
        console.dir(error, { depth: null });
        return EXCEPTIONS.bad('Invalid restaurant data');
      }),
      TE.chain(updatableMenu => {
        return this._menusService.updateOne({
          menuID: id,
          updatableMenu,
          loggedUser,
        });
      }),
      executeTaskEither,
    );

    return await task();
  }

  // * Delete
  @Delete(':id')
  @UseGuards(AuthGuard)
  public async deleteOne(@Param('id') id: string, @UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(
      this._menusService.deleteOne({
        menuID: id,
        loggedUser,
      }),
      executeTaskEither,
    );

    await task();
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  public async getAllMine(@UserParam() loggedUser: LoggedUser): Promise<ReadonlyArray<Menu>> {
    const task = pipe(loggedUser.organizationID, this._menusService.getAllForOrganization, executeTaskEither);

    return await task();
  }

  // * Public
  @Get('restaurant/:restaurantID') // ? dynamic paths (:id) should be the in the end to not override another path
  public async getRestaurantMenus(@Param('restaurantID') id: string): Promise<{
    readonly restaurant: PublicRestaurant;
    readonly menus: ReadonlyArray<PublicMenu>;
  }> {
    const task = pipe(id, this._menusService.getRestaurantMenus, executeTaskEither);

    return await task();
  }
}
