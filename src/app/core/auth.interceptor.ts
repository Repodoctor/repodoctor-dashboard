import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const gateway = environment.gatewayUrl.replace(/\/$/, '');
  const apiBase = environment.apiBaseUrl.replace(/\/$/, '');
  if (!req.url.startsWith(gateway) && !req.url.startsWith(apiBase)) {
    return next(req);
  }
  return from(inject(AuthService).getAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }
      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
