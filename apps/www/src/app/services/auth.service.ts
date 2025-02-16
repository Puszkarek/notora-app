import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { isNull } from '@utils';
import { loginCallback } from '@www/app/endpoints/login-callback';
import { LoginStatus } from '@www/app/interfaces/auth';
import { TokenManagerService } from '@www/app/services/token-manager.service';
import { environment } from '@www/environments/environment';
import * as t from 'io-ts';
import * as E from 'fp-ts/es6/Either';
import { distinctUntilChanged, filter, firstValueFrom, map, shareReplay } from 'rxjs';
import { getMyUser } from '@www/app/endpoints/get-my-user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** The base URL to use in requests */
  private readonly _baseURL = environment.apiHost;

  private readonly _authAction = signal<LoginStatus>({
    status: 'undefined',
  });

  public readonly authAction = this._authAction.asReadonly();
  public readonly authAction$ = toObservable(this.authAction);

  public readonly loggedUser$ = toObservable(this.authAction).pipe(
    distinctUntilChanged(),
    filter(auth => auth.status !== 'undefined'),
    map(auth => (auth.status === 'logged' ? auth.user : null)),
    shareReplay(1),
  );
  public readonly loggedUser = toSignal(this.loggedUser$);

  /** Emits, true when we have a current user cached, otherwise false */
  public readonly isAuthenticated$ = computed(() => {
    return this.authAction().status === 'logged';
  });

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _tokenManager: TokenManagerService,
    private readonly _router: Router,
  ) {
    this.checkToken();
  }

  public async handleLoginCallback(code: string): Promise<boolean> {
    const either = await loginCallback(this._httpClient, code);
    if (E.isLeft(either)) {
      return false;
    }

    const response = either.right;

    this._authAction.set({
      status: 'logged',
      user: response.loggedUser,
    });
    this._tokenManager.setToken(response.token);

    return true;
  }

  /** Logout the current user, and delete all his cached data */
  public async logout(): Promise<void> {
    const savedToken = this._tokenManager.getToken();
    const loggedUser = await firstValueFrom(this.loggedUser$);
    if (t.null.is(savedToken) || t.null.is(loggedUser)) {
      console.error("You're not logged");
      return;
    }

    this._tokenManager.setToken(null);
    this._authAction.set({
      status: 'logout',
    });

    await this._router.navigateByUrl('/login');
  }

  public async checkToken(): Promise<void> {
    console.log('Checking token...');
    // Avoid unnecessary requests to the backend
    const savedToken = this._tokenManager.getToken();

    if (isNull(savedToken)) {
      this._authAction.set({
        status: 'needs-login',
      });
      return;
    }

    const myUser = await getMyUser(this._httpClient);
    if (E.isLeft(myUser)) {
      console.error('Error fetching my user', myUser.left);
      this._authAction.set({
        status: 'needs-login',
      });
      return;
    }

    const user = myUser.right;
    this._authAction.set({
      status: 'logged',
      user,
    });
  }
}
