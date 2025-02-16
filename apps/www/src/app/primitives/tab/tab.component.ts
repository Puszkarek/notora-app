/* eslint-disable unicorn/consistent-function-scoping */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tab',
  styleUrls: ['./tab.component.scss'],
  templateUrl: './tab.component.html',
  imports: [CommonModule],
})
export class TabComponent {
  @Input({ required: true }) public label = '';

  private readonly _isActive$ = new BehaviorSubject<boolean>(false);
  public readonly isActive$ = this._isActive$.asObservable();

  @HostBinding('class.active') public get isActive(): boolean {
    return this._isActive$.getValue();
  }

  public setIsActive(active: boolean): void {
    this._isActive$.next(active);
  }
}
