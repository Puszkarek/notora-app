/* eslint-disable functional/no-let */
import { Injectable, Logger, OnModuleInit, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable({
  scope: Scope.DEFAULT,
})
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly _maxRetries = 15;
  private readonly _retryInterval = 2000; // in milliseconds

  public async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= this._maxRetries; attempt++) {
      try {
        await this['$connect']();
        Logger.log('Prisma client connected');
        break;
      } catch (error) {
        if (attempt === this._maxRetries) {
          // eslint-disable-next-line functional/no-throw-statements
          throw error;
        }

        Logger.warn(
          `[${attempt}/${this._maxRetries - 1}] Prisma client connection failed. Retrying in ${
            this._retryInterval / 1000
          } seconds...`,
        );
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        await new Promise(resolve => {
          setTimeout(resolve, this._retryInterval);
        });
      }
    }
  }
}
