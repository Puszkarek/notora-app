import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-no-results',
  styleUrls: ['./no-results.component.scss'],
  templateUrl: './no-results.component.html',
  imports: [CommonModule],
})
export class NoResultsComponent {
  @Input({
    required: true,
  })
  public message!: string;
}
