import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.pendingPassword()) {
    return router.parseUrl(auth.passwordSetupUrl());
  }
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};

export const guestGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.pendingPassword()) {
    if (auth.pendingPassword() === 'recovery' && state.url.startsWith('/reset-password')) {
      return true;
    }
    if (auth.pendingPassword() === 'invite' && state.url.startsWith('/signup')) {
      return true;
    }
    return router.parseUrl(auth.passwordSetupUrl());
  }
  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/dashboard');
};
