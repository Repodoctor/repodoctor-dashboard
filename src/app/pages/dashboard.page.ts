import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../core/auth.service';
import { CatalogService } from '../core/catalog.service';
import type { Finding, Organization } from '../core/models';
import { FindingTableComponent } from '../ui/finding-table.component';
import { LoadingStateComponent } from '../ui/loading-state.component';
import { OrganizationTableComponent } from '../ui/organization-table.component';
import { PageHeaderComponent } from '../ui/page-header.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    FindingTableComponent,
    LoadingStateComponent,
    OrganizationTableComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header eyebrow="Overview" [title]="'Welcome back' + (auth.user() ? ', ' + auth.user()!.displayName : '')" />
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading organizations…" />
          </mat-card-content>
        </mat-card>
      } @else if (organizations().length === 0) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <h2 class="text-lg font-medium">No organizations yet</h2>
            <p class="mt-2 text-sm text-ink-200">Create an organization to start connecting repositories.</p>
            <a mat-flat-button class="mt-4" routerLink="/organizations">Create organization</a>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="grid gap-4 md:grid-cols-3">
          <mat-card appearance="outlined">
            <mat-card-content>
              <p class="text-xs uppercase text-ink-200">Organizations</p>
              <p class="mt-2 font-mono text-3xl text-moss-300">{{ organizations().length }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-content>
              <p class="text-xs uppercase text-ink-200">Repositories</p>
              <p class="mt-2 font-mono text-3xl text-moss-300">{{ repositoryCount() }}</p>
              <p class="mt-2 text-xs text-ink-300">Connected through GitHub App ingestion.</p>
            </mat-card-content>
          </mat-card>
          <mat-card appearance="outlined">
            <mat-card-content>
              <p class="text-xs uppercase text-ink-200">Open findings</p>
              <p class="mt-2 font-mono text-3xl text-moss-300">{{ openFindings().length }}</p>
              <p class="mt-2 text-xs text-ink-300">Across every organization you can access.</p>
            </mat-card-content>
          </mat-card>
        </div>
        @if (findings().length > 0) {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Organization findings</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <app-finding-table [findings]="findings()" (rowClick)="openFinding($event)" />
            </mat-card-content>
          </mat-card>
        }
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Your organizations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-organization-table [organizations]="organizations()" (rowClick)="openOrganization($event)" />
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class DashboardPage {
  readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  readonly organizations = signal<Organization[]>([]);
  readonly repositoryCount = signal(0);
  readonly findings = signal<Finding[]>([]);
  readonly loading = signal(true);
  readonly openFindings = () => this.findings().filter((item) => item.status === 'OPEN');

  constructor() {
    void this.refresh();
  }

  openOrganization(org: Organization): void {
    void this.router.navigate(['/organizations', org.id]);
  }

  openFinding(finding: Finding): void {
    void this.router.navigate(['/repositories', finding.repositoryId, 'findings'], {
      queryParams: { organizationId: finding.organizationId },
    });
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const [organizations, repositories, findings] = await Promise.all([
        this.auth.listOrganizations(),
        this.catalog.listMyRepositories().catch(() => []),
        this.catalog.listFindings().catch(() => []),
      ]);
      this.organizations.set(organizations);
      this.repositoryCount.set(repositories.length);
      this.findings.set(findings);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
