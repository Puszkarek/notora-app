import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseNote } from '@api-interfaces';
import { ModalService } from '@modal';
import { isString } from '@utils';
import { ActionDirective } from '@www/app/directives/action.directive';
import { DropdownTriggerDirective } from '@www/app/directives/dropdown-trigger.directive';
import { TooltipDirective } from '@www/app/directives/tooltip.directive';
import { ChecklistNoteComponent } from '@www/app/elements/checklist-note/checklist-note.component';
import { TextNoteComponent } from '@www/app/elements/text-note/text-note.component';
import { traceAction } from '@www/app/helpers/trace-action';
import {
  ConfirmationModalComponentInput,
  ConfirmationModalComponentOutput,
} from '@www/app/modals/confirmation-modal/confirmation-modal.component';
import { NotificationService } from '@www/app/services/notification.service';
import { NotesStore } from '@www/app/stores/notes.store';
import * as E from 'fp-ts/es6/Either';
import { filter, firstValueFrom, map } from 'rxjs';
import { DropdownComponent } from '../../primitives/dropdown/dropdown.component';
import { IconComponent } from '../../primitives/icon/icon.component';
import { LoadingSpinnerComponent } from '../../primitives/loading-spinner/loading-spinner.component';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

type State =
  | {
      state: 'loading' | 'error';
    }
  | {
      state: 'loaded';
      note: BaseNote;
    };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-note-page',
  styleUrls: ['./note-page.component.scss'],
  templateUrl: './note-page.component.html',
  imports: [
    CommonModule,
    ChecklistNoteComponent,
    TextNoteComponent,
    ActionDirective,
    TooltipDirective,
    DropdownTriggerDirective,
    RouterModule,
    PageContainerComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    IconComponent,
    DropdownComponent,
  ],
})
export default class NotePageComponent {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _notificationService = inject(NotificationService);
  private readonly _router = inject(Router);
  private readonly _modalService = inject(ModalService);
  private readonly _notesStore = inject(NotesStore);

  public readonly deleteNote = traceAction(async (noteID: string) => {
    const component = await import('../../modals/confirmation-modal/confirmation-modal.component');
    const ref = this._modalService.open<ConfirmationModalComponentOutput, ConfirmationModalComponentInput>(
      component.ConfirmationModalComponent,
      {
        title: 'Excluir nota',
        message: 'Tem certeza que deseja excluir essa nota?',
      },
    );
    const result = await firstValueFrom(ref.data$);
    if (result?.status === 'confirmed') {
      const result = await this._notesStore.deleteOne(noteID);
      if (E.isLeft(result)) {
        this._notificationService.error('Falha ao excluir nota');
        return;
      }
      this._notificationService.success('Nota excluída com sucesso');
      await this._router.navigate(['/']);
    }
  });

  public readonly shareList = traceAction(async () => {
    const data = this.state();
    if (!data || data.state !== 'loaded') {
      this._notificationService.error('Não foi possível compartilhar a lista');
      return;
    }
    const url = `${location.origin}/notes/${data.note.id}/share`;
    await navigator.clipboard.writeText(url);
    this._notificationService.success('Link copiado para a área de transferência');
  });

  private readonly _routeID$ = this._activatedRoute.params.pipe(
    map(({ id }) => id),
    filter(isString),
  );
  private readonly routeID = toSignal(this._routeID$);

  public readonly state = computed<State>(() => {
    const routeID = this.routeID();

    const data = this._notesStore.all().find(n => n.id === routeID);
    if (this._notesStore.isLoading() && !this._notesStore.isLoaded()) {
      return { state: 'loading' };
    }
    if (!data) {
      return { state: 'error' };
    }

    return {
      state: 'loaded',
      note: data,
    };
  });

  public async ngOnInit(): Promise<void> {
    await this._notesStore.load();
  }

  public getTitle(data: State | null): string {
    if (data?.state !== 'loaded') {
      return 'Sua nota';
    }

    return data.note.label;
  }
}
