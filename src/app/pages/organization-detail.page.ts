import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { CatalogService } from '../core/catalog.service';
import { ToastService } from '../core/toast.service';
import { scmProviderLabel, type ScmProviderName } from '../core/scm-providers';
import type { Finding, Organization, Repository, ScmInstallation } from '../core/models';
import { FindingTableComponent } from '../ui/finding-table.component';
import { LoadingStateComponent } from '../ui/loading-state.component';
import { RepositoryTableComponent } from '../ui/repository-table.component';

@Component({
  selector: 'app-organization-detail-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, FindingTableComponent, LoadingStateComponent, RepositoryTableComponent],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading overview…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (org(); as current) {
        <div class="grid gap-4 md:grid-cols-2">
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Source control</mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-2">
              @if (installations().length === 0) {
                <p class="text-sm text-ink-200">Not connected. Add a provider from Integrations.</p>
              } @else {
                @for (install of installations(); track install.id) {
                  <p class="text-sm text-ink-200">
                    {{ providerLabel(install.provider) }} as
                    <span class="font-mono text-moss-200">{{ install.accountLogin }}</span>
                  </p>
                }
              }
              <a mat-stroked-button [routerLink]="['/organizations', current.id, 'integrations']">Integrations</a>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Details</mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-2">
              <p class="text-sm text-ink-200">{{ current.name }}</p>
              <p class="font-mono text-xs text-ink-300">{{ current.slug }} · {{ current.role }}</p>
              <a mat-stroked-button [routerLink]="['/organizations', current.id, 'details']">Edit details</a>
            </mat-card-content>
          </mat-card>
        </div>
        <mat-card appearance="outlined">
          <mat-card-content>
            <div class="mb-4 flex items-center justify-between gap-3">
              <h2 class="text-lg font-medium">Repositories</h2>
              <a mat-stroked-button [routerLink]="['/organizations', current.id, 'repositories']">View all</a>
            </div>
            @if (repositories().length === 0) {
              <p class="text-sm text-ink-200">No repositories connected yet.</p>
            } @else {
              <app-repository-table [repositories]="repositories()" (rowClick)="openRepository($event)" />
            }
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Findings</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (findings().length === 0) {
              <p class="text-sm text-ink-200">No findings yet for this organization.</p>
            } @else {
              <app-finding-table [findings]="findings()" (rowClick)="openFinding($event)" />
            }
          </mat-card-content>
        </mat-card>
        }
      }
    </div>
  `,
})
export class OrganizationDetailPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly loading = signal(true);

  providerLabel(provider: ScmProviderName): string {
    return scmProviderLabel(provider);
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.toast.show('Missing organization id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  openRepository(repo: Repository): void {
    void this.router.navigate(['/repositories', repo.id, 'overview'], {
      queryParams: { organizationId: repo.organizationId },
    });
  }

  openFinding(finding: Finding): void {
    void this.router.navigate(['/repositories', finding.repositoryId, 'findings'], {
      queryParams: { organizationId: finding.organizationId },
    });
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, installations, repositories, findings] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
        this.catalog.listFindings(id).catch(() => [] as Finding[]),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.repositories.set(repositories);
      this.findings.set(findings);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
