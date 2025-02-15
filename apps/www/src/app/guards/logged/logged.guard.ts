import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { AuthService } from '@www/app/services/auth';

@Injectable({
  providedIn: 'root',
})
export class LoggedGuard implements CanActivate {
  constructor(
    private readonly _authService: AuthService,
    private readonly _router: Router,
  ) {}

  /**
   * If the user is already logged, then redirect to the main page
   *
   * P.S: It's an validation to avoid the access to the `Login` page when already had logged
   */
  public canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this._authService.authAction$.pipe(
      filter(({ status }) => status !== 'undefined'),
      map(({ status }) => {
        // If the user is already logged redirect to the previous page
        return status === 'logged' ? this._router.createUrlTree(['/']) : true; // TODO: redirect to the route that she was trying to access
      }),
    );
  }
}
