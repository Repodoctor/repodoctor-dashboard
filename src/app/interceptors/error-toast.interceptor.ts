import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { errorMessage } from '../utils/error-message';
import { ToastService } from '../services/toast.service';

function isGatewayRequest(url: string): boolean {
  const gateway = environment.gatewayUrl.replace(/\/$/, '');
  const apiBase = environment.apiBaseUrl.replace(/\/$/, '');
  return url.startsWith(gateway) || url.startsWith(apiBase);
}

/** Surface gateway failures (including "Cannot reach the RepoDoctor gateway") as toasts. */
export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isGatewayRequest(req.url)) {
    return next(req);
  }
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: unknown) => {
      toast.show(errorMessage(error), 'error');
      return throwError(() => error);
    }),
  );
};
