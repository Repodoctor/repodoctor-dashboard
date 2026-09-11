import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CatalogApi } from '../../../api/catalog.api';
import type { Finding, Repository } from '../../../interfaces/api';
import { LoadingStateComponent } from '../../../components/loading-state/loading-state';
import { PageHeaderComponent } from '../../../components/page-header/page-header';
import { RepositoryTableComponent } from '../../../components/repository-table/repository-table';

@Component({
  selector: 'app-repositories-page',
  imports: [MatCardModule, LoadingStateComponent, PageHeaderComponent, RepositoryTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repositories.html',
})
export class RepositoriesPage {
  private readonly catalog = inject(CatalogApi);
  private readonly router = inject(Router);
  readonly repositories = signal<Repository[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.refresh();
  }

  openRepository(repo: Repository): void {
    void this.router.navigate(['/repositories', repo.id, 'overview'], {
      queryParams: { organizationId: repo.organizationId },
    });
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const [repositories, findings] = await Promise.all([
        this.catalog.listMyRepositories().catch(() => [] as Repository[]),
        this.catalog.listFindings().catch(() => [] as Finding[]),
      ]);
      this.repositories.set(repositories);
      this.findings.set(findings);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
