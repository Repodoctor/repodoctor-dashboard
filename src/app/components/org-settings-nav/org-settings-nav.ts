import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { filter, map, startWith } from 'rxjs';
import { isOrgAdmin } from '../../utils/org-role';
import type { OrganizationRole } from '../../utils/org-role';

@Component({
  selector: 'app-org-settings-nav',
  imports: [RouterLink, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './org-settings-nav.html',
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
      { id: 'integrations', label: 'Integrations' },
      { id: 'members', label: 'Members' },
    ];
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
