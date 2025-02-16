import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, HostListener, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, IconComponent],
})
export class CheckboxComponent {
  public readonly isChecked = input.required<boolean>();

  public readonly clicked = output();
}
