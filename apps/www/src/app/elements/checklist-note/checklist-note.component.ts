import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseNote, ChecklistItem } from '@api-interfaces';
import { ModalService } from '@modal';
import { ActionDirective } from '@www/app/directives/action.directive';
import { traceAction } from '@www/app/helpers/trace-action';
import {
  ChecklistItemFormModalComponent,
  ChecklistItemFormModalComponentInput,
} from '@www/app/modals/checklist-item-form-modal/checklist-item-form-modal.component';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { NotificationService } from '@www/app/services/notification.service';
import { ChecklistItemsStore } from '@www/app/stores/checklist-items.store';
import { sleep } from '@www/app/utils/sleep';
import * as E from 'fp-ts/es6/Either';
import { sortBy } from 'remeda';
import { CheckboxComponent } from '../../primitives/checkbox/checkbox.component';

@Component({
  selector: 'app-checklist-note',
  templateUrl: './checklist-note.component.html',
  styleUrls: ['./checklist-note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ActionDirective, IconComponent, ReactiveFormsModule, RouterModule, CheckboxComponent],
})
export class ChecklistNoteComponent implements OnInit {
  private readonly _checklistItemsStore = inject(ChecklistItemsStore);
  public readonly _modalService = inject(ModalService);
  private readonly _notificationService = inject(NotificationService);

  public readonly inputElement = viewChild('newItemInput', {
    read: ElementRef,
  });

  public readonly baseNote = input.required<Omit<BaseNote, 'type'>>();
  public readonly isAdding = signal(false);

  public items = computed(() => {
    const items = this.checklistItems();
    return sortBy(items, item => (item.completedAt ? 1 : 0));
  });

  public readonly checklistItems = computed(() => {
    const noteID = this.baseNote().id;
    const items = this._checklistItemsStore.all();

    return items.filter(item => item.noteID === noteID);
  });

  public async ngOnInit(): Promise<void> {
    // TODO: make it reactive
    await this._checklistItemsStore.fetchAllFromNote(this.baseNote().id);
  }

  public async openNewItemInput(): Promise<void> {
    this.isAdding.set(true);
    await sleep(100);
    this.inputElement()?.nativeElement.focus();
  }

  public readonly addNewItem = traceAction(async (itemLabel: string, isAdding: WritableSignal<boolean>) => {
    const result = await this._checklistItemsStore.addOne(this.baseNote().id, {
      label: itemLabel,
    });
    if (E.isLeft(result)) {
      this._notificationService.error('Falha ao adicionar item');
      return;
    }

    this._notificationService.success('Item adicionado com sucesso');
    isAdding.set(false);
  });

  public readonly toggleChecklistItem = traceAction(async (item: ChecklistItem) => {
    this._notificationService.loading();
    const completedAt = item.completedAt ? null : new Date();
    const result = await this._checklistItemsStore.updateOne(this.baseNote().id, item.id, {
      completedAt,
    });
    if (E.isLeft(result)) {
      this._notificationService.error('Falha ao adicionar item');
      return;
    }

    this._notificationService.success('Item atualizado com sucesso');
  });

  public openForm(item: ChecklistItem): void {
    this._modalService.open<unknown, ChecklistItemFormModalComponentInput>(ChecklistItemFormModalComponent, {
      noteID: this.baseNote().id,
      itemID: item.id,
    });
  }
}
