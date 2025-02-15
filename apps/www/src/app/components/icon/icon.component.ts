import { ICON_ID } from '@www/app/interfaces/icon';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-icon',
  styleUrls: ['./icon.component.scss'],
  templateUrl: './icon.component.html',
})
export class IconComponent {
  @Input({
    required: true,
  })
  public iconID!: ICON_ID;
}
