import { Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-org-settings-nav',
  imports: [RouterLink, MatTabsModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" [mat-stretch-tabs]="false" class="rd-org-tabs">
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId()]"
        [active]="isTab('overview')"
      >
        Overview
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings']"
        [active]="isTab('organization')"
      >
        Organization
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings', 'integrations']"
        [active]="isTab('integrations')"
      >
        Integrations
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings', 'members']"
        [active]="isTab('members')"
      >
        Members
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings', 'permissions']"
        [active]="isTab('permissions')"
      >
        Permissions
      </a>
    </nav>
    <mat-tab-nav-panel #panel />
  `,
})
export class OrgSettingsNavComponent {
  readonly organizationId = input.required<string>();
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  isTab(tab: 'overview' | 'organization' | 'integrations' | 'members' | 'permissions'): boolean {
    const path = (this.currentUrl() ?? '').split('?')[0];
    const base = `/organizations/${this.organizationId()}`;
    if (tab === 'overview') return path === base;
    if (tab === 'organization') return path === `${base}/settings`;
    return path === `${base}/settings/${tab}` || path.startsWith(`${base}/settings/${tab}/`);
  }
}
