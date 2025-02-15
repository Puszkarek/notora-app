import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loading-spinner',
  styleUrls: ['./loading-spinner.component.scss'],
  templateUrl: './loading-spinner.component.html',
  imports: [],
})
export class LoadingSpinnerComponent {
  @HostBinding('attr.role') public role = 'status';
}
