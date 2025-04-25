import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Inject, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ID } from '@api-interfaces';
import { MODAL_DATA_TOKEN, ModalReference } from '@modal';
import { ActionDirective } from '@www/app/directives/action.directive';
import { InputDirective } from '@www/app/directives/input.directive';
import { traceAction } from '@www/app/helpers/trace-action';
import { FormFieldComponent } from '@www/app/primitives/form-field/form-field.component';
import { NotificationService } from '@www/app/services/notification.service';
import { ChecklistItemsStore } from '@www/app/stores/checklist-items.store';
import * as E from 'fp-ts/es6/Either';
import { IconComponent } from '../../primitives/icon/icon.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-checklist-item-form-modal',
  templateUrl: './checklist-item-form-modal.component.html',
  styleUrls: ['./checklist-item-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    InputDirective,
    ActionDirective,
    RouterModule,
    IconComponent,
  ],
})
export class ChecklistItemFormModalComponent {
  private readonly _fb = inject(NonNullableFormBuilder);
  private readonly _modalReference = inject(ModalReference);
  private readonly _notificationService = inject(NotificationService);
  private readonly _checklistItemsStore = inject(ChecklistItemsStore);

  public readonly item = computed(() => {
    const id = this.data.itemID;
    const item = this._checklistItemsStore.all().find(i => i.id === id);

    return item ?? null;
  });

  public readonly form = this._fb.group({
    label: this._fb.control(this.item()?.label ?? '', Validators.required),
    completedAt: this._fb.control(this.item()?.completedAt ?? null),
  });

  public readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  public readonly delete = traceAction(async () => {
    const itemID = this.item()?.id;
    if (!itemID) {
      this._notificationService.error('Something gone wrong, please try again later');
      return;
    }
    const result = await this._checklistItemsStore.deleteOne(this.data.noteID, itemID);

    if (E.isLeft(result)) {
      this._notificationService.error('Something gone wrong, please try again later');
      return;
    }

    this._notificationService.success('Note successfully deleted');

    this._modalReference.close(null);
  });

  public readonly save = traceAction(async () => {
    if (this.form.invalid) {
      this._notificationService.error('Please enter a label');
      return;
    }

    const data = this.form.getRawValue();
    const noteID = this.data.noteID;
    const item = this.item();
    if (!item) {
      this._notificationService.error('Something gone wrong, please try again later');
      return;
    }
    const result = await this._checklistItemsStore.updateOne(noteID, item.id, data);
    if (E.isLeft(result)) {
      this._notificationService.error('Something gone wrong, please try again later');
      return;
    }
    this._notificationService.success('Note successfully updated');

    this._modalReference.close(null);
  });

  constructor(
    @Inject(MODAL_DATA_TOKEN)
    public readonly data: ChecklistItemFormModalComponentInput,
  ) {}

  public toggleCompleted(): void {
    const value = this.form.getRawValue().completedAt;
    const newValue = value ? null : new Date();
    this.form.patchValue({ completedAt: newValue });
  }

  public close(): void {
    this._modalReference.close(null);
  }
}

export type ChecklistItemFormModalComponentInput = {
  noteID: ID;
  itemID: ID;
};
