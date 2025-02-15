import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { isNull } from '@utils';
import { loginCallback } from '@www/app/endpoints/login-callback';
import { loginUser } from '@www/app/endpoints/login-user';
import { LoginStatus } from '@www/app/interfaces/auth';
import { TokenManagerService } from '@www/app/services/token-manager';
import { environment } from '@www/environments/environment';
import * as t from 'io-ts';
import * as E from 'fp-ts/es6/Either';
import { distinctUntilChanged, filter, firstValueFrom, map, shareReplay } from 'rxjs';
import { getMyUser } from '@www/app/endpoints/get-my-user';

const GOOGLE_VERIFIER_KEY = 'googleVerifier';
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

  /**
   * The Register & Login are done in the same endpoint
   */
  public async login(): Promise<boolean> {
    const userEither = await loginUser(this._httpClient, this._baseURL);

    if (E.isLeft(userEither)) {
      return false;
    }

    const data = userEither.right;
    localStorage.setItem(GOOGLE_VERIFIER_KEY, data.verifier);
    window.location.href = data.url;

    return true;
  }

  public async handleLoginCallback(code: string, state: string): Promise<boolean> {
    const verifier = localStorage.getItem(GOOGLE_VERIFIER_KEY);
    if (!verifier) {
      console.error('Missing verifier');
      return false;
    }
    localStorage.removeItem(GOOGLE_VERIFIER_KEY);
    const either = await loginCallback(this._httpClient, this._baseURL, code, state, verifier);
    if (E.isLeft(either)) {
      return false;
    }

    const response = either.right;

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
    // Avoid unnecessary requests to the backend
    const savedToken = this._tokenManager.getToken();
    if (isNull(savedToken)) {
      return;
    }

    const myUser = await getMyUser(this._httpClient, this._baseURL);
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
