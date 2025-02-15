import { GoogleLoginResponse, LoginResponse } from '@api-interfaces';
import { Body, Controller, Get, HttpCode, HttpException, Post, Query } from '@nestjs/common';
import { executeTaskEither } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { generateToken } from '@server/app/helpers/token';
import { REQUEST_STATUS } from '@server/app/interfaces/error';
import { AuthService } from '@server/app/modules/auth/auth.service';
import { UsersRepository } from '@server/app/repositories/users';
import { environment } from '@server/environments/environment';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';

@Controller()
export class AuthController {
  constructor(
    private readonly _usersRepository: UsersRepository,
    private readonly _authService: AuthService,
  ) {}

  // * Login Stuffs
  @Post('login')
  @HttpCode(REQUEST_STATUS.ok)
  public async loginMe(): Promise<GoogleLoginResponse> {
    const task = pipe(this._authService.loginMe(), executeTaskEither);

    return await task();
  }

  @Post('test/login')
  @HttpCode(REQUEST_STATUS.ok)
  public async loginMeForTesting(@Query('email') email: string): Promise<LoginResponse> {
    if (environment.env !== 'dev') {
      // eslint-disable-next-line functional/no-throw-statements
      throw new HttpException('🧐', 404);
    }

    const task = pipe(
      TE.Do,
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            // * Register user if not it does not exist
            const userO = await this._usersRepository.findByEmail(email)();
            if (O.isNone(userO)) {
              // * Create the User
              const newUserE = await this._usersRepository.register(email)();

              if (E.isLeft(newUserE)) {
                // eslint-disable-next-line functional/no-throw-statements
                throw new Error(newUserE.left.message);
              }

              return newUserE.right;
            }

            return userO.value;
          },
          () => EXCEPTIONS.bad('Failed to create user'),
        ),
      ),
      TE.chain(loggedUser =>
        pipe(
          generateToken(loggedUser.id),
          TE.map(token => ({
            loggedUser,
            token,
          })),
        ),
      ),
      executeTaskEither,
    );

    return await task();
  }

  @Get('login/callback')
  public async loginCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('verifier') verifier: string,
  ): Promise<LoginResponse> {
    return await executeTaskEither(this._authService.loginCallback(code, state, verifier))();
  }
}
