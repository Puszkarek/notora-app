import { UserRole } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export type LoggedUser = {
  readonly id: string;
  readonly organizationID: string;
  readonly role: UserRole;
};

export type LoggedRequest = FastifyRequest & {
  readonly user: LoggedUser;
};
