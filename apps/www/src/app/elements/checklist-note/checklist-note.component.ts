import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CheckListNote } from '@api-interfaces';
import { ActionDirective } from '@www/app/directives/action.directive';
import { TraceableAction } from '@www/app/helpers/trace-action';
import { CheckboxInputComponent } from '@www/app/primitives/checkbox-input';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { sleep } from '@www/app/utils/sleep';

@Component({
  selector: 'app-checklist-note',
  templateUrl: './checklist-note.component.html',
  styleUrls: ['./checklist-note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ActionDirective, IconComponent, ReactiveFormsModule, CheckboxInputComponent, RouterModule],
})
export class ChecklistNoteComponent {
  private readonly _fb = inject(NonNullableFormBuilder);

  public readonly form = this._fb.array<boolean>([]);

  public readonly inputElement = viewChild('newItemInput', {
    read: ElementRef,
  });

  public readonly checklist = input.required<CheckListNote>();
  public readonly isAdding = signal(false);

  public readonly addNewItem = input.required<TraceableAction<[string, WritableSignal<boolean>]>>();

  public readonly itemsWithControl = computed(() => {
    const items = this.checklist().items;
    return items.map((item, index) => ({
      ...item,
      control: this.form.controls[index] as FormControl<boolean>,
    }));
  });

  constructor() {
    effect(() => {
      const items = this.checklist().items;
      this.form.clear();
      items.forEach(item => {
        this.form.push(this._fb.control(item.completedAt ? true : false));
      });
    });
  }

  public async openNewItemInput(): Promise<void> {
    this.isAdding.set(true);
    await sleep(100);
    this.inputElement()?.nativeElement.focus();
  }
}
