import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-org-settings-nav',
  imports: [RouterLink, RouterLinkActive, MatTabsModule],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" mat-stretch-tabs="false">
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId()]"
        routerLinkActive
        #overviewTab="routerLinkActive"
        [active]="overviewTab.isActive"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Overview
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings']"
        routerLinkActive
        #orgTab="routerLinkActive"
        [active]="orgTab.isActive"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Organization
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings', 'integrations']"
        routerLinkActive
        #integrationsTab="routerLinkActive"
        [active]="integrationsTab.isActive"
      >
        Integrations
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings', 'members']"
        routerLinkActive
        #membersTab="routerLinkActive"
        [active]="membersTab.isActive"
      >
        Members
      </a>
      <a
        mat-tab-link
        [routerLink]="['/organizations', organizationId(), 'settings', 'permissions']"
        routerLinkActive
        #permissionsTab="routerLinkActive"
        [active]="permissionsTab.isActive"
      >
        Permissions
      </a>
    </nav>
    <mat-tab-nav-panel #panel />
  `,
})
export class OrgSettingsNavComponent {
  readonly organizationId = input.required<string>();
}
