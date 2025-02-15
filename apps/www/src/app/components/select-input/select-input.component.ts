import { DropdownComponent } from '@www/app/components/dropdown';
import { DropdownTriggerDirective } from '@www/app/directives/dropdown-trigger';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { map, ReplaySubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export type DropdownItem<T> = {
  readonly label: string;
  readonly value: T;
};

@Component({
  selector: 'app-select-input',
  templateUrl: './select-input.component.html',
  styleUrls: ['./select-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, DropdownTriggerDirective, DropdownComponent],
})
export class SelectInputComponent<T> implements OnInit, ControlValueAccessor {
  @Input() public label: string | null = null;

  @Input({ required: true }) public items: ReadonlyArray<DropdownItem<T>> = [];

  /** The current value selected by the input */
  private readonly _selectedValue$ = new ReplaySubject<T>();
  public readonly selectedValue$ = this._selectedValue$.asObservable();

  /** The label of the current value selected by the input */
  public readonly selectedLabel$ = this.selectedValue$.pipe(
    map(value => {
      return this.items.find(item => item.value === value)?.label;
    }),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  public ngOnInit(): void {
    this.selectedValue$.subscribe(selectedValue => {
      this._onChange(selectedValue);
      this._onTouched();
    });
  }

  // * Control Value Accessor
  public writeValue(value: T): void {
    this._selectedValue$.next(value);
  }

  private _onChange = (_value: T): void => void 0;
  public registerOnChange(onChange: typeof this._onChange): void {
    this._onChange = onChange;
  }

  private _onTouched = (): void => void 0;
  public registerOnTouched(onTouched: () => void): void {
    this._onTouched = onTouched;
  }

  // * Select input

  /**
   * Updates the selected value with a new value
   *
   * @param newValue - The value to select
   */
  public updateSelectedValue(newValue: T): void {
    this._selectedValue$.next(newValue);
  }

  // * Performance
  public trackByValue(_index: number, item: DropdownItem<T>): string {
    return item.label;
  }
}
