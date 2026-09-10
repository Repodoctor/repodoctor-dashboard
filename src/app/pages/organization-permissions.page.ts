import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { errorMessage } from '../core/error-message';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import type { Organization, Repository } from '../core/models';

@Component({
  selector: 'app-organization-permissions-page',
  imports: [RouterLink, OrgSettingsNavComponent],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading permissions…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
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
        <div class="rd-card space-y-3">
          @if (repositories().length === 0) {
            <p class="text-sm text-ink-200">No repositories yet. Connect a provider from Integrations.</p>
          } @else {
            @for (repo of repositories(); track repo.id) {
              <div class="flex items-center justify-between gap-3 rounded-md border border-ink-400 px-3 py-2">
                <div>
                  <p class="font-medium">{{ repo.fullName }}</p>
                  <p class="font-mono text-xs text-ink-200">Your access · {{ repo.permission ?? 'VIEW' }}</p>
                </div>
                <a
                  class="rd-btn-ghost"
                  [routerLink]="['/repositories', repo.id, 'settings']"
                  [queryParams]="{ organizationId: repo.organizationId }"
                >
                  {{ canAdminRepo(repo) ? 'Manage access' : 'View' }}
                </a>
              </div>
            }
          }
        </div>
        }
      }
    </div>
  `,
})
export class OrganizationPermissionsPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly route = inject(ActivatedRoute);

  readonly org = signal<Organization | null>(null);
  readonly repositories = signal<Repository[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.error.set('Missing organization id');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  canAdminRepo(repo: Repository): boolean {
    return repo.permission === 'ADMIN';
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, repositories] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
      ]);
      this.org.set(org);
      this.repositories.set(repositories);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
