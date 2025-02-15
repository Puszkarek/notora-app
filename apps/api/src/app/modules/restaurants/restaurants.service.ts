import { Restaurant, UpdatableRestaurant, USER_ROLE } from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { RestaurantsRepository } from '@server/app/repositories/restaurants';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

@Injectable({
  scope: Scope.DEFAULT,
})
export class RestaurantsService {
  constructor(private readonly _restaurantsRepository: RestaurantsRepository) {}

  public updateMy = (
    updatableRestaurant: UpdatableRestaurant,
    loggedUser: LoggedUser,
  ): TE.TaskEither<Exception, Restaurant> => {
    return pipe(
      // * Check if the user is an ADMIN
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('User not allowed to update a restaurant'),
      ),
      // * Update the restaurant
      TE.chain(() => this._restaurantsRepository.updateMy(loggedUser.organizationID, updatableRestaurant)),
    );
  };

  public updateClosedStatus = ({
    restaurantID,
    isClosed,
    loggedUser,
  }: {
    readonly restaurantID: string;
    readonly isClosed: boolean;
    readonly loggedUser: LoggedUser;
  }): TE.TaskEither<Exception, Restaurant> => {
    return pipe(
      // * Only a ADMIN can update the restaurant status
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('User not allowed to update a restaurant status'),
      ),
      // * Update the restaurant
      TE.chain(() =>
        this._restaurantsRepository.updateClosedStatus(
          {
            restaurantID,
            organizationID: loggedUser.organizationID,
          },
          isClosed,
        ),
      ),
    );
  };

  public getAllForUser = (loggedUser: LoggedUser): TE.TaskEither<Exception, ReadonlyArray<Restaurant>> => {
    return pipe(this._restaurantsRepository.findAllForOrganization(loggedUser.organizationID));
  };
}
