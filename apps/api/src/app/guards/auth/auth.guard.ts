import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { executeTaskEither } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { getUserDataFromToken } from '@server/app/helpers/token';
import { UsersService } from '@server/app/modules/users/users.service';
import { FastifyRequest } from 'fastify';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly _usersService: UsersService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const token = this._extractTokenFromHeader(request);

    if (!token) {
      // eslint-disable-next-line functional/no-throw-statements
      throw EXCEPTIONS.unauthorized('No token provided');
    }

    const task = pipe(
      token,
      getUserDataFromToken,
      TE.chain(({ userID }) => this._usersService.getMinimalUser(userID)),
      executeTaskEither,
    );

    /** Will throw a `HttpException` if invalid */
    const user = await task();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line functional/immutable-data
    request['user'] = user;

    return true;
  }

  private _extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
