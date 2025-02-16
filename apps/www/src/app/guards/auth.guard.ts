import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '@www/app/services/auth.service';

/**
 * If the user have a subscription, keep navigating to the page that the he wants
 */
export const isAuthenticatedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authAction$.pipe(
    filter(({ status }) => {
      return status !== 'undefined';
    }),
    map(({ status }) => {
      return status === 'logged' ? true : router.createUrlTree(['/login']);
    }),
  );
};
