import { ActionDirective } from '@www/app/directives/action.directive';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found-page',
  styleUrls: ['./not-found-page.component.scss'],
  templateUrl: './not-found-page.component.html',
  imports: [CommonModule, RouterModule, ActionDirective, PageContainerComponent],
})
export class NotFoundPageComponent {}
