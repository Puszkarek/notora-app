import { LoadingSpinnerComponent } from '@www/app/components/loading-spinner';
import { AuthService } from '@www/app/services/auth';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isString } from '@utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-callback-login-page',
  styleUrls: ['./callback-login-page.component.scss'],
  templateUrl: './callback-login-page.component.html',
  imports: [CommonModule, LoadingSpinnerComponent, RouterModule, ReactiveFormsModule],
})
export class CallbackLoginPageComponent implements OnInit {
  constructor(
    private readonly _authService: AuthService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
  ) {}

  public async ngOnInit(): Promise<void> {
    const { code, state } = this._route.snapshot.queryParams;
    if (!isString(code) || !isString(state)) {
      this._router.navigateByUrl('/login');
      return;
    }

    const isSuccessfully = await this._authService.handleLoginCallback(code, state);

    if (!isSuccessfully) {
      this._router.navigateByUrl('/login');
      return;
    }

    this._router.navigateByUrl('/');
  }
}
