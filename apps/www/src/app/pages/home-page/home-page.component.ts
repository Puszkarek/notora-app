import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageContainerComponent } from '@www/app/primitives/page-container/page-container.component';
import { NotesList } from '../../elements/notes-list/notes-list.component';
import { NotesStore } from '@www/app/stores/notes.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  imports: [CommonModule, PageContainerComponent, NotesList],
})
export class HomePageComponent {
  private readonly _notesStore = inject(NotesStore);
  public readonly notes = this._notesStore.all;
}
