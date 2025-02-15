import { creatableCheckoutSessionCodec } from '@api-interfaces';
import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { Request, Response } from 'express';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import { PaymentsService } from './payments.service';

const successPage = `
<html>
<head>
<style>
  body {
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background-color: #f0f0f0;
    color: #333;
  }
  p {
    text-align: center;
    padding-right: 10px;
  }
</style>
</head>
  <body>
    <p>Pagamento feito com sucesso!</p>
    </br>
    <p>Você será redirecionado em 5 segundos...</p>
    <script>
      setTimeout(function() {
        window.close();
      }, 5000);
    </script>
  </body>
</html>
`;

@Controller('payments')
export class PaymentsController {
  constructor(private readonly _paymentsService: PaymentsService) {}

  @Get('success')
  public async onSuccessCheckout(@Query('session_id') sessionID: string, @Res() response: Response): Promise<void> {
    const task = pipe(this._paymentsService.onSuccessCheckout(sessionID), executeTaskEither);

    await task();

    response.send(successPage);
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  public async createCheckoutSession(@UserParam() loggedUser: LoggedUser, @Body() body: unknown): Promise<unknown> {
    const task = pipe(
      // * Validate the body
      body,
      TE.fromPredicate(creatableCheckoutSessionCodec.is, () => EXCEPTIONS.bad('Invalid body')),
      TE.chain(creatableCheckoutSession =>
        this._paymentsService.createCheckoutSession(loggedUser, creatableCheckoutSession),
      ),
      executeTaskEither,
    );

    return await task();
  }

  @Post('cancel')
  @UseGuards(AuthGuard)
  public async cancelSubscription(@UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(this._paymentsService.cancelSubscription(loggedUser), executeTaskEither);

    await task();
  }

  @Get('subscription')
  @UseGuards(AuthGuard)
  public async getMySubscription(@UserParam() loggedUser: LoggedUser): Promise<unknown> {
    const task = pipe(this._paymentsService.getSubscription(loggedUser), executeTaskEither);

    return await task();
  }

  @Post('webhook')
  public async handleStripeWebhook(@Req() request: Request): Promise<void> {
    const event = await pipe(this._paymentsService.verifyStripeSignature(request), executeTaskEither)();

    switch (event.type) {
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await this._paymentsService.deleteSubscription(subscription.id)();
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await this._paymentsService.updateSubscription(subscription)();
        break;
      }
      // Handle other event types as needed
    }
  }
}
