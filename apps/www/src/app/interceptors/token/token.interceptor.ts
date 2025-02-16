import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenManagerService } from '@www/app/services/token-manager';

export const tokenInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenManagerService = inject(TokenManagerService);
  const requestWithToken = request.clone({
    setHeaders: {
      Authorization: `Bearer ${tokenManagerService.getToken()}`,
    },
  });
  return next(requestWithToken);
};
