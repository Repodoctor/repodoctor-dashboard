import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-org-settings-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="flex flex-wrap gap-2">
      <a class="rd-btn-ghost" [routerLink]="['/organizations', organizationId()]">Overview</a>
      <a
        class="rd-btn-ghost"
        [routerLink]="['/organizations', organizationId(), 'settings']"
        routerLinkActive="border-pulse text-pulse"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Organization
      </a>
      <a
        class="rd-btn-ghost"
        [routerLink]="['/organizations', organizationId(), 'settings', 'integrations']"
        routerLinkActive="border-pulse text-pulse"
      >
        Integrations
      </a>
      <a
        class="rd-btn-ghost"
        [routerLink]="['/organizations', organizationId(), 'settings', 'members']"
        routerLinkActive="border-pulse text-pulse"
      >
        Members
      </a>
      <a
        class="rd-btn-ghost"
        [routerLink]="['/organizations', organizationId(), 'settings', 'permissions']"
        routerLinkActive="border-pulse text-pulse"
      >
        Permissions
      </a>
    </nav>
  `,
})
export class OrgSettingsNavComponent {
  readonly organizationId = input.required<string>();
}
