import { DropdownComponent } from '@www/app/primitives/dropdown';
import { DropdownTriggerDirective } from '@www/app/directives/dropdown-trigger';
import { InputDirective } from '@www/app/directives/input';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-auto-complete-input',
  templateUrl: './auto-complete-input.component.html',
  styleUrls: ['./auto-complete-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutoCompleteInputComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, ReactiveFormsModule, InputDirective, DropdownTriggerDirective, DropdownComponent],
})
export class AutoCompleteInputComponent implements OnInit, ControlValueAccessor {
  @Input() public placeholder = 'Digite para buscar';

  @Input({ required: true }) public set items(value: ReadonlyArray<string>) {
    this._items$.next(value);
  }

  public readonly inputControl = new FormControl('', {
    nonNullable: true,
  });

  public readonly inputValue$ = this.inputControl.valueChanges.pipe(
    startWith(this.inputControl.value),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  private readonly _items$ = new BehaviorSubject<ReadonlyArray<string>>([]);
  public readonly items$ = combineLatest([this._items$, this.inputValue$]).pipe(
    map(([items, inputValue]) => {
      return items.filter(item => item.toLowerCase().includes(inputValue.toLowerCase()));
    }),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  public ngOnInit(): void {
    this.inputControl.valueChanges.subscribe(selectedValue => {
      this._onChange(selectedValue);
      this._onTouched();
    });
  }

  // * Control Value Accessor
  public writeValue(value: string): void {
    this.inputControl.setValue(value);
  }

  private _onChange = (_value: string): void => void 0;
  public registerOnChange(onChange: (value: string) => void): void {
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
  public updateSelectedValue(newValue: string): void {
    this.inputControl.setValue(newValue);
  }
}
