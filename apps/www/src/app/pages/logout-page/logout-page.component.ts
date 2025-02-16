import { LoadingSpinnerComponent } from '@www/app/primitives/loading-spinner/loading-spinner.component';
import { AuthService } from '@www/app/services/auth.service';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-logout-page',
  styleUrls: ['./logout-page.component.scss'],
  templateUrl: './logout-page.component.html',
  imports: [LoadingSpinnerComponent, PageContainerComponent],
})
export class LogoutPageComponent implements OnInit {
  constructor(private readonly _authService: AuthService) {}

  public ngOnInit(): void {
    this._authService.logout();
  }
}
