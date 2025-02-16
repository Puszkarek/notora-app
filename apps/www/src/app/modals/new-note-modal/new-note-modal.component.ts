import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActionDirective } from '@www/app/directives/action.directive';
import { InputDirective } from '@www/app/directives/input.directive';
import { FormFieldComponent } from '@www/app/primitives/form-field/form-field.component';
import { MultiSelectInputComponent } from '../../primitives/multi-select-input/multi-select-input.component';
import { traceAction } from '@www/app/helpers/trace-action';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '@www/app/services/notification.service';
import { NotesStore } from '@www/app/stores/notes.store';
import { CreatableNote, creatableNoteCodec } from '@api-interfaces';
import * as E from 'fp-ts/Either';
import { ModalReference } from '@modal';

@Component({
  selector: 'app-new-note-modal',
  templateUrl: './new-note-modal.component.html',
  styleUrls: ['./new-note-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    InputDirective,
    ActionDirective,
    RouterModule,
    MultiSelectInputComponent,
  ],
})
export class NewNoteModalComponent {
  private readonly _fb = inject(NonNullableFormBuilder);
  private readonly _modalReference = inject(ModalReference);
  private readonly _notificationService = inject(NotificationService);
  private readonly _notesStore = inject(NotesStore);

  public readonly form = this._fb.group({
    label: this._fb.control('', Validators.required),
    type: this._fb.control('checklist', Validators.required),
  });

  public readonly noteTypes = [
    { label: 'Text', value: 'text' },
    { label: 'Checklist', value: 'checklist' },
  ];

  public readonly createNote = traceAction(async () => {
    const creatableNote = this.form.getRawValue();
    if (!creatableNote || !creatableNote || this.form.invalid) {
      this._notificationService.error('Please fill all fields');
      return;
    }

    const data = this.getCreatableNote(creatableNote);

    const result = await this._notesStore.createOne(data);
    if (E.isLeft(result)) {
      this._notificationService.error('Error creating note');
      return;
    }
    this._notificationService.success('Note created');

    this._modalReference.close(null);
  });

  private getCreatableNote(data: { label: string; type: string }): CreatableNote {
    if (data.type == 'checklist') {
      return {
        label: data.label,
        type: 'checklist',
        checklist: [],
      };
    }

    // if not checklist, it's text
    return {
      label: data.label,
      type: 'text',
      content: '',
    };
  }
}
