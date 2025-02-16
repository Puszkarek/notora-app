import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { ModalService } from '@modal';
import { traceAction } from '@www/app/helpers/trace-action';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { filter, first, firstValueFrom, map, switchMap } from 'rxjs';
import { isString } from '@utils';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';
import { LoadingSpinnerComponent } from '../../primitives/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { ActionDirective } from '@www/app/directives/action.directive';
import { IconComponent } from '../../primitives/icon/icon.component';
import { CheckListNote, TextNote } from '@api-interfaces';
import * as O from 'fp-ts/es6/Option';
import { TooltipDirective } from '@www/app/directives/tooltip.directive';
import { flow } from 'fp-ts/es6/function';
import { DropdownComponent } from '../../primitives/dropdown/dropdown.component';
import { DropdownTriggerDirective } from '@www/app/directives/dropdown-trigger.directive';
import {
  ConfirmationModalComponentInput,
  ConfirmationModalComponentOutput,
} from '@www/app/modals/confirmation-modal/confirmation-modal.component';
import { NotesStore } from '@www/app/stores/notes.store';
import { NotificationService } from '@www/app/services/notification.service';
import * as E from 'fp-ts/es6/Either';
import { ChecklistNoteComponent } from '@www/app/elements/checklist-note/checklist-note.component';

type State =
  | {
      state: 'loading' | 'error';
    }
  | {
      state: 'loaded';
      data: TextNote | CheckListNote;
    };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-note-page',
  styleUrls: ['./note-page.component.scss'],
  templateUrl: './note-page.component.html',
  imports: [
    CommonModule,
    ChecklistNoteComponent,
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

  private readonly _note = signal<State>({ state: 'loading' });
  public readonly data = this._note.asReadonly();

  public readonly addNewItem = traceAction(async (itemLabel: string, isAdding: WritableSignal<boolean>) => {
    const note = this.data();
    if (!note || note.state !== 'loaded' || note.data.type !== 'checklist') {
      this._notificationService.error('Não foi possível adicionar o item');
      return;
    }

    const result = await this._notesStore.addOneChecklistItem(note.data.id, {
      label: itemLabel,
    });
    if (E.isLeft(result)) {
      this._notificationService.error('Falha ao adicionar item');
      return;
    }

    const updatedNote: CheckListNote = {
      ...note.data,
      items: [...note.data.items, result.right],
    };
    this._note.set({ state: 'loaded', data: updatedNote });
    this._notificationService.success('Item adicionado com sucesso');
    isAdding.set(false);
  });

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
    console.log('get link');
  });

  public async ngOnInit(): Promise<void> {
    this._activatedRoute.params
      .pipe(
        map(({ id }) => id),
        filter(isString),
        switchMap(async id => await this._notesStore.fetchOneWithDetails(id)),
        map(flow(O.fromEither, O.toNullable)),
        map((data): State => (data ? { state: 'loaded', data } : { state: 'error' })),
        first(),
      )
      .subscribe(data => {
        this._note.set(data);
      });
  }

  public getTitle(note: State | null): string {
    if (note?.state !== 'loaded') {
      return 'Sua nota';
    }

    return note.data.label;
  }
}
