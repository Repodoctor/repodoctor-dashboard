import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-auth-callback-page',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <mat-progress-spinner diameter="40" mode="indeterminate" />
      <p class="text-sm text-ink-200">Finishing sign-in…</p>
    </div>
  `,
})
export class AuthCallbackPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  readonly failed = signal(false);

  constructor() {
    void this.finish();
  }

  private async finish(): Promise<void> {
    await this.auth.waitForSession();
    if (this.auth.pendingPassword()) {
      await this.router.navigateByUrl(this.auth.passwordSetupUrl());
      return;
    }
    if (!this.auth.isAuthenticated()) {
      this.toast.show('GitHub sign-in did not complete.', 'error');
      await this.router.navigateByUrl('/login');
      return;
    }
    await this.auth.loadProfile().catch(() => undefined);
    const invite =
      this.route.snapshot.queryParamMap.get('invite') ?? this.auth.pendingInviteToken();
    if (invite) {
      try {
        await this.auth.acceptInvite(invite);
        this.auth.clearPendingInvite();
      } catch {
        this.toast.show('Signed in, but this invite belongs to a different email address.', 'error');
      }
    }
    const next = this.route.snapshot.queryParamMap.get('next');
    await this.router.navigateByUrl(safeNext(next));
  }
}

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return '/dashboard';
  }
  return raw;
}
