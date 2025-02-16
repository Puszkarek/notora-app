import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-header',
  styleUrls: ['./page-header.component.scss'],
  templateUrl: './page-header.component.html',
  imports: [CommonModule],
})
export class PageHeaderComponent {
  @Input({
    required: true,
  })
  public title = '';
}
