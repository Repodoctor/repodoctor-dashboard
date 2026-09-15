import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../stores/organization.store';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CatalogApi } from '../../api/catalog.api';
import { AuthStore } from '../../stores/auth.store';
import type { Finding, Organization } from '../../interfaces/api';
import { DataTableMobileDirective } from '../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../components/data-table/data-table';
import { SkeletonComponent } from '../../components/skeleton/skeleton';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { findingColumns, organizationColumns } from '../../utils/data-table-columns';
import { findingCategory } from '../../utils/finding-category';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    DataTableComponent,
    DataTableMobileDirective,
    SkeletonComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly auth = inject(AuthStore);
  private readonly organizationStore = inject(OrganizationStore);
  private readonly catalog = inject(CatalogApi);
  private readonly router = inject(Router);
  readonly organizations = signal<Organization[]>([]);
  readonly repositoryCount = signal(0);
  readonly findings = signal<Finding[]>([]);
  readonly repositoryNames = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly orgColumns = organizationColumns();
  readonly findingCols = computed(() => findingColumns((finding) => this.repoName(finding)));
  readonly openFindings = () => this.findings().filter((item) => item.status === 'OPEN');
  readonly codeFindings = () =>
    this.openFindings().filter((item) => findingCategory(item.source) === 'code');
  readonly secretFindings = () =>
    this.openFindings().filter((item) => findingCategory(item.source) === 'secrets');
  readonly supplyChainFindings = () =>
    this.openFindings().filter((item) => findingCategory(item.source) === 'supply-chain');

  constructor() {
    void this.refresh();
  }

  repoName(finding: Finding): string {
    return this.repositoryNames()[finding.repositoryId] ?? finding.repositoryId;
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
        this.organizationStore.listAll(),
        this.catalog.listMyRepositories().catch(() => []),
        this.catalog.listFindings().catch(() => []),
      ]);
      this.organizations.set(organizations);
      this.repositoryCount.set(repositories.length);
      this.findings.set(findings);
      const names: Record<string, string> = {};
      for (const repo of repositories) names[repo.id] = repo.fullName;
      this.repositoryNames.set(names);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
