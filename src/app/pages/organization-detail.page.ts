import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-organization-detail-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading organization…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else if (org()) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization</p>
          <h1 class="text-3xl font-semibold">{{ org()!.name }}</h1>
          <p class="font-mono text-sm text-ink-200">{{ org()!.slug }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rd-card">
            <h2 class="font-medium">Repositories</h2>
            <p class="mt-2 text-sm text-ink-200">
              No repositories connected. GitHub App installation is implemented in a later phase.
            </p>
            <a class="rd-btn-ghost mt-4" [routerLink]="['/organizations', org()!.id, 'repositories']">
              View repositories
            </a>
          </div>
          <div class="rd-card">
            <h2 class="font-medium">Members</h2>
            <p class="mt-2 text-sm text-ink-200">
              You are an authorized member of this tenant. The gateway rejects requests for organizations you do not belong to.
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class OrganizationDetailPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly org = signal<Organization | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.error.set('Missing organization id');
      this.loading.set(false);
      return;
    }
    void this.auth
      .getOrganization(id)
      .then((org) => this.org.set(org))
      .catch((error) => this.error.set(errorMessage(error)))
      .finally(() => this.loading.set(false));
  }
}
