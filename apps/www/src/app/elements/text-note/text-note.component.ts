import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { BaseNote } from '@api-interfaces';
import { ActionDirective } from '@www/app/directives/action.directive';
import { traceAction } from '@www/app/helpers/trace-action';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { LoadingSpinnerComponent } from '@www/app/primitives/loading-spinner/loading-spinner.component';
import { NotificationService } from '@www/app/services/notification.service';
import { TextNotesStore } from '@www/app/stores/text-notes.store';
import * as E from 'fp-ts/es6/Either';

@Component({
  selector: 'app-text-note',
  templateUrl: './text-note.component.html',
  styleUrls: ['./text-note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoadingSpinnerComponent, ActionDirective, IconComponent],
})
export class TextNoteComponent implements OnInit {
  private readonly _textNotesStore = inject(TextNotesStore);
  private readonly _notificationService = inject(NotificationService);

  public readonly baseNote = input.required<BaseNote>();
  public readonly content = signal('');
  public readonly isEditing = signal(false);
  public readonly isLoading = signal(true);

  public readonly noteContent = computed(() => {
    const noteID = this.baseNote().id;
    const textNoteEntity = this._textNotesStore.textNotesEntityMap()[noteID];
    return textNoteEntity?.content ?? '';
  });

  public async ngOnInit(): Promise<void> {
    await this._textNotesStore.fetchOne(this.baseNote().id);
    this.content.set(this.noteContent());
    this.isLoading.set(false);
  }

  public readonly updateContent = traceAction(async (newContent: string) => {
    const note = this.baseNote();

    const result = await this._textNotesStore.updateOne(note.id, {
      content: newContent,
    });

    if (E.isLeft(result)) {
      this._notificationService.error('Falha ao atualizar nota');
      return;
    }

    this._notificationService.success('Nota atualizada com sucesso');
  });

  public onTextChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.content.set(target.value);
  }

  public startEditing(): void {
    this.content.set(this.noteContent());
    this.isEditing.set(true);
  }

  public cancelEditing(): void {
    this.content.set(this.noteContent());
    this.isEditing.set(false);
  }

  public readonly saveContent = traceAction(async () => {
    const currentContent = this.noteContent();
    const newContent = this.content();

    if (currentContent !== newContent) {
      const note = this.baseNote();
      const result = await this._textNotesStore.updateOne(note.id, {
        content: newContent,
      });

      if (E.isLeft(result)) {
        this._notificationService.error('Falha ao atualizar nota');
        return;
      }

      this._notificationService.success('Nota atualizada com sucesso');
    }

    this.isEditing.set(false);
  });
}
