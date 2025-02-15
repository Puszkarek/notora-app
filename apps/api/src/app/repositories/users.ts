import {
  AuthToken,
  CreatableUser,
  DeleteOneUserFilter,
  GetManyUsersFilter,
  GetOneUserFilter,
  ID,
  IsOrganizationOwnerFilter,
  SelfDeleteOneUserFilter,
  SelfUpdatableUser,
  UpdatableOrganization,
  UpdatableUser,
  UpdateOneUserFilter,
  User,
  USER_ROLE,
} from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  EXCEPTIONS,
  getCreateUserPrismaError,
  getUpdateMyUserPrismaError,
  getUpdateOneUserPrismaError,
} from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { PrismaService } from '@server/app/modules/prisma';
import { isNotNull, omitUndefined } from '@utils';
import { task as T, taskEither as TE, taskOption as TO } from 'fp-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { TaskOption } from 'fp-ts/lib/TaskOption';
import { uuidv7 } from 'uuidv7';

export type FindByToken = (token: AuthToken) => TaskOption<User>;

type PrismaUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly ownerID: string | null;
    readonly members: ReadonlyArray<{
      readonly id: string;
    }>;
    readonly subscription: {
      readonly digitalMenu: boolean;
      readonly supervision: boolean;
    } | null;
  };
  readonly role: UserRole;
};

export const toUserWithOrganization = ({ id, name, email, role, organization }: PrismaUser): User => ({
  id,
  name,
  email,
  role,
  organization: {
    id: organization.id,
    name: organization.name,
    isOwner: id === organization.ownerID,
    memberIDs: organization.members.map(({ id: memberID }) => memberID),
    subscription: organization.subscription ?? undefined,
  },
});

@Injectable()
export class UsersRepository {
  private readonly _selectParameters = {
    email: true,
    id: true,
    name: true,
    organization: {
      select: {
        id: true,
        members: {
          select: {
            id: true,
          },
        },
        name: true,
        ownerID: true,
        subscription: {
          select: {
            digitalMenu: true,
            supervision: true,
          },
        },
      },
    },
    role: true,
  };

  constructor(private readonly _prismaClient: PrismaService) {}

  public readonly many = ({
    organizationID,
    loggedUserID,
  }: GetManyUsersFilter): TaskEither<Exception, ReadonlyArray<User>> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.user.findMany({
            select: this._selectParameters,
            where: {
              // * The logged user must be a member of the organization to be able to fetch the users
              organization: {
                id: organizationID,
                members: {
                  some: {
                    id: loggedUserID,
                  },
                },
              },
            },
          });
        },
        () => EXCEPTIONS.bad('Error fetching users'),
      ),
      TE.map(users => users.map(toUserWithOrganization)),
    );
  };

  // * Find Users

  public readonly findByEmail = (email: string): TaskOption<User> => {
    return pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.user.findUnique({
          select: this._selectParameters,

          where: {
            email,
          },
        });
      }),
      TO.chain(flow(TO.fromNullable)),
      TO.map(toUserWithOrganization),
    );
  };

  public readonly findOne = ({ userID, organizationID }: GetOneUserFilter): TE.TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.user.findUnique({
          select: this._selectParameters,
          where: {
            id: userID,
            organizationID,
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
      TE.map(toUserWithOrganization),
    );
  };

  public readonly findByID = (id: string): TE.TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        const user = await this._prismaClient.user.findUnique({
          select: this._selectParameters,
          where: {
            id,
          },
        });

        return user;
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
      TE.map(toUserWithOrganization),
    );
  };

  public readonly findMinimalByID = (id: ID): TaskOption<LoggedUser> => {
    return pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.user.findUnique({
          select: {
            id: true,
            organizationID: true,
            role: true,
          },
          where: {
            id,
          },
        });
      }),
      TO.chain(flow(TO.fromNullable)),
    );
  };

  public readonly findMetadataByID = (id: ID): TE.TaskEither<Exception, { name: string; email: string }> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.user.findUniqueOrThrow({
            select: {
              email: true,
              name: true,
            },
            where: {
              id,
            },
          });
        },

        EXCEPTIONS.to.notFound,
      ),
    );
  };

  // * Crud User Actions

  public readonly deleteSelf = ({ userID, organizationID }: SelfDeleteOneUserFilter): TaskEither<Exception, void> => {
    return TE.tryCatch(async () => {
      await this._prismaClient.user.delete({
        where: {
          id: userID,
          organization: {
            id: organizationID,
          },
        },
      });
    }, EXCEPTIONS.to.bad);
  };

  public readonly delete = ({
    userID,
    loggedUserID,
    organizationID,
  }: DeleteOneUserFilter): TaskEither<Exception, void> => {
    return TE.tryCatch(async () => {
      await this._prismaClient.user.delete({
        where: {
          id: userID,
          organization: {
            id: organizationID,
            members: {
              some: {
                id: loggedUserID,
                role: USER_ROLE.admin,
              },
            },
          },
        },
      });
    }, EXCEPTIONS.to.bad);
  };

  public readonly create = (organizationID: string, user: CreatableUser): TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.user.create({
          select: this._selectParameters,
          data: {
            id: uuidv7(),
            organizationID,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }, getCreateUserPrismaError),
      TE.map(toUserWithOrganization),
    );
  };

  public readonly updateOne = (
    filters: UpdateOneUserFilter,
    updatableUser: UpdatableUser,
  ): TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.user.update({
          select: this._selectParameters,
          where: {
            id: filters.userID,
            organization: {
              id: filters.organizationID,
              members: {
                some: {
                  id: filters.loggedUserID,
                  role: USER_ROLE.admin,
                },
              },
            },
          },
          data: omitUndefined({
            name: updatableUser.name,
            role: updatableUser.role,
          }),
        });
      }, getUpdateOneUserPrismaError),
      TE.map(toUserWithOrganization),
    );
  };

  public readonly updateMe = (loggedUserID: ID, updatableUser: SelfUpdatableUser): TaskEither<Exception, User> => {
    return pipe(
      TE.Do,
      TE.chain(() =>
        TE.tryCatch(async () => {
          return await this._prismaClient.user.update({
            select: this._selectParameters,
            where: {
              id: loggedUserID,
            },
            data: omitUndefined({
              name: updatableUser.name,
            }),
          });
        }, getUpdateMyUserPrismaError),
      ),

      TE.map(toUserWithOrganization),
    );
  };

  public readonly updateMyOrganization = (
    filters: {
      readonly userID: ID;
      readonly organizationID: ID;
    },
    updatableOrganization: UpdatableOrganization,
  ): TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.organization.update({
          where: {
            id: filters.organizationID,
            ownerID: filters.userID,
          },
          data: omitUndefined({
            name: updatableOrganization.name,
          }),
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(() => pipe(this.findOne(filters))),
    );
  };

  // * Auth
  public readonly register = (email: string): TaskEither<Exception, User> => {
    return pipe(
      // * Generate an organization
      TE.tryCatch(
        async () =>
          await this._prismaClient.organization.create({
            select: {
              id: true,
            },
            data: {
              id: uuidv7(),
              name: '',
              restaurant: {
                create: {
                  id: uuidv7(),
                  name: '',
                  address: '',
                },
              },
            },
          }),
        EXCEPTIONS.to.bad,
      ),
      TE.bindTo('organization'),
      // * Create the user
      TE.bind('user', ({ organization }) =>
        TE.tryCatch(async () => {
          return await this._prismaClient.user.create({
            select: {
              id: true,
            },
            data: {
              id: uuidv7(),
              name: '',
              email: email,
              organizationID: organization.id,
              role: USER_ROLE.admin,
            },
          });
        }, EXCEPTIONS.to.bad),
      ),
      // * Set the user as organization owner
      TE.bind('organizationOwner', ({ organization, user }) =>
        pipe(
          TE.tryCatch(async () => {
            await this._prismaClient.organization.update({
              where: {
                id: organization.id,
              },
              data: {
                ownerID: user.id,
              },
            });
          }, EXCEPTIONS.to.bad),
        ),
      ),
      TE.chain(({ user }) => this.findByID(user.id)),
    );
  };

  // * User Helpers

  public readonly isOrganizationOwner = ({
    userID,
    organizationID,
  }: IsOrganizationOwnerFilter): TaskEither<Exception, boolean> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.organization.findUnique({
            select: {
              id: true,
            },
            where: {
              id: organizationID,
              ownerID: userID,
            },
          });
        },
        () => EXCEPTIONS.bad('Error trying to find organization owner'),
      ),
      TE.map(organization => isNotNull(organization)),
    );
  };
}
