import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../../stores/organization.store';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ScmService } from '../../../services/scm.service';
import { CatalogApi } from '../../../api/catalog.api';
import { ToastService } from '../../../services/toast.service';
import { scmProviderLabel, type ScmProviderName } from '../../../utils/scm-providers';
import type { Finding, Organization, Repository, ScmInstallation } from '../../../interfaces/api';
import { FindingTableComponent } from '../../../components/finding-table/finding-table';
import { LoadingStateComponent } from '../../../components/loading-state/loading-state';
import { RepositoryTableComponent } from '../../../components/repository-table/repository-table';

@Component({
  selector: 'app-organization-detail-page',
  imports: [MatCardModule, FindingTableComponent, LoadingStateComponent, RepositoryTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-detail.html',
})
export class OrganizationDetailPage {
  private readonly organizations = inject(OrganizationStore);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogApi);
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
        this.organizations.get(id),
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
