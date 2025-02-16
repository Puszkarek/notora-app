import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-field',
  styleUrls: ['./form-field.component.scss'],
  templateUrl: './form-field.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export class FormFieldComponent {}
