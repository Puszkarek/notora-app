import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { BaseNote } from '@api-interfaces';
import { traceAction } from '@www/app/helpers/trace-action';
import { NotificationService } from '@www/app/services/notification.service';
import { TextNotesStore } from '@www/app/stores/text-notes.store';
import * as E from 'fp-ts/es6/Either';
import { LoadingSpinnerComponent } from "@www/app/primitives/loading-spinner/loading-spinner.component";

@Component({
  selector: 'app-text-note',
  templateUrl: './text-note.component.html',
  styleUrls: ['./text-note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoadingSpinnerComponent],
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

  public onBlur(): void {
    const currentContent = this.noteContent();
    const newContent = this.content();

    if (currentContent !== newContent) {
      this.updateContent.execute(newContent);
    }
  }
}
