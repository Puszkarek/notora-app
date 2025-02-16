import { AuthToken, CreatableUser, GetOneUserFilter, ID, User } from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { EXCEPTIONS, getCreateUserPrismaError } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { PrismaService } from '@server/app/modules/prisma';
import { taskEither as TE, taskOption as TO } from 'fp-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { TaskOption } from 'fp-ts/lib/TaskOption';
import { uuidv7 } from 'uuidv7';

export type FindByToken = (token: AuthToken) => TaskOption<User>;

@Injectable()
export class UsersRepository {
  private readonly _selectParameters = {
    email: true,
    id: true,
    name: true,
  };

  constructor(private readonly _prismaClient: PrismaService) {}

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
    );
  };

  public readonly findOne = ({ userID }: GetOneUserFilter): TE.TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.user.findUnique({
          select: this._selectParameters,
          where: {
            id: userID,
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
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
    );
  };

  public readonly findMinimalByID = (id: ID): TaskOption<LoggedUser> => {
    return pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.user.findUnique({
          select: {
            id: true,
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

  public readonly create = (user: CreatableUser): TaskEither<Exception, User> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.user.create({
          select: this._selectParameters,
          data: {
            id: uuidv7(),
            name: user.name,
            email: user.email,
          },
        });
      }, getCreateUserPrismaError),
    );
  };

  // * Auth
  public readonly register = (email: string): TaskEither<Exception, User> => {
    return pipe(
      // * Create the user
      TE.tryCatch(async () => {
        return await this._prismaClient.user.create({
          select: this._selectParameters,
          data: {
            id: uuidv7(),
            name: '',
            email: email,
          },
        });
      }, EXCEPTIONS.to.bad),
    );
  };
}
