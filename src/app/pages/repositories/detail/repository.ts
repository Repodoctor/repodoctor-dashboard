import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { map } from 'rxjs';
import { CatalogApi } from '../../../api/catalog.api';
import { ToastService } from '../../../services/toast.service';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from '../../../interfaces/api';
import { DataTableCellDirective } from '../../../components/data-table/data-table-cell.directive';
import { DataTableMobileDirective } from '../../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../../components/data-table/data-table';
import type { DataTableColumn } from '../../../components/data-table/data-table.types';
import { SkeletonComponent } from '../../../components/skeleton/skeleton';
import { findingColumns } from '../../../utils/data-table-columns';

const NAV = ['overview', 'findings', 'analysis', 'settings'] as const;

const PERMISSIONS = ['NONE', 'VIEW', 'ANALYZE', 'MANAGE', 'ADMIN'] as const;
const PERMISSION_RANK: Record<(typeof PERMISSIONS)[number], number> = {
  NONE: -1,
  VIEW: 0,
  ANALYZE: 1,
  MANAGE: 2,
  ADMIN: 3,
};

@Component({
  selector: 'app-repository-page',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    SkeletonComponent,
    DataTableComponent,
    DataTableCellDirective,
    DataTableMobileDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repository.html',
})
export class RepositoryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(ToastService);

  readonly nav = NAV;
  readonly repositoryId = this.route.snapshot.paramMap.get('repositoryId') ?? '';
  readonly section = toSignal(this.route.paramMap.pipe(map((params) => params.get('section') ?? 'overview')), {
    initialValue: this.route.snapshot.paramMap.get('section') ?? 'overview',
  });

  readonly repository = signal<Repository | null>(null);
  readonly analyses = signal<AnalysisRun[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly access = signal<RepositoryAccessGrant[]>([]);
  readonly loading = signal(true);
  readonly requesting = signal(false);
  readonly permissions = PERMISSIONS;
  readonly findingCols = computed(() =>
    findingColumns((finding) => this.repository()?.fullName ?? finding.repositoryId),
  );

  readonly analysisColumns = computed<DataTableColumn<AnalysisRun>[]>(() => [
    { key: 'type', header: 'Type', value: (run) => run.type, mobile: 'title' },
    { key: 'status', header: 'Status', value: (run) => run.status, mobile: 'title' },
    {
      key: 'detail',
      header: 'Detail',
      type: 'mono',
      value: (run) => `${run.trigger} · ${run.commitSha.slice(0, 7)} · ${run.branch}`,
      sortValue: (run) => `${run.trigger} ${run.commitSha} ${run.branch}`,
      mobile: 'detail',
    },
    {
      key: 'created',
      header: 'Created',
      type: 'mono',
      value: (run) => run.createdAt,
      mobile: 'detail',
    },
  ]);

  readonly accessColumns = computed<DataTableColumn<RepositoryAccessGrant>[]>(() => [
    {
      key: 'name',
      header: 'Name',
      value: (grant) => grant.displayName,
      mobile: 'title',
    },
    {
      key: 'email',
      header: 'Email',
      type: 'mono',
      value: (grant) => `${grant.email} · ${grant.role}`,
      sortValue: (grant) => `${grant.email} ${grant.role}`,
      mobile: 'meta',
    },
    {
      key: 'permission',
      header: 'Permission',
      type: 'custom',
      sortValue: (grant) => grant.permission,
      mobile: false,
    },
  ]);

  readonly openFindings = computed(() => this.findings().filter((item) => item.status === 'OPEN'));
  readonly seriousFindings = computed(() =>
    this.findings().filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH'),
  );
  readonly latestAnalysis = computed(() => this.analyses()[0] ?? null);
  readonly knownSection = computed(() => {
    const value = this.section() ?? 'overview';
    return (NAV as readonly string[]).includes(value) ? value : 'overview';
  });
  readonly canAnalyze = () => {
    const permission = this.repository()?.permission;
    return permission ? PERMISSION_RANK[permission] >= PERMISSION_RANK.ANALYZE : false;
  };
  readonly canAdminRepo = () => this.repository()?.permission === 'ADMIN';

  readonly trackAccess = (grant: RepositoryAccessGrant) => grant.userId;

  constructor() {
    void this.load();
  }

  async changeAccess(grant: RepositoryAccessGrant, permission: RepositoryAccessGrant['permission']): Promise<void> {
    const repo = this.repository();
    if (!repo) return;
    try {
      const updated = await this.catalog.updateRepositoryAccess(repo.id, grant.userId, permission, repo.workspaceId);
      this.access.set(this.access().map((item) => (item.userId === updated.userId ? updated : item)));
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }

  async requestAnalysis(): Promise<void> {
    const repo = this.repository();
    if (!repo) return;
    this.requesting.set(true);
    try {
      const latest = this.latestAnalysis();
      const run = await this.catalog.requestAnalysis(repo.id, repo.workspaceId, {
        commitSha: latest?.commitSha ?? '0000000',
        branch: repo.defaultBranch,
      });
      this.analyses.set([run, ...this.analyses().filter((item) => item.id !== run.id)]);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.requesting.set(false);
    }
  }

  private async load(): Promise<void> {
    if (!this.repositoryId) {
      this.toast.show('Missing repository id', 'error');
      this.loading.set(false);
      return;
    }
    try {
      const workspaceId = this.route.snapshot.queryParamMap.get('workspaceId') ?? undefined;
      const repo = await this.catalog.getRepository(this.repositoryId, workspaceId);
      this.repository.set(repo);
      const [analyses, findings, access] = await Promise.all([
        this.catalog.listAnalysis(repo.workspaceId, repo.id),
        this.catalog.listFindings(repo.workspaceId, repo.id).catch(() => [] as Finding[]),
        repo.permission === 'ADMIN'
          ? this.catalog.listRepositoryAccess(repo.id, repo.workspaceId).catch(() => [] as RepositoryAccessGrant[])
          : Promise.resolve([] as RepositoryAccessGrant[]),
      ]);
      this.analyses.set(analyses);
      this.findings.set(findings);
      this.access.set(access);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
