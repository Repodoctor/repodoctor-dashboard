import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { filter, map, startWith } from 'rxjs';
import { isOrgAdmin } from '../core/org-role';
import type { OrganizationRole } from '../core/org-role';

@Component({
  selector: 'app-org-settings-nav',
  imports: [RouterLink, MatTabsModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" [mat-stretch-tabs]="false" class="rd-org-tabs">
      @for (tab of tabs(); track tab.id) {
        <a
          mat-tab-link
          [routerLink]="tab.id === 'overview' ? ['/organizations', organizationId()] : ['/organizations', organizationId(), tab.id]"
          [active]="isTab(tab.id)"
        >
          {{ tab.label }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #panel />
  `,
})
export class OrgSettingsNavComponent {
  readonly organizationId = input.required<string>();
  readonly role = input<OrganizationRole | string | null | undefined>(null);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly tabs = computed(() => {
    const admin = isOrgAdmin(this.role());
    const items: { id: 'overview' | 'details' | 'integrations' | 'members' | 'permissions'; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'details', label: 'Details' },
    ];
    if (admin) items.push({ id: 'integrations', label: 'Integrations' });
    items.push({ id: 'members', label: 'Members' });
    if (admin) items.push({ id: 'permissions', label: 'Permissions' });
    return items;
  });

  isTab(tab: 'overview' | 'details' | 'integrations' | 'members' | 'permissions'): boolean {
    const path = (this.currentUrl() ?? '').split('?')[0];
    const base = `/organizations/${this.organizationId()}`;
    if (tab === 'overview') return path === base;
    return path === `${base}/${tab}` || path.startsWith(`${base}/${tab}/`);
  }
}
