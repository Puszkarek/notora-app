import { Restaurant, updatableRestaurantCodec } from '@api-interfaces';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';

import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly _restaurantsService: RestaurantsService) {}

  // * Update
  @Put('mine')
  @UseGuards(AuthGuard)
  public async updateMy(@Body() data: unknown, @UserParam() loggedUser: LoggedUser): Promise<unknown> {
    const task = pipe(
      data,
      TE.fromPredicate(updatableRestaurantCodec.is, () => EXCEPTIONS.bad('Invalid restaurant data')),
      TE.chain(updatableRestaurant => {
        return this._restaurantsService.updateMy(updatableRestaurant, loggedUser);
      }),
      executeTaskEither,
    );

    return await task();
  }

  @Put('mine/status')
  @UseGuards(AuthGuard)
  public async updateClosedStatus(
    @Param('id') id: string,
    @Body('isClosed') data: unknown,
    @UserParam() loggedUser: LoggedUser,
  ): Promise<unknown> {
    const task = pipe(
      data,
      TE.fromPredicate(t.boolean.is, () => EXCEPTIONS.bad('Invalid restaurant status')),
      TE.chain(isClosed => {
        return this._restaurantsService.updateClosedStatus({
          restaurantID: id,
          isClosed,
          loggedUser,
        });
      }),
      executeTaskEither,
    );

    return await task();
  }

  // * Get

  @Get('mine')
  @UseGuards(AuthGuard)
  public async getAllForUser(@UserParam() loggedUser: LoggedUser): Promise<ReadonlyArray<Restaurant>> {
    const task = pipe(loggedUser, this._restaurantsService.getAllForUser, executeTaskEither);

    return await task();
  }
}
