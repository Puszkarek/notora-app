/* eslint-disable @typescript-eslint/member-ordering */
import {
  AuthToken,
  CreatableUser,
  GetManyUsersFilter,
  GetOneUserFilter,
  ID,
  SelfUpdatableUser,
  UpdatableOrganization,
  UpdatableUser,
  User,
  USER_ROLE,
} from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { parseToken } from '@server/app/helpers/token';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { OrganizationsRepository } from '@server/app/repositories/organizations';
import { UsersRepository } from '@server/app/repositories/users';
import { pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';
import { TaskOption } from 'fp-ts/lib/TaskOption';
import * as TO from 'fp-ts/TaskOption';
import * as t from 'io-ts';

import { makeGetMe, makeRefreshToken, makeValidateToken } from './operations';

@Injectable({
  scope: Scope.DEFAULT,
})
export class UsersService {
  /**
   * Parse the given token and try to find an {@link User} with that
   *
   * @param token - The token that belongs to the user
   * @returns An {@link Option} containing the found `User` or nothing
   */
  private readonly _findByToken = (token: AuthToken): TaskOption<User> => {
    return pipe(
      // * Parse the token
      token,
      parseToken,
      TO.fromTaskEither,
      // * Extract the `userID` from payload
      TO.chain(({ payload: { userID } }) => TO.fromNullable(t.string.is(userID) ? userID : null)), // TODO: improve validation
      // * Try to find the user
      TO.chain(id => pipe(this._usersRepository.findByID(id), TO.fromTaskEither)),
    );
  };

  public readonly get = {
    me: makeGetMe(this._findByToken),
  };

  public readonly token = {
    refresh: makeRefreshToken(this._findByToken),
    validate: makeValidateToken(),
  };

  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _organizationsRepository: OrganizationsRepository,
  ) {}

  /**
   * Create a new {@link User} and save on the repository, then send an message to his email
   * address
   *
   * @param data - The data for the {@link User} we wanna create
   * @returns On success it'll be the created {@link User}, otherwise the error that happened
   */
  public createOne = (loggedUser: LoggedUser, creatableUser: CreatableUser): TaskEither<Exception, User> => {
    return pipe(
      // * ONLY admins can create new users
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('Only admins can create new users'),
      ),
      // * If the user is trying to create a admin, he should be the owner of the organization
      TE.chain(() => {
        if (creatableUser.role !== USER_ROLE.admin) {
          return TE.right(void 0);
        }

        return pipe(
          this._usersRepository.isOrganizationOwner({
            userID: loggedUser.id,
            organizationID: loggedUser.organizationID,
          }),
          TE.filterOrElse(
            isOrganizationOwner => isOrganizationOwner,
            () => EXCEPTIONS.forbidden('Only the owner of the organization can create new admins'),
          ),
        );
      }),
      // * Save the new `User` on the repository
      TE.chain(() => this._usersRepository.create(loggedUser.organizationID, creatableUser)),
    );
  };

  /**
   * Update an existing {@link User} and save on the repository
   *
   * @param data - The data from the {@link User} that we wanna update
   * @returns On success it'll be the updated {@link User}, otherwise the error that happened
   */
  public updateOne = (
    loggedUser: LoggedUser,
    updatableUser: UpdatableUser & { readonly id: string },
  ): TaskEither<Exception, User> => {
    const filter = { userID: loggedUser.id, organizationID: loggedUser.organizationID };

    console.log('[FILTER]', filter);
    return pipe(
      // * ONLY admins can create new users
      loggedUser,
      TE.fromPredicate(
        user => user.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('You are not an admin'),
      ),
      // * We can't use this method to self update
      TE.filterOrElse(
        user => user.id !== updatableUser.id,
        () => EXCEPTIONS.bad("You can't update yourself here, go to /me"),
      ),
      // * Get the current user
      TE.bind('user', () => this._usersRepository.findByID(updatableUser.id)),
      // * The user should belongs to the same organization
      TE.filterOrElse(
        ({ user }) => user.organization.id === loggedUser.organizationID,
        () => EXCEPTIONS.forbidden("You can't update a user from another organization"),
      ),
      TE.bind('canPromote', () => {
        // * If the user is not promoting, we can skip this check (we already check if the user is an admin before)
        if (updatableUser.role === undefined) {
          return TE.right(void 0);
        }
        return pipe(
          this._usersRepository.isOrganizationOwner(filter),
          // * An ADMIN can NOT promote a user to a role above him (but this can be bypassed if the user is the owner of the organization)
          TE.filterOrElse(
            isOrganizationOwner => {
              if (isOrganizationOwner) {
                return true;
              }

              return updatableUser.role === USER_ROLE.cook || updatableUser.role === USER_ROLE.waiter;
            },
            () => EXCEPTIONS.forbidden("You can't promote a user to a role above yours"),
          ),
        );
      }),
      TE.chain(() =>
        this._usersRepository.updateOne(
          {
            userID: updatableUser.id,
            loggedUserID: loggedUser.id,
            organizationID: loggedUser.organizationID,
          },
          updatableUser,
        ),
      ),
    );
  };

  /**
   * Update an existing {@link User} and save on the repository
   *
   * @param data - The data from the {@link User} that we wanna update
   * @returns On success it'll be the updated {@link User}, otherwise the error that happened
   */
  public updateMe = (loggedUser: LoggedUser, updatableUser: SelfUpdatableUser): TaskEither<Exception, User> => {
    return pipe(
      TE.Do,
      TE.chain(() => this._usersRepository.updateMe(loggedUser.id, updatableUser)),
    );
  };

  /**
   * Update an existing {@link User} and save on the repository
   *
   * @param data - The data from the {@link User} that we wanna update
   * @returns On success it'll be the updated {@link User}, otherwise the error that happened
   */
  public updateMyOrganization = (
    loggedUser: LoggedUser,
    updatableData: UpdatableOrganization,
  ): TaskEither<Exception, User> => {
    const filter = { userID: loggedUser.id, organizationID: loggedUser.organizationID };
    return pipe(
      TE.Do,
      TE.chain(() => this._usersRepository.isOrganizationOwner(filter)),
      TE.filterOrElse(
        isOrganizationOwner => isOrganizationOwner,
        () => EXCEPTIONS.forbidden('You are not the owner of this organization'),
      ),
      TE.chain(() => this._usersRepository.updateMyOrganization(filter, updatableData)),
    );
  };

  /**
   * Delete one {@link User} from the repository
   *
   * @param id - The {@link User} to delete
   * @returns On success it'll be void, otherwise the error that happened
   */
  public deleteOne = ({
    idToDelete,
    loggedUser,
  }: {
    readonly idToDelete: ID;
    readonly loggedUser: LoggedUser;
  }): TaskEither<Exception, void> => {
    const filter = { userID: loggedUser.id, organizationID: loggedUser.organizationID };

    return pipe(
      TE.Do,
      // * Check if the user don't wanna delete himself
      TE.filterOrElse(
        () => loggedUser.id !== idToDelete,
        () => EXCEPTIONS.bad("You can't delete yourself"),
      ),
      // * ONLY admins can delete users
      TE.filterOrElse(
        () => loggedUser.role === USER_ROLE.admin,
        () => EXCEPTIONS.forbidden('You are not an admin'),
      ),
      // * Get the current user
      TE.bind('user', () => this._usersRepository.findByID(idToDelete)),
      // * The user should belongs to the same organization
      TE.filterOrElse(
        ({ user }) => user.organization.id === loggedUser.organizationID,
        () => EXCEPTIONS.forbidden("You can't delete an user from another organization"),
      ),
      TE.bind('canPromote', ({ user }) =>
        pipe(
          this._usersRepository.isOrganizationOwner(filter),
          // * An ADMIN can NOT promote a user to a role above him (but this can be bypassed if the user is the owner of the organization)
          TE.filterOrElse(
            isOrganizationOwner => {
              if (isOrganizationOwner) {
                return true;
              }

              return user.role === USER_ROLE.cook || user.role === USER_ROLE.waiter;
            },
            () => EXCEPTIONS.forbidden("You can't promote a user to a role above yours"),
          ),
        ),
      ),
      // * Delete the user
      TE.chain(() =>
        this._usersRepository.delete({
          organizationID: loggedUser.organizationID,
          loggedUserID: loggedUser.id,
          userID: idToDelete,
        }),
      ),
    );
  };

  public deleteMe = (loggedUser: LoggedUser): TaskEither<Exception, void> => {
    const filter = { userID: loggedUser.id, organizationID: loggedUser.organizationID };

    return pipe(
      TE.Do,
      // * The user should NOT be owner of the organization
      TE.chain(() => this._usersRepository.isOrganizationOwner(filter)),
      TE.filterOrElse(
        isOrganizationOwner => !isOrganizationOwner,
        () => EXCEPTIONS.bad("You can't delete yourself because you are the owner of the organization"),
      ),
      // * Delete the user
      TE.chain(() => this._usersRepository.deleteSelf(filter)),
    );
  };

  public deleteMyOrganization = (loggedUser: LoggedUser): TaskEither<Exception, void> => {
    const filter = { userID: loggedUser.id, organizationID: loggedUser.organizationID };

    return pipe(
      TE.Do,
      // * The user should be the owner of the organization
      TE.chain(() => this._usersRepository.isOrganizationOwner(filter)),
      TE.filterOrElse(
        isOrganizationOwner => isOrganizationOwner,
        () => EXCEPTIONS.forbidden('You are not the owner of this organization'),
      ),
      // * The Organization should not have any subscription
      TE.chain(() => pipe(this._organizationsRepository.hasSubscriptionActive(loggedUser.organizationID))),
      TE.filterOrElse(
        hasSubscriptionActive => !hasSubscriptionActive,
        () => EXCEPTIONS.bad('You can not delete an organization with an active subscription'),
      ),
      // * Delete the organization, and in cascade, all related data
      TE.chain(() => this._organizationsRepository.delete(filter)),
    );
  };

  public getMany = (filters: GetManyUsersFilter): TaskEither<Exception, ReadonlyArray<User>> => {
    return this._usersRepository.many(filters);
  };

  public getOne = (filters: GetOneUserFilter): TaskEither<Exception, User> => {
    return pipe(filters, this._usersRepository.findOne);
  };

  public getMinimalUser = (userID: string): TaskEither<Exception, LoggedUser> =>
    pipe(
      userID,
      this._usersRepository.findMinimalByID,
      TE.fromTaskOption(() => EXCEPTIONS.notFound(`Not able to find the user with the given ID: ${userID}`)),
    );
}
