import {
  creatableUserCodec,
  selfUpdatableUserCodec,
  updatableOrganizationCodec,
  updatableUserCodec,
  User,
} from '@api-interfaces';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, executeTaskEitherWithMessage, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { REQUEST_STATUS } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  // * Crud Operations
  @Post()
  @UseGuards(AuthGuard)
  public async createOne(@UserParam() loggedUser: LoggedUser, @Body() body: unknown): Promise<User> {
    const task = pipe(
      body,
      TE.fromPredicate(creatableUserCodec.is, () => EXCEPTIONS.bad('Invalid Body')),
      TE.chain(creatableUser => this._usersService.createOne(loggedUser, creatableUser)),
      executeTaskEither,
    );

    return await task();
  }

  @Put('me')
  @UseGuards(AuthGuard)
  public async updateMe(@UserParam() loggedUser: LoggedUser, @Body() body: unknown): Promise<User> {
    const task = pipe(
      body,
      TE.fromPredicate(selfUpdatableUserCodec.is, () => EXCEPTIONS.bad('Invalid Body')),
      TE.chain(updatableUser =>
        this._usersService.updateMe(loggedUser, {
          ...updatableUser,
        }),
      ),
      executeTaskEither,
    );
    return await task();
  }

  @Put('organization/mine')
  @UseGuards(AuthGuard)
  public async updateMyOrganization(@UserParam() loggedUser: LoggedUser, @Body() body: unknown): Promise<User> {
    const task = pipe(
      body,
      TE.fromPredicate(updatableOrganizationCodec.is, () => EXCEPTIONS.bad('Invalid Body')),
      TE.chain(updatableData => this._usersService.updateMyOrganization(loggedUser, updatableData)),
      executeTaskEitherWithMessage(`Organization updated`, `Error updating organization`),
    );
    return await task();
  }

  @Put(':userID')
  @UseGuards(AuthGuard)
  public async updateOne(
    @Param('userID') userID: string,
    @UserParam() loggedUser: LoggedUser,
    @Body() body: unknown,
  ): Promise<User> {
    const task = pipe(
      body,
      TE.fromPredicate(updatableUserCodec.is, () => EXCEPTIONS.bad('Invalid Body')),
      TE.chain(updatableUser =>
        this._usersService.updateOne(loggedUser, {
          ...updatableUser,
          id: userID,
        }),
      ),
      executeTaskEither,
    );
    return await task();
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  public async deleteMe(@UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(
      TE.Do,
      // * Parse the raw token
      TE.chain(() => this._usersService.deleteMe(loggedUser)),
      executeTaskEither,
    );

    // * Execute the task
    await task();
  }

  @Delete('organization/mine')
  @UseGuards(AuthGuard)
  public async deleteMyOrganization(@UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(
      TE.Do,
      // * Parse the raw token
      TE.chain(() => this._usersService.deleteMyOrganization(loggedUser)),
      executeTaskEither,
    );

    // * Execute the task
    await task();
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  public async deleteOne(@Param('id') id: string, @UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(
      // * Parse the raw token
      this._usersService.deleteOne({
        idToDelete: id,
        loggedUser: loggedUser,
      }),
      executeTaskEitherWithMessage(`User ${id} deleted`, `Error deleting user ${id}`),
    );

    // * Execute the task
    await task();
  }

  // * Getters
  @Get('me')
  @HttpCode(REQUEST_STATUS.accepted)
  @UseGuards(AuthGuard)
  public async getLoggedUser(@UserParam() loggedUser: LoggedUser): Promise<User> {
    const task = pipe(
      this._usersService.getOne({
        organizationID: loggedUser.organizationID,
        userID: loggedUser.id,
      }),
      executeTaskEither,
    );

    return await task();
  }

  @Get(':id') // ? dynamic paths (:id) should be the in the end to not override another path
  @UseGuards(AuthGuard)
  public async getOne(@Param('id') id: string, @UserParam() loggedUser: LoggedUser): Promise<User> {
    const task = pipe(
      this._usersService.getOne({
        organizationID: loggedUser.organizationID,
        userID: id,
      }),
      executeTaskEither,
    );

    return await task();
  }

  @Get()
  @UseGuards(AuthGuard)
  public async getAll(@UserParam() loggedUser: LoggedUser): Promise<ReadonlyArray<User>> {
    const task = pipe(
      this._usersService.getMany({
        organizationID: loggedUser.organizationID,
        loggedUserID: loggedUser.id,
      }),
      executeTaskEither,
    );
    return await task();
  }
}
