import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/error-message';
import { scmProviderLabel, type ScmProviderName } from '../core/scm-providers';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-scm-callback-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      @if (error()) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Source control</p>
          <h1 class="text-3xl font-semibold">{{ label() }}</h1>
        </div>
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
        <a routerLink="/organizations" class="rd-btn-ghost">Back to organizations</a>
      } @else if (needsOrg()) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Source control</p>
          <h1 class="text-3xl font-semibold">{{ label() }}</h1>
        </div>
        <div class="rd-card space-y-3">
          <p>Choose the organization that should own this installation.</p>
          @for (org of organizations(); track org.id) {
            <button class="rd-btn-ghost w-full justify-start" type="button" [disabled]="saving()" (click)="complete(org.id)">
              {{ org.name }}
              <span class="ml-2 font-mono text-xs text-ink-200">{{ org.slug }}</span>
            </button>
          }
        </div>
      } @else {
        <div class="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <div class="rd-spinner" role="status" [attr.aria-label]="'Connecting ' + label()"></div>
          <h1 class="text-2xl font-semibold">Connecting {{ label() }}</h1>
          <p class="max-w-sm text-sm text-ink-200">
            Fetching repositories. Keep this window open until it closes.
          </p>
        </div>
      }
    </div>
  `,
})
export class ScmCallbackPage {
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

  private callbackQuery(): Record<string, string | null> {
    const query: Record<string, string | null> = {};
    this.route.snapshot.queryParamMap.keys.forEach((key) => {
      query[key] = this.route.snapshot.queryParamMap.get(key);
    });
    return query;
  }

  async complete(organizationId: string): Promise<void> {
    this.needsOrg.set(false);
    this.saving.set(true);
    this.error.set(null);
    try {
      const result = await this.scm.connect(organizationId, this.provider(), { callback: this.callbackQuery() });
      this.scm.clearPendingOrganization();
      const count = result.repositories.length;
      this.toast.show(
        count === 1
          ? `Connected 1 repository from ${this.label()}.`
          : `Connected ${count} repositories from ${this.label()}.`,
        'success',
      );
      await this.finishConnect(organizationId);
    } catch (error) {
      this.error.set(errorMessage(error, `Unable to connect ${this.label()}.`));
    } finally {
      this.saving.set(false);
    }
  }

  private async finishConnect(organizationId: string): Promise<void> {
    const path = `/organizations/${organizationId}/settings/integrations`;
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.assign(path);
        window.close();
        return;
      } catch {
        // Fall through to in-tab navigation when the opener cannot be reached.
      }
    }
    await this.router.navigate(['/organizations', organizationId, 'settings', 'integrations']);
  }

  private async start(): Promise<void> {
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
        this.error.set('Create an organization before connecting source control.');
        return;
      }
      this.needsOrg.set(true);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
