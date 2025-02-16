/* eslint-disable @typescript-eslint/promise-function-async */
import { isAuthenticatedGuard } from '@www/app/guards/auth.guard';
import { LoggedGuard } from '@www/app/guards/logged.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
  // * Redirects
  {
    path: '',
    pathMatch: 'full',
    canActivate: [isAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then(({ HomePageComponent }) => HomePageComponent),
  },
  // * Auth Pages
  {
    canActivate: [LoggedGuard],
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then(({ LoginPageComponent }) => LoginPageComponent),
    path: 'login',
  },
  {
    canActivate: [LoggedGuard],
    loadComponent: () =>
      import('./pages/callback-login-page/callback-login-page.component').then(
        ({ CallbackLoginPageComponent }) => CallbackLoginPageComponent,
      ),
    path: 'login/callback',
  },
  {
    canActivate: [LoggedGuard],
    loadComponent: () =>
      import('./pages/register-page/register-page.component').then(
        ({ RegisterPageComponent }) => RegisterPageComponent,
      ),
    path: 'register',
  },
  {
    canActivate: [isAuthenticatedGuard],
    loadComponent: () =>
      import('./pages/logout-page/logout-page.component').then(({ LogoutPageComponent }) => LogoutPageComponent),
    path: 'logout',
  },
  // * Not found page (should be the last one)
  {
    loadComponent: () =>
      import('./pages/not-found-page/not-found-page.component').then(
        ({ NotFoundPageComponent }) => NotFoundPageComponent,
      ),
    path: '**',
  },
];
