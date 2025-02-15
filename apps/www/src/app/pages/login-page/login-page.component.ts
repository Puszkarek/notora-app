import { IconComponent } from '@www/app/components/icon';
import { ActionDirective } from '@www/app/directives/action';
import { AuthService } from '@www/app/services/auth';
import { NotificationService } from '@www/app/services/notification';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html',
  imports: [RouterModule, IconComponent, ActionDirective],
})
export class LoginPageComponent {
  private readonly _isSubmitting$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly _authService: AuthService,
    private readonly _notificationService: NotificationService,
  ) {}

  /**
   * Init an action to login the user, then if success redirect him to the main page, otherwise
   * show a notification with the error
   */
  public async loginUser(): Promise<void> {
    if (this._isSubmitting$.value) {
      this._notificationService.error('Já estamos fazendo o login');
      return;
    }

    this._isSubmitting$.next(true);
    this._notificationService.info('Logando...');
    const isSuccess = await this._authService.login();
    this._notificationService.clean();
    if (!isSuccess) {
      this._isSubmitting$.next(false);
      this._notificationService.error('Falha ao fazer login');
    }
  }
}
