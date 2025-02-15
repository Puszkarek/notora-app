/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { raw } from 'express';

import { AppModule } from './app/app.module';

const bootstrap = async (): Promise<void> => {
  // TODO: install fastify and use it instead of express
  const app = await NestFactory.create(AppModule);

  app.use('/payments/webhook', raw({ type: 'application/json' }));

  app.enableCors({
    origin: '*', // TODO: Change this to the actual origin
  });
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
};

bootstrap();
