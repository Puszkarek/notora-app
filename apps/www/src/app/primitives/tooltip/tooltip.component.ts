import { TOOLTIP_DATA_TOKEN } from '@www/app/constants/tooltip';
import { TooltipData } from '@www/app/interfaces/tooltip';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
})
export class TooltipComponent {
  constructor(
    @Inject(TOOLTIP_DATA_TOKEN)
    public readonly data: TooltipData,
  ) {}
}
