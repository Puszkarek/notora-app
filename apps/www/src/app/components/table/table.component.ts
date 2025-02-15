import { IconComponent } from '@www/app/components/icon';
import { ActionDirective } from '@www/app/directives/action';
import { TooltipDirective } from '@www/app/directives/tooltip';
import { ICON_ID } from '@www/app/interfaces/icon';
import { DataSource } from '@angular/cdk/collections';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { isEqual } from '@utils';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, shareReplay } from 'rxjs';

export class CustomDataSource<T extends object> extends DataSource<T> {
  /** Stream of data that is provided to the table. */
  public data = new BehaviorSubject<Array<T>>([]);

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  public connect(): Observable<Array<T>> {
    return this.data;
  }

  public updateData(data: Array<T>): void {
    this.data.next(data);
  }

  public disconnect(): void {
    console.log('disconnect');
  }
}

export type TableColumn<T extends object> = {
  key: Extract<keyof T, string>;
  label: string;
};

export type TableCommand<T extends object> = {
  label: string;
  iconID: ICON_ID;
  action: (item: T) => Promise<void> | void;
};

@Component({
  selector: 'app-table',
  styleUrls: ['./table.component.scss'],
  templateUrl: './table.component.html',
  imports: [
    CommonModule,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkTableModule,
    ActionDirective,
    TooltipDirective,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T extends object> {
  private readonly _columns$ = new BehaviorSubject<Array<TableColumn<T>>>([]);
  private readonly _commands$ = new BehaviorSubject<Array<TableCommand<T>>>([]);

  @Input({
    required: true,
  })
  public set columns(value: Array<TableColumn<T>>) {
    this._columns$.next(value);
  }

  @Input({
    required: true,
  })
  public set data(value: Array<T>) {
    this.dataSource.updateData(value);
  }

  @Input() public set commands(value: Array<TableCommand<T>>) {
    this._commands$.next(value);
  }

  public readonly columns$ = this._columns$.pipe(distinctUntilChanged(isEqual), shareReplay(1));
  public readonly commands$ = this._commands$.pipe(distinctUntilChanged(isEqual), shareReplay(1));
  public readonly displayedColumns$ = combineLatest({
    columns: this.columns$,
    commands: this._commands$,
  }).pipe(
    map(({ columns, commands }) => {
      const columnsKeys = columns.map(column => column.key);
      if (commands.length > 0) {
        columnsKeys.push('options' as never);
      }
      return columnsKeys;
    }),
    shareReplay(1),
  );

  public dataSource = new CustomDataSource();
}
