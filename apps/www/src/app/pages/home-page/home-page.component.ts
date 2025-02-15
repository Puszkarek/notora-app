import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  imports: [CommonModule],
})
export class HomePageComponent {

}
