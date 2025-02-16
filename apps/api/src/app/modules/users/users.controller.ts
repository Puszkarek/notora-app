import { ApiResponse, User } from '@api-interfaces';
import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { REQUEST_STATUS } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { pipe } from 'fp-ts/lib/function';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  // * Getters
  @Get('me')
  @HttpCode(REQUEST_STATUS.accepted)
  @UseGuards(AuthGuard)
  public async getLoggedUser(@UserParam() loggedUser: LoggedUser): Promise<ApiResponse<User>> {
    const task = pipe(
      this._usersService.getOne({
        userID: loggedUser.id,
      }),
      executeTaskEither,
    );

    const user = await task();

    return {
      data: user,
    };
  }
}
