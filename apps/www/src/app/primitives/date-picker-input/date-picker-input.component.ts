import { FormFieldComponent } from '@www/app/primitives/form-field';
import { IconComponent } from '@www/app/primitives/icon';
import { ActionDirective } from '@www/app/directives/action';
import { InputDirective } from '@www/app/directives/input';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, forwardRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { addDays, format, isDate, parse, subDays } from 'date-fns';
import { startWith } from 'rxjs';

const DATE_STRING_FORMAT = 'yyyy-MM-dd';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-date-picker-input',
  styleUrls: ['./date-picker-input.component.scss'],
  templateUrl: './date-picker-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerInputComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, IconComponent, ActionDirective, FormFieldComponent, InputDirective, ReactiveFormsModule],
})
export class DatePickerInputComponent implements OnInit, ControlValueAccessor {
  public readonly dateControl = new FormControl(new Date().toISOString(), {
    nonNullable: true,
  });

  constructor(private readonly _destroyReference: DestroyRef) {}

  public ngOnInit(): void {
    this.dateControl.valueChanges
      .pipe(startWith(this.dateControl.value), takeUntilDestroyed(this._destroyReference))
      .subscribe(value => {
        this._onChange(parse(value, DATE_STRING_FORMAT, new Date()));
        this._onTouched();
      });
  }

  // * Control Value Accessor Stuff

  public writeValue(value: unknown): void {
    if (!isDate(value)) {
      console.error('Invalid value for date picker input');
      return;
    }

    this._setDateValue(value);
  }

  private _onChange: (value: Date) => void = () => void 0;
  public registerOnChange(newFunction: typeof this._onChange): void {
    this._onChange = newFunction;
  }

  private _onTouched: () => void = () => void 0;
  public registerOnTouched(newFunction: typeof this._onTouched): void {
    this._onTouched = newFunction;
  }

  // * Helpers

  private _setDateValue(date: Date): void {
    this.dateControl.setValue(format(date, DATE_STRING_FORMAT));
  }

  private _getCurrentDate(): Date {
    return parse(this.dateControl.value, DATE_STRING_FORMAT, new Date());
  }

  public setPreviousDayDate(): void {
    const previousDate = subDays(this._getCurrentDate(), 1);
    this._setDateValue(previousDate);
  }

  public setNextDayDate(): void {
    const nextDate = addDays(this._getCurrentDate(), 1);
    this._setDateValue(nextDate);
  }
}
