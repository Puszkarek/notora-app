import { Module } from '@nestjs/common';
import { MAIL_PROVIDER_TOKEN } from '@server/app/constants/user';

@Module({
  controllers: [],
  imports: [],
  providers: [],
  exports: [MAIL_PROVIDER_TOKEN],
})
export class MailModule {}
