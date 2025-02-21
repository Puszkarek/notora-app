import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChecklistItem, CheckListNote } from '@api-interfaces';
import { ActionDirective } from '@www/app/directives/action.directive';
import { TraceableAction } from '@www/app/helpers/trace-action';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { sleep } from '@www/app/utils/sleep';
import { CheckboxComponent } from '../../primitives/checkbox/checkbox.component';
import { sortBy } from 'remeda';

@Component({
  selector: 'app-checklist-item-form-modal',
  templateUrl: './checklist-item-form-modal.component.html',
  styleUrls: ['./checklist-item-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ActionDirective, IconComponent, ReactiveFormsModule, RouterModule, CheckboxComponent],
})
export class ChecklistItemFormModalComponent {
  public readonly inputElement = viewChild('newItemInput', {
    read: ElementRef,
  });

  public readonly checklist = input.required<CheckListNote>();
  public readonly isAdding = signal(false);

  public readonly addNewItem = input.required<TraceableAction<[string, WritableSignal<boolean>]>>();

  public readonly toggleItem = output<ChecklistItem>();

  public items = computed(() => {
    const items = this.checklist().items;
    return sortBy(items, item => (item.completedAt ? 1 : 0));
  });

  public async openNewItemInput(): Promise<void> {
    this.isAdding.set(true);
    await sleep(100);
    this.inputElement()?.nativeElement.focus();
  }
}
