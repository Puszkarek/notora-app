import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckListNote, TextNote } from '@api-interfaces';
import { isString } from '@utils';
import { NotificationService } from '@www/app/services/notification.service';
import { NotesStore } from '@www/app/stores/notes.store';
import * as E from 'fp-ts/es6/Either';
import { filter, firstValueFrom, map } from 'rxjs';
import { LoadingSpinnerComponent } from '../../primitives/loading-spinner/loading-spinner.component';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';

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
  selector: 'app-share-note-page',
  styleUrls: ['./share-note-page.component.scss'],
  templateUrl: './share-note-page.component.html',
  imports: [CommonModule, PageContainerComponent, LoadingSpinnerComponent],
})
export default class NotePageComponent {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _notificationService = inject(NotificationService);
  private readonly _router = inject(Router);
  private readonly _notesStore = inject(NotesStore);

  private readonly _note = signal<State>({ state: 'loading' });
  public readonly data = this._note.asReadonly();

  public async ngOnInit(): Promise<void> {
    const id = await firstValueFrom(
      this._activatedRoute.params.pipe(
        map(({ id }) => id),
        filter(isString),
      ),
    );

    const either = await this._notesStore.shareOne(id);

    if (E.isLeft(either)) {
      this._notificationService.error('Não foi possível carregar a nota');
      return;
    } else {
      this._router.navigate(['/notes', id]);
    }
  }
}
