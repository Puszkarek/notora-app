import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageContainerComponent } from '@www/app/primitives/page-container/page-container.component';
import { NotesListComponent } from '../../elements/notes-list/notes-list.component';
import { NotesStore } from '@www/app/stores/notes.store';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { IconComponent } from '../../primitives/icon/icon.component';
import { ActionDirective } from '@www/app/directives/action.directive';
import { TooltipDirective } from '@www/app/directives/tooltip.directive';
import { ModalService } from '@modal';
import { traceAction } from '@www/app/helpers/trace-action';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  imports: [
    CommonModule,
    ActionDirective,
    TooltipDirective,
    PageContainerComponent,
    NotesListComponent,
    PageHeaderComponent,
    IconComponent,
  ],
})
export class HomePageComponent {
  private readonly _modalService = inject(ModalService);
  private readonly _notesStore = inject(NotesStore);

  public readonly notes = this._notesStore.all;

  public readonly openNewNoteModal = traceAction(async () => {
    const component = await import('../../modals/new-note-modal/new-note-modal.component');
    this._modalService.open(component.NewNoteModalComponent);
  });

  public async ngOnInit(): Promise<void> {
    await this._notesStore.fetchMine();
  }
}
