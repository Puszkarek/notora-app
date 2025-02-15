import { creatableMenuItemCodec, MenuItem, menuItemCodec, updatableMenuItemCodec } from '@api-interfaces';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { flow, pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { FormDataRequest } from 'nestjs-form-data';

import { MenuItemsService } from './menu-items.service';

const createManyDataCodec = t.readonlyArray(creatableMenuItemCodec);

@Controller('items')
export class MenuItemsController {
  constructor(private readonly _menuItemsService: MenuItemsService) {}

  // * Create
  @Post()
  @UseGuards(AuthGuard)
  @FormDataRequest()
  public async createMany(
    @Body()
    {
      data,
      ...rawFiles
    }: {
      readonly data: string;
    } & Record<string, File>,
    @UserParam() loggedUser: LoggedUser,
  ): Promise<ReadonlyArray<MenuItem>> {
    const task = pipe(
      // * Limit the number of files to 10
      rawFiles,
      TE.fromPredicate(
        files => Object.keys(files).length <= 10,
        () => EXCEPTIONS.tooLarge('Too many files'),
      ),
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            return JSON.parse(data) as unknown;
          },
          () => EXCEPTIONS.bad('Invalid JSON data'),
        ),
      ),
      TE.chain(
        flow(
          TE.fromPredicate(createManyDataCodec.is, () => {
            return EXCEPTIONS.bad('Some items are invalid');
          }),
        ),
      ),
      TE.chain(updatableItems => {
        return this._menuItemsService.createMany({
          updatableItems,
          organizationID: loggedUser.organizationID,
          files: rawFiles,
        });
      }),
      executeTaskEither,
    );

    return await task();
  }

  @Patch(':itemID')
  @UseGuards(AuthGuard)
  @FormDataRequest()
  public async updateOne(
    @Body()
    {
      data,
      file,
    }: {
      readonly data: string;
      file?: unknown; // expected File
    },
    @Param('itemID') itemID: string,
    @UserParam() loggedUser: LoggedUser,
  ): Promise<MenuItem> {
    const task = pipe(
      TE.tryCatch(
        async () => {
          return JSON.parse(data) as unknown;
        },
        () => EXCEPTIONS.bad('Invalid JSON data'),
      ),
      TE.chain(
        flow(
          TE.fromPredicate(updatableMenuItemCodec.is, () => {
            return EXCEPTIONS.bad('Invalid item data');
          }),
        ),
      ),
      TE.chain(updatableItem => {
        return this._menuItemsService.updateOne({
          updatableItem,
          itemID,
          organizationID: loggedUser.organizationID,
          file,
        });
      }),
      executeTaskEither,
    );

    return await task();
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  public async getAllMine(@UserParam() loggedUser: LoggedUser): Promise<ReadonlyArray<MenuItem>> {
    const task = pipe(loggedUser.organizationID, this._menuItemsService.getAllForOrganization, executeTaskEither);

    return await task();
  }

  @Delete(':itemID')
  @UseGuards(AuthGuard)
  public async deleteOne(@Param('itemID') itemID: string, @UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(
      this._menuItemsService.deleteOne({
        itemID,
        loggedUser,
      }),
      executeTaskEither,
    );

    await task();
  }
}
