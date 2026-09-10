import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

function isPasswordSetupUrl(url: string): boolean {
  return url.startsWith('/set-password') || url.startsWith('/reset-password');
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.pendingPassword()) {
    return isPasswordSetupUrl(state.url) ? true : router.parseUrl(auth.passwordSetupUrl());
  }
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};

export const guestGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.pendingPassword()) {
    return isPasswordSetupUrl(state.url) ? true : router.parseUrl(auth.passwordSetupUrl());
  }
  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/dashboard');
};
