import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/error-message';
import type { Organization, ScmInstallation } from '../core/models';

@Component({
  selector: 'app-github-callback-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      @if (error()) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Source control</p>
          <h1 class="text-3xl font-semibold">GitHub App</h1>
        </div>
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
        <a routerLink="/organizations" class="rd-btn-ghost">Back to organizations</a>
      } @else if (needsOrg()) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Source control</p>
          <h1 class="text-3xl font-semibold">GitHub App</h1>
        </div>
        <div class="rd-card space-y-3">
          <p>Choose the organization that should own this GitHub installation.</p>
          @for (org of organizations(); track org.id) {
            <button class="rd-btn-ghost w-full justify-start" type="button" [disabled]="saving()" (click)="complete(org.id)">
              {{ org.name }}
              <span class="ml-2 font-mono text-xs text-ink-200">{{ org.slug }}</span>
            </button>
          }
        </div>
      } @else {
        <div class="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <div class="rd-spinner" role="status" aria-label="Connecting GitHub"></div>
          <h1 class="text-2xl font-semibold">Connecting GitHub</h1>
          <p class="max-w-sm text-sm text-ink-200">
            Fetching repositories from GitHub. Keep this window open until it closes.
          </p>
        </div>
      }
    </div>
  `,
})
export class GithubCallbackPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);

  readonly organizations = signal<Organization[]>([]);
  readonly needsOrg = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.start();
  }

  private provider(): ScmInstallation['provider'] {
    const value = this.route.snapshot.paramMap.get('provider');
    if (value === 'gitlab' || value === 'bitbucket' || value === 'azure_devops') {
      return value;
    }
    return 'github';
  }

  async complete(organizationId: string): Promise<void> {
    const installationId = this.route.snapshot.queryParamMap.get('installation_id');
    if (!installationId) {
      this.error.set('GitHub did not return an installation id.');
      return;
    }
    this.needsOrg.set(false);
    this.saving.set(true);
    this.error.set(null);
    try {
      const result = await this.scm.connect(organizationId, this.provider(), installationId);
      this.scm.clearPendingOrganization();
      const count = result.repositories.length;
      this.toast.show(
        count === 1 ? 'Connected 1 repository from GitHub.' : `Connected ${count} repositories from GitHub.`,
        'success',
      );
      await this.finishConnect(organizationId);
    } catch (error) {
      this.error.set(errorMessage(error, 'Unable to connect the GitHub App installation.'));
    } finally {
      this.saving.set(false);
    }
  }

  private async finishConnect(organizationId: string): Promise<void> {
    const path = `/organizations/${organizationId}/repositories`;
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.assign(path);
        window.close();
        return;
      } catch {
        // Fall through to in-tab navigation when the opener cannot be reached.
      }
    }
    await this.router.navigate(['/organizations', organizationId, 'repositories']);
  }

  private async start(): Promise<void> {
    const installationId = this.route.snapshot.queryParamMap.get('installation_id');
    if (!installationId) {
      this.error.set('Missing GitHub installation id. Install the app from an organization page.');
      return;
    }
    const fromState = this.scm.organizationIdFromState(this.route.snapshot.queryParamMap.get('state'));
    const organizationId = fromState ?? this.scm.readPendingOrganization();
    if (organizationId) {
      await this.complete(organizationId);
      return;
    }
    try {
      const items = await this.auth.listOrganizations();
      this.organizations.set(items);
      if (items.length === 1) {
        await this.complete(items[0]!.id);
        return;
      }
      if (items.length === 0) {
        this.error.set('Create an organization before connecting GitHub.');
        return;
      }
      this.needsOrg.set(true);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
