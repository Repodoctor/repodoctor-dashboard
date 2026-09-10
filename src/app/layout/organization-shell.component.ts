import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import type { Organization } from '../core/models';
import { OrgSettingsNavComponent } from './org-settings-nav.component';

@Component({
  selector: 'app-organization-shell',
  imports: [RouterOutlet, OrgSettingsNavComponent],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization</p>
        <h1 class="text-3xl font-semibold">{{ org()?.name ?? '…' }}</h1>
        <p class="font-mono text-sm text-ink-200">
          {{ org()?.slug ?? '' }}
          @if (org()?.role) {
            <span> · {{ org()?.role }}</span>
          }
        </p>
      </div>
      <app-org-settings-nav [organizationId]="organizationId" />
      <router-outlet />
    </div>
  `,
})
export class OrganizationShellComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly org = signal<Organization | null>(null);

  constructor() {
    if (!this.organizationId) {
      this.toast.show('Missing organization id', 'error');
      return;
    }
    void this.auth
      .getOrganization(this.organizationId)
      .then((org) => this.org.set(org))
      .catch(() => undefined);
  }
}
