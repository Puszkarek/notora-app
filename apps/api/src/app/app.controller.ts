import { Controller, Get } from '@nestjs/common';

import { WELCOME_MESSAGE } from './constants/common';

@Controller()
export class AppController {
  @Get()
  public sendMessage(): {
    readonly message: string;
  } {
    return { message: WELCOME_MESSAGE };
  }
}
