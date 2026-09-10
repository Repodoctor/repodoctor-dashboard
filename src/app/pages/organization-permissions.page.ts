import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import type { Organization, Repository } from '../core/models';
import { LoadingStateComponent } from '../ui/loading-state.component';
import { RepositoryTableComponent } from '../ui/repository-table.component';

@Component({
  selector: 'app-organization-permissions-page',
  imports: [OrgSettingsNavComponent, MatCardModule, LoadingStateComponent, RepositoryTableComponent],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading permissions…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (org(); as current) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Repository permissions</p>
          <h1 class="text-3xl font-semibold">{{ current.name }}</h1>
          <p class="text-sm text-ink-200">
            Defaults come from org role (VIEWER=VIEW, MEMBER=ANALYZE, ADMIN/OWNER=ADMIN). Per-repo overrides live on each repository.
          </p>
        </div>
        <app-org-settings-nav [organizationId]="current.id" />
        <mat-card appearance="outlined">
          <mat-card-content>
            @if (repositories().length === 0) {
              <p class="text-sm text-ink-200">No repositories yet. Connect a provider from Integrations.</p>
            } @else {
              <app-repository-table [repositories]="repositories()" (rowClick)="openRepo($event)" />
            }
          </mat-card-content>
        </mat-card>
        }
      }
    </div>
  `,
})
export class OrganizationPermissionsPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly org = signal<Organization | null>(null);
  readonly repositories = signal<Repository[]>([]);
  readonly loading = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.toast.show('Missing organization id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  openRepo(repo: Repository): void {
    const section = repo.permission === 'ADMIN' ? 'settings' : 'overview';
    void this.router.navigate(['/repositories', repo.id, section], {
      queryParams: { organizationId: repo.organizationId },
    });
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, repositories] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
      ]);
      this.org.set(org);
      this.repositories.set(repositories);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
