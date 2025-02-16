import { NOTIFICATION_DATA_TOKEN } from '@www/app/constants/notification';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Inject } from '@angular/core';
import { NotificationData } from '@www/app/interfaces/notification';

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('openClose', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-in-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  imports: [CommonModule],
})
export class NotificationToastComponent {
  @HostBinding('@openClose') public readonly openClose = true;

  /** The message to show to the user */
  public readonly message = this._notificationData.message;

  /** The type of the message */
  public readonly type = this._notificationData.type;

  constructor(
    @Inject(NOTIFICATION_DATA_TOKEN)
    private readonly _notificationData: NotificationData,
  ) {}
}
