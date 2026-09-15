import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../stores/auth.store';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-auth-callback-page',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-callback.html',
})
export class AuthCallbackPage {
  private readonly auth = inject(AuthStore);
  private readonly workspaces = inject(WorkspaceStore);
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
        await this.workspaces.acceptInvite(invite);
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
