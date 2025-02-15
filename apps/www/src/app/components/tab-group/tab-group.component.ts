import { TabComponent } from '@www/app/components/tab/tab.component';
import { ActionDirective } from '@www/app/directives/action';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ContentChildren, QueryList } from '@angular/core';
import { BehaviorSubject, map, startWith } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tab-group',
  styleUrls: ['./tab-group.component.scss'],
  templateUrl: './tab-group.component.html',
  imports: [CommonModule, ActionDirective],
})
export class TabGroupComponent implements AfterViewInit {
  @ContentChildren(TabComponent, { descendants: true }) public tabs!: QueryList<TabComponent>;

  private readonly _selectedTabIndex$ = new BehaviorSubject<number>(0);
  public readonly selectedTabIndex$ = this._selectedTabIndex$.asObservable();

  public ngAfterViewInit(): void {
    this.selectTab(this._selectedTabIndex$.getValue());
  }

  public selectTab(tabIndex: number): void {
    this.tabs.forEach((tab, index) => {
      tab.setIsActive(index === tabIndex);
    });
    this._selectedTabIndex$.next(tabIndex);
  }
}
