import { ConfirmationModalWarningComponent } from '@www/app/components/confirmation-modal-warning';
import { ActionDirective } from '@www/app/directives/action';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MODAL_DATA_TOKEN, ModalReference } from '@modal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirmation-modal',
  styleUrls: ['./confirmation-modal.component.scss'],
  templateUrl: './confirmation-modal.component.html',
  imports: [CommonModule, ConfirmationModalWarningComponent, ActionDirective],
})
export class ConfirmationModalComponent {
  constructor(
    @Inject(MODAL_DATA_TOKEN) public data: ConfirmationModalComponentInput,
    private readonly _modalReference: ModalReference<ConfirmationModalComponentOutput>,
  ) {}

  /**
   * Triggers an action to close the modal
   *
   * @param user - The user just create / update, null if we had canceled the action
   */
  public close(data?: ConfirmationModalComponentOutput['status'] | null): void {
    this._modalReference.close({
      status: data ?? 'canceled',
    });
  }
}

export type ConfirmationModalComponentInput = {
  readonly title: string;
  readonly message: string;
  readonly warning?: string;
};

export type ConfirmationModalComponentOutput = {
  readonly status: 'confirmed' | 'canceled';
};
