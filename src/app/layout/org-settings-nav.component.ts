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
        routerLinkActive="border-moss-400 text-moss-200"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Organization
      </a>
      <a
        class="rd-btn-ghost"
        [routerLink]="['/organizations', organizationId(), 'settings', 'members']"
        routerLinkActive="border-moss-400 text-moss-200"
      >
        Members
      </a>
      <a
        class="rd-btn-ghost"
        [routerLink]="['/organizations', organizationId(), 'settings', 'permissions']"
        routerLinkActive="border-moss-400 text-moss-200"
      >
        Permissions
      </a>
    </nav>
  `,
})
export class OrgSettingsNavComponent {
  readonly organizationId = input.required<string>();
}
