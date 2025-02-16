import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseNote } from '@api-interfaces';
import { IconComponent } from '../../primitives/icon/icon.component';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IconComponent],
})
export class NotesListComponent {
  public readonly notes = input.required<ReadonlyArray<BaseNote>>();

  // TODO: add color to the note
  public randomNoteColor(): string {
    return `var(--note-color-${Math.floor(Math.random() * 6) + 1})`;
  }
}
