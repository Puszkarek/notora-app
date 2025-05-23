import { LoadingSpinnerComponent } from '@www/app/primitives/loading-spinner/loading-spinner.component';
import { AuthService } from '@www/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isString } from '@utils';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';
import { sleep } from '@www/app/utils/sleep';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-callback-login-page',
  styleUrls: ['./callback-login-page.component.scss'],
  templateUrl: './callback-login-page.component.html',
  imports: [CommonModule, LoadingSpinnerComponent, RouterModule, ReactiveFormsModule, PageContainerComponent],
})
export class CallbackLoginPageComponent implements OnInit {
  constructor(
    private readonly _authService: AuthService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
  ) {}

  public async ngOnInit(): Promise<void> {
    const { code } = this._route.snapshot.queryParams;
    if (!isString(code)) {
      this._router.navigateByUrl('/login');
      return;
    }

    const isSuccessfully = await this._authService.handleLoginCallback(code);

    if (!isSuccessfully) {
      this._router.navigateByUrl('/login');
      return;
    }

    // * Wait for the signal to be updated
    await sleep(100);
    this._router.navigateByUrl('/');
  }
}
