/* eslint-disable @typescript-eslint/promise-function-async */
import { isAuthenticatedGuard } from '@www/app/guards/auth';
import { LoggedGuard } from '@www/app/guards/logged';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
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

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes)],
})
export class AppRoutingModule {}
