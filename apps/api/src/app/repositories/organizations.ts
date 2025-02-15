import {
  DeleteOneOrganizationFilter,
  ID,
  Organization,
  SubscriptionDetails,
  UpdatableOrganization,
  UpdateOneOrganizationFilter,
} from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { PrismaService } from '@server/app/modules/prisma';
import { omitUndefined } from '@utils';
import { taskEither as TE, taskOption as TO } from 'fp-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { TaskOption } from 'fp-ts/lib/TaskOption';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class OrganizationsRepository {
  private readonly _selectParameters = {
    id: true,
    name: true,
    ownerID: true,
    restaurant: {
      select: {
        id: true,
      },
    },
    members: {
      select: {
        id: true,
      },
    },
    subscription: {
      select: {
        digitalMenu: true,
        supervision: true,
      },
    },
  };

  constructor(private readonly _prismaClient: PrismaService) {}

  /**
   * Try to find an {@link Organization} with the given {@link ID}
   *
   * @param id - The ID to fetch
   * @returns An {@link Option} containing the found `Organization` or nothing
   */
  public readonly findByID = (id: ID): TaskOption<Organization> =>
    pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.organization.findUnique({
          select: this._selectParameters,
          where: {
            id,
          },
        });
      }),
      TO.chain(flow(TO.fromNullable)),
      // * Check the ownerID is not undefined
      TO.filter((raw): raw is typeof raw & { ownerID: string } => {
        return raw.ownerID !== null;
      }),
      TO.map(raw => ({
        id: raw.id,
        name: raw.name,
        ownerID: raw.ownerID,
        subscription: raw.subscription ?? undefined,
        restaurantID: raw.restaurant?.id ?? null,
        memberIDs: raw.members.map(member => member.id),
      })),
    );

  public readonly findMinimalByID = (
    id: ID,
  ): TaskOption<{
    ownerID: string;
    subscription: {
      id: string;
    } | null;
  }> =>
    pipe(
      TO.tryCatch(async () => {
        return await this._prismaClient.organization.findUnique({
          select: {
            ownerID: true,
            subscription: {
              select: {
                id: true,
              },
            },
          },
          where: {
            id,
          },
        });
      }),
      TO.chain(flow(TO.fromNullable)),
      // * Check the ownerID is not undefined
      TO.filter((raw): raw is typeof raw & { ownerID: string } => {
        return raw.ownerID !== null;
      }),
    );

  public readonly findSubscriptionByOrganizationID = (
    organizationID: ID,
  ): TE.TaskEither<Exception, SubscriptionDetails> =>
    pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.organization.findUnique({
          select: {
            subscription: {
              select: {
                id: true,
                externalID: true,
                cancelAt: true,
                createdAt: true,
                interval: true,
                digitalMenu: true,
                supervision: true,
                price: true,
              },
            },
          },
          where: {
            id: organizationID,
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.map(organization => organization?.subscription),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('Organization not found')))),
    );

  public readonly findSubscriptionCancelDetailsByID = (id: ID): TE.TaskEither<Exception, Date | null> =>
    pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.subscription.findUniqueOrThrow({
          select: {
            cancelAt: true,
          },
          where: {
            id,
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.map(subscription => subscription.cancelAt),
    );

  public readonly hasSubscriptionActive = (organizationID: ID): TE.TaskEither<Exception, boolean> =>
    pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.organization.findUnique({
          select: {
            subscription: {
              select: {
                id: true,
                cancelAt: true,
                createdAt: true,
                interval: true,
                digitalMenu: true,
                supervision: true,
                price: true,
              },
            },
          },
          where: {
            id: organizationID,
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.map(organization => {
        if (organization) {
          return organization.subscription !== null;
        }
        return false;
      }),
    );

  // * Crud Organization Actions

  public readonly update = (
    { organizationID, ownerID }: UpdateOneOrganizationFilter,
    updatedOrganization: UpdatableOrganization,
  ): TaskEither<Exception, Organization> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.organization.update({
            select: this._selectParameters,
            where: {
              id: organizationID,
              ownerID: ownerID,
            },
            data: omitUndefined({
              name: updatedOrganization.name,
            }),
          });
        },
        () => EXCEPTIONS.bad('Error deleting organization'),
      ),
      TE.map(raw => ({
        id: raw.id,
        name: raw.name,
        ownerID: raw.ownerID ?? '', // ? We're searching by ownerID, so it'll never be undefined
        subscription: raw.subscription ?? undefined,
        restaurantID: raw.restaurant?.id ?? null,
        memberIDs: raw.members.map(member => member.id),
      })),
    );
  };

  public readonly createSubscription = (
    organizationID: string,
    subscription: Omit<SubscriptionDetails, 'id'>,
  ): TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(async () => {
        await this._prismaClient.organization.update({
          select: {
            subscription: {
              select: {
                id: true,
              },
            },
          },
          where: {
            id: organizationID,
          },
          data: {
            subscription: {
              create: {
                ...subscription,
                id: uuidv7(),
              },
            },
          },
        });
      }, EXCEPTIONS.to.bad),
    );
  };

  public readonly updateSubscription = (
    organizationID: string,
    subscription: SubscriptionDetails,
  ): TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(async () => {
        await this._prismaClient.subscription.update({
          select: {
            id: true,
          },
          where: {
            id: subscription.id,
            organizationID: organizationID,
          },
          data: subscription,
        });
      }, EXCEPTIONS.to.bad),
    );
  };

  public readonly updateSubscriptionByExternalID = ({
    externalID,
    ...subscription
  }: Omit<SubscriptionDetails, 'id' | 'createdAt'>): TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(async () => {
        await this._prismaClient.subscription.update({
          select: {
            id: true,
          },
          where: {
            externalID,
          },
          data: subscription,
        });
      }, EXCEPTIONS.to.bad),
    );
  };

  /**
   * Deletes an existing {@link Organization} in the repository
   *
   * @param organization - The organization to delete
   * @returns On success it'll be void, otherwise the error that happened
   */
  public readonly delete = ({ organizationID, userID }: DeleteOneOrganizationFilter): TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.organization.delete({
            where: {
              id: organizationID,
              ownerID: userID,
            },
          });
        },
        () => EXCEPTIONS.bad('Error deleting organization'),
      ),
      TE.map(() => undefined),
    );
  };

  public readonly deleteSubscriptionByExternalID = (subscriptionID: string): TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(
        async () => {
          return await this._prismaClient.subscription.delete({
            where: {
              externalID: subscriptionID,
            },
          });
        },
        () => EXCEPTIONS.bad('Error deleting subscription'),
      ),
      TE.map(() => void 0),
    );
  };
}
