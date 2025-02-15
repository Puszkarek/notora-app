import { IconComponent } from '@www/app/components/icon';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirmation-modal-warning',
  styleUrls: ['./confirmation-modal-warning.component.scss'],
  templateUrl: './confirmation-modal-warning.component.html',
  imports: [CommonModule, IconComponent],
})
export class ConfirmationModalWarningComponent {
  @Input({
    required: true,
  })
  public warningMessage!: string;
}
