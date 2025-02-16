import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-checkbox-input',
  templateUrl: './checkbox-input.component.html',
  styleUrls: ['./checkbox-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxInputComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, IconComponent, ReactiveFormsModule],
})
export class CheckboxInputComponent implements ControlValueAccessor {
  private readonly _isChecked$ = new BehaviorSubject(false);
  public readonly isChecked$ = this._isChecked$.asObservable().pipe(distinctUntilChanged());

  @HostListener('click')
  public toggle(): void {
    const newValue = !this._isChecked$.getValue();
    this._isChecked$.next(newValue);
    this._onChange(newValue);
    this._onTouched();
  }

  // * Control Value Accessor Stuffs

  public writeValue(value: boolean): void {
    this._isChecked$.next(value);
  }

  private _onChange: (value: boolean) => void = () => void 0;
  public registerOnChange(onChange: typeof this._onChange): void {
    this._onChange = onChange;
  }

  private _onTouched = (): void => void 0;
  public registerOnTouched(onTouched: () => void): void {
    this._onTouched = onTouched;
  }
}
