import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ScmService } from '../../../services/scm.service';
import { CatalogApi } from '../../../api/catalog.api';
import { ToastService } from '../../../services/toast.service';
import { scmProviderLabel, type ScmProviderName } from '../../../utils/scm-providers';
import type { Finding, Workspace, Repository, ScmInstallation } from '../../../interfaces/api';
import { DataTableCellDirective } from '../../../components/data-table/data-table-cell.directive';
import { DataTableMobileDirective } from '../../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../../components/data-table/data-table';
import { SkeletonComponent } from '../../../components/skeleton/skeleton';
import { findingColumns, repositoryColumns } from '../../../utils/data-table-columns';
import { categoryPath, findingCategory } from '../../../utils/finding-category';

@Component({
  selector: 'app-workspace-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    DataTableComponent,
    DataTableCellDirective,
    DataTableMobileDirective,
    SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-detail.html',
})
export class WorkspaceDetailPage {
  private readonly workspaces = inject(WorkspaceStore);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly org = signal<Workspace | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly repositoryNames = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly repoColumns = computed(() =>
    repositoryColumns(
      (id) => this.codeCount(id),
      (id) => this.supplyChainCount(id),
    ),
  );
  readonly findingCols = computed(() => findingColumns((finding) => this.repoName(finding)));

  providerLabel(provider: ScmProviderName): string {
    return scmProviderLabel(provider);
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('workspaceId');
    if (!id) {
      this.toast.show('Missing workspace id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  repoName(finding: Finding): string {
    return this.repositoryNames()[finding.repositoryId] ?? finding.repositoryId;
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

  openRepository(repo: Repository): void {
    void this.router.navigate(['/repositories', repo.id, 'overview'], {
      queryParams: { workspaceId: repo.workspaceId },
    });
  }

  openFinding(finding: Finding): void {
    void this.router.navigate(['/repositories', finding.repositoryId, 'findings'], {
      queryParams: { workspaceId: finding.workspaceId },
    });
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, installations, repositories, findings] = await Promise.all([
        this.workspaces.get(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
        this.catalog.listFindings(id).catch(() => [] as Finding[]),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.repositories.set(repositories);
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
