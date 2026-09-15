import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../stores/auth.store';
import { ScmService } from '../../../services/scm.service';
import { ToastService } from '../../../services/toast.service';
import { scmProviderLabel, type ScmProviderName } from '../../../utils/scm-providers';

@Component({
  selector: 'app-scm-install-page',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scm-install.html',
})
export class ScmInstallPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthStore);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);

  readonly failed = signal(false);

  constructor() {
    window.name = 'repodoctor-scm-install';
    void this.redirect();
  }

  label(): string {
    return scmProviderLabel(this.provider());
  }

  private provider(): ScmProviderName {
    const value = this.route.snapshot.paramMap.get('provider');
    if (value === 'gitlab' || value === 'bitbucket' || value === 'azure_devops') {
      return value;
    }
    return 'github';
  }

  private async redirect(): Promise<void> {
    const ready = await this.auth.waitForSession();
    if (!ready) {
      this.failed.set(true);
      this.toast.show('Sign in again, then reconnect GitHub.', 'error');
      return;
    }
    const workspaceId =
      this.route.snapshot.queryParamMap.get('workspaceId') ?? this.scm.readPendingWorkspace();
    if (!workspaceId) {
      this.failed.set(true);
      this.toast.show('Missing workspace for this GitHub install.', 'error');
      return;
    }
    this.scm.rememberWorkspace(workspaceId);
    const externalInstallationId =
      this.route.snapshot.queryParamMap.get('externalInstallationId') ?? undefined;
    try {
      const { url } = await this.scm.getInstallUrl(workspaceId, this.provider(), externalInstallationId);
      window.location.replace(url);
    } catch {
      this.failed.set(true);
    }
  }
}
