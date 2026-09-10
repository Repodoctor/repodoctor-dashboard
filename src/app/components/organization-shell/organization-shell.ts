import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { OrganizationStore } from '../../stores/organization.store';
import { ToastService } from '../../services/toast.service';
import { OrgSettingsNavComponent } from '../org-settings-nav/org-settings-nav';
import { PageHeaderComponent } from '../page-header/page-header';

@Component({
  selector: 'app-organization-shell',
  imports: [RouterOutlet, OrgSettingsNavComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-shell.html',
})
export class OrganizationShellComponent {
  private readonly organizations = inject(OrganizationStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly org = this.organizations.current;

  constructor() {
    if (!this.organizationId) {
      this.toast.show('Missing organization id', 'error');
      return;
    }
    void this.organizations.get(this.organizationId).catch(() => undefined);
  }
}
