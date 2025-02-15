import {
  Bill,
  creatableBillCodec,
  creatableConfirmedBillCodec,
  creatableInstantBillCodec,
  getManyBillsFilterCodec,
} from '@api-interfaces';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { flow, pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';

import { BillsService } from './bills.service';

const activeTableFilterCodec = t.type({
  restaurantID: t.string,
  tableID: t.string,
});

const addManyConfirmedOrderItemBodyCodec = t.type({
  menuItemIDs: t.array(t.string),
  customerName: t.string,
});

const manyOrderItemIDsCodec = t.array(t.string);

@Controller()
export class BillsController {
  constructor(private readonly _billsService: BillsService) {}

  // * Public Endpoints
  @Patch('bills/:billID/items')
  public async addManyPendingOrderItems(
    @Query('restaurantID') restaurantID: string,
    @Param('billID') billID: string,
    @Query('customerName') customerName: string,
    @Body() menuItemIDs: unknown,
  ): Promise<Bill> {
    const task = pipe(
      menuItemIDs,
      TE.fromPredicate(t.array(t.string).is, () => EXCEPTIONS.bad('Invalid data')),
      TE.chain(itemIDs =>
        this._billsService.addManyPendingOrderItems({
          billID,
          restaurantID,
          customerName,
          itemIDs,
        }),
      ),
      executeTaskEither,
    );

    return await task();
  }

  @Post('bills')
  public async openPendingOne(
    @Query('restaurantID') restaurantID: string,
    @Query('tableID') tableID: string,
    @Body() body: unknown,
  ): Promise<Bill> {
    const task = pipe(
      {
        restaurantID,
        tableID: tableID,
        orders: body,
      },
      TE.fromPredicate(creatableBillCodec.is, () => EXCEPTIONS.bad('Invalid data')),
      TE.chain(this._billsService.openPendingOne),
      executeTaskEither,
    );

    return await task();
  }

  @Get('bills/active')
  public async getActiveForTable(
    @Query('restaurantID') restaurantID: string,
    @Query('tableID') tableID: string,
  ): Promise<Bill | null> {
    const task = pipe(
      {
        restaurantID,
        tableID,
      },
      TE.fromPredicate(activeTableFilterCodec.is, () => EXCEPTIONS.bad('Invalid data')),
      TE.chain(this._billsService.getActiveForTable),
      TE.map(flow(O.toNullable)),
      executeTaskEither,
    );

    return await task();
  }

  // * Private Endpoints

  @Post('bills/:billID/items')
  @UseGuards(AuthGuard)
  public async addManyConfirmedOrderItem(
    @Param('billID') billID: string,
    @Body() body: unknown,
    @UserParam() loggedUser: LoggedUser,
  ): Promise<Bill> {
    const task = pipe(
      body,
      TE.fromPredicate(addManyConfirmedOrderItemBodyCodec.is, () => EXCEPTIONS.bad('Invalid body')),
      TE.chain(data =>
        this._billsService.addManyConfirmedOrderItems({
          billID,
          customerName: data.customerName,
          itemIDs: data.menuItemIDs,
          loggedUser,
        }),
      ),
      executeTaskEither,
    );

    return await task();
  }

  // * Bills
  @Post('bills/new')
  @UseGuards(AuthGuard)
  public async openConfirmedOne(
    @Body() body: { tableID: unknown },

    @UserParam() loggedUser: LoggedUser,
  ): Promise<Bill> {
    const task = pipe(
      {
        tableID: body.tableID,
      },
      TE.fromPredicate(creatableConfirmedBillCodec.is, () => EXCEPTIONS.bad('Invalid data')),
      TE.chain(data => this._billsService.openConfirmedOne(data, loggedUser)),
      executeTaskEither,
    );

    return await task();
  }

  /**
   * Opens a instantly closed bill, without a table linked, and with all the items (useful for counter)
   */
  @Post('bills/instant')
  @UseGuards(AuthGuard)
  public async openInstaOne(
    @Body() body: unknown,

    @UserParam() loggedUser: LoggedUser,
  ): Promise<Bill> {
    const task = pipe(
      body,
      TE.fromPredicate(creatableInstantBillCodec.is, () => EXCEPTIONS.bad('Invalid data')),
      TE.chain(data => this._billsService.openInstaOne(data, loggedUser)),
      executeTaskEither,
    );

    return await task();
  }

  @Patch('bills/:billID/confirm')
  @UseGuards(AuthGuard)
  public async confirmOne(@UserParam() loggedUser: LoggedUser, @Param('billID') billID: string): Promise<Bill> {
    const task = pipe(this._billsService.confirmOne(billID, loggedUser), executeTaskEither);

    return await task();
  }

  @Patch('bills/:billID/close')
  @UseGuards(AuthGuard)
  public async closeOne(
    @UserParam() loggedUser: LoggedUser,
    @Param('restaurantID') restaurantID: string,
    @Param('billID') billID: string,
  ): Promise<Bill> {
    const task = pipe(this._billsService.closeOne(billID, loggedUser), executeTaskEither);

    return await task();
  }

  @Patch('bills/:billID/decline')
  @UseGuards(AuthGuard)
  public async declineOne(@UserParam() loggedUser: LoggedUser, @Param('billID') billID: string): Promise<Bill> {
    const task = pipe(this._billsService.declineOne(billID, loggedUser), executeTaskEither);

    return await task();
  }

  @Get('bills')
  @UseGuards(AuthGuard)
  public async getManyByRange(
    @UserParam() loggedUser: LoggedUser,
    @Query('statusList') statusList: unknown,
    @Query('startDate') startDate: unknown,
    @Query('endDate') endDate: unknown,
  ): Promise<ReadonlyArray<Bill>> {
    const task = pipe(
      {
        organizationID: loggedUser.organizationID,
        startDate,
        endDate,
        statusList,
      },
      TE.fromPredicate(getManyBillsFilterCodec.is, () => EXCEPTIONS.bad('Invalid data')),
      TE.chain(filters => this._billsService.getManyByRange(filters)),
      executeTaskEither,
    );

    return await task();
  }

  // * Orders
  @Patch('bills/:billID/confirm/items')
  @UseGuards(AuthGuard)
  public async confirmManyPendingOrderItems(
    @UserParam() loggedUser: LoggedUser,
    @Param('billID') billID: string,
    @Body() body: unknown,
  ): Promise<Bill> {
    const task = pipe(
      body,
      TE.fromPredicate(manyOrderItemIDsCodec.is, () => EXCEPTIONS.bad('Invalid body')),
      TE.chain(orderItemIDs =>
        this._billsService.confirmManyPendingOrderItems({
          billID,
          organizationID: loggedUser.organizationID,
          orderItemIDs,
        }),
      ),
      executeTaskEither,
    );

    return await task();
  }

  @Patch('bills/:billID/decline/items')
  @UseGuards(AuthGuard)
  public async declineManyPendingOrderItems(
    @UserParam() loggedUser: LoggedUser,
    @Param('billID') billID: string,
    @Body() body: unknown,
  ): Promise<Bill> {
    const task = pipe(
      body,
      TE.fromPredicate(manyOrderItemIDsCodec.is, () => EXCEPTIONS.bad('Invalid body')),
      TE.chain(orderItemIDs =>
        this._billsService.declineManyPendingOrderItems({
          billID,
          organizationID: loggedUser.organizationID,
          orderItemIDs,
        }),
      ),
      executeTaskEither,
    );

    return await task();
  }

  @Patch('bills/:billID/remove/items')
  @UseGuards(AuthGuard)
  public async removeManyOrderItems(
    @UserParam() loggedUser: LoggedUser,
    @Param('billID') billID: string,
    @Body() body: unknown,
  ): Promise<Bill> {
    const task = pipe(
      body,
      TE.fromPredicate(manyOrderItemIDsCodec.is, () => EXCEPTIONS.bad('Invalid body')),
      TE.chain(orderItemIDs =>
        this._billsService.removeManyOrderItems({
          billID,
          organizationID: loggedUser.organizationID,
          orderItemIDs,
        }),
      ),
      executeTaskEither,
    );

    return await task();
  }
}
