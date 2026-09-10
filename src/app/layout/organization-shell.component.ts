import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import type { Organization } from '../core/models';
import { OrgSettingsNavComponent } from './org-settings-nav.component';
import { PageHeaderComponent } from '../ui/page-header.component';

@Component({
  selector: 'app-organization-shell',
  imports: [RouterOutlet, OrgSettingsNavComponent, PageHeaderComponent],
  template: `
    <div class="space-y-6">
      <app-page-header
        eyebrow="Organization"
        [title]="org()?.name ?? '…'"
        [subtitle]="(org()?.slug ?? '') + (org()?.role ? ' · ' + org()?.role : '')"
      />
      <app-org-settings-nav [organizationId]="organizationId" [role]="org()?.role" />
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
