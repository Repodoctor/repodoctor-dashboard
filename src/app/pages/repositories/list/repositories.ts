import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CatalogApi } from '../../../api/catalog.api';
import type { Finding, Repository } from '../../../interfaces/api';
import { DataTableCellDirective } from '../../../components/data-table/data-table-cell.directive';
import { DataTableMobileDirective } from '../../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../../components/data-table/data-table';
import { PageHeaderComponent } from '../../../components/page-header/page-header';
import { repositoryColumns } from '../../../utils/data-table-columns';
import { categoryPath, findingCategory } from '../../../utils/finding-category';

@Component({
  selector: 'app-repositories-page',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    PageHeaderComponent,
    DataTableComponent,
    DataTableCellDirective,
    DataTableMobileDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repositories.html',
})
export class RepositoriesPage {
  private readonly catalog = inject(CatalogApi);
  private readonly router = inject(Router);
  readonly repositories = signal<Repository[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly loading = signal(true);
  readonly repoColumns = computed(() =>
    repositoryColumns(
      (id) => this.codeCount(id),
      (id) => this.supplyChainCount(id),
    ),
  );

  constructor() {
    void this.refresh();
  }

  openRepository(repo: Repository): void {
    void this.router.navigate(['/repositories', repo.id, 'overview'], {
      queryParams: { organizationId: repo.organizationId },
    });
  }

  codeCount(repositoryId: string): number {
    return this.findings().filter(
      (item) => item.repositoryId === repositoryId && findingCategory(item.source) === 'code',
    ).length;
  }

  supplyChainCount(repositoryId: string): number {
    return this.findings().filter(
      (item) => item.repositoryId === repositoryId && findingCategory(item.source) === 'supply-chain',
    ).length;
  }

  findingsLink(category: 'code' | 'supply-chain'): string[] {
    return [categoryPath(category)];
  }

  findingsQuery(repositoryId: string): { repositoryId: string } {
    return { repositoryId };
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
