import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { map } from 'rxjs';
import { CatalogApi } from '../../../api/catalog.api';
import { ToastService } from '../../../services/toast.service';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from '../../../interfaces/api';
import { FindingTableComponent } from '../../../components/finding-table/finding-table';
import { LoadingStateComponent } from '../../../components/loading-state/loading-state';
import { TableSearchComponent } from '../../../components/table-search/table-search';
import { ClientTable } from '../../../utils/client-table';

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
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    FindingTableComponent,
    LoadingStateComponent,
    TableSearchComponent,
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
  readonly analysisColumns = ['type', 'status', 'detail', 'created'];
  readonly accessColumns = ['name', 'email', 'permission'];
  readonly analysisTable = new ClientTable(
    computed(() => this.analyses()),
    (run, column) => {
      if (column === 'type') return run.type;
      if (column === 'status') return run.status;
      if (column === 'detail') return `${run.trigger} ${run.commitSha} ${run.branch}`;
      if (column === 'created') return run.createdAt;
      return '';
    },
  );
  readonly accessTable = new ClientTable(
    computed(() => this.access()),
    (grant, column) => {
      if (column === 'name') return grant.displayName;
      if (column === 'email') return `${grant.email} ${grant.role}`;
      if (column === 'permission') return grant.permission;
      return '';
    },
  );

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

  constructor() {
    void this.load();
  }

  async changeAccess(grant: RepositoryAccessGrant, permission: RepositoryAccessGrant['permission']): Promise<void> {
    const repo = this.repository();
    if (!repo) return;
    try {
      const updated = await this.catalog.updateRepositoryAccess(repo.id, grant.userId, permission, repo.organizationId);
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
      const run = await this.catalog.requestAnalysis(repo.id, repo.organizationId, {
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
      const organizationId = this.route.snapshot.queryParamMap.get('organizationId') ?? undefined;
      const repo = await this.catalog.getRepository(this.repositoryId, organizationId);
      this.repository.set(repo);
      const [analyses, findings, access] = await Promise.all([
        this.catalog.listAnalysis(repo.organizationId, repo.id),
        this.catalog.listFindings(repo.organizationId, repo.id).catch(() => [] as Finding[]),
        repo.permission === 'ADMIN'
          ? this.catalog.listRepositoryAccess(repo.id, repo.organizationId).catch(() => [] as RepositoryAccessGrant[])
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
