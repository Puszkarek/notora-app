import { FastifyRequest } from 'fastify';

export type LoggedUser = {
  readonly id: string;
};

export type LoggedRequest = FastifyRequest & {
  readonly user: LoggedUser;
};
