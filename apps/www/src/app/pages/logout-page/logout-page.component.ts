import { LoadingSpinnerComponent } from '@www/app/components/loading-spinner';
import { AuthService } from '@www/app/services/auth';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-logout-page',
  styleUrls: ['./logout-page.component.scss'],
  templateUrl: './logout-page.component.html',
  imports: [LoadingSpinnerComponent],
})
export class LogoutPageComponent implements OnInit {
  constructor(private readonly _authService: AuthService) {}

  public ngOnInit(): void {
    this._authService.logout();
  }
}
