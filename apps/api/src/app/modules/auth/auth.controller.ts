import { LoginResponse } from '@api-interfaces';
import { Controller, Get, Query } from '@nestjs/common';
import { executeTaskEither } from '@server/app/helpers/controller';
import { AuthService } from '@server/app/modules/auth/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  // * Login Stuffs

  @Get('login/callback')
  public async loginCallback(@Query('code') code: string): Promise<LoginResponse> {
    const task = executeTaskEither(this._authService.loginCallback(code));

    return await task();
  }
}
