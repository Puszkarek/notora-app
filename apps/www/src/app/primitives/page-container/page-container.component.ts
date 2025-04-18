import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-page-container',
  standalone: true,
  imports: [],
  providers: [],
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContainerComponent {}
