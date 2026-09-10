import { Component, computed, effect, inject, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { map } from 'rxjs';
import { CatalogApi } from '../../api/catalog.api';
import { ToastService } from '../../services/toast.service';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from '../../interfaces/api';
import { FindingTableComponent } from '../../components/finding-table/finding-table';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';

const NAV = [
  'overview',
  'findings',
  'reviews',
  'graph',
  'security',
  'dependencies',
  'ci',
  'docs',
  'analysis',
  'ai',
  'settings',
] as const;

const LATER: Record<string, { title: string; body: string }> = {
  reviews: { title: 'Reviews', body: 'Pull request reviews from the code-review worker will appear here in a later phase.' },
  graph: { title: 'RepoGraph', body: 'Architecture graph artifacts from object storage, searchable metadata in Postgres.' },
  security: { title: 'Security', body: 'Secret detection and configuration analysis from the security worker.' },
  dependencies: { title: 'Dependencies', body: 'Inventory, vulnerabilities, and license risk from the dependency worker.' },
  ci: { title: 'CI Doctor', body: 'Failure diagnosis and remediation suggestions from the CI worker.' },
  docs: { title: 'Documentation', body: 'README quality, onboarding, and generated summaries from the documentation worker.' },
  ai: { title: 'AI', body: 'Evidence-based explanations over analyzer facts. AI is never the source of truth.' },
};

const PERMISSIONS = ['VIEW', 'ANALYZE', 'MANAGE', 'ADMIN'] as const;
const PERMISSION_RANK: Record<(typeof PERMISSIONS)[number], number> = {
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
    MatTabsModule,
    FindingTableComponent,
    LoadingStateComponent,
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
  readonly analysisData = new MatTableDataSource<AnalysisRun>([]);
  readonly accessData = new MatTableDataSource<RepositoryAccessGrant>([]);
  private readonly analysisPaginator = viewChild<MatPaginator>('analysisPaginator');
  private readonly accessPaginator = viewChild<MatPaginator>('accessPaginator');

  readonly openFindings = computed(() => this.findings().filter((item) => item.status === 'OPEN'));
  readonly seriousFindings = computed(() =>
    this.findings().filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH'),
  );
  readonly latestAnalysis = computed(() => this.analyses()[0] ?? null);
  readonly later = computed(() => LATER[this.section() ?? ''] ?? LATER['ai']!);
  readonly canAnalyze = () => {
    const permission = this.repository()?.permission;
    return permission ? PERMISSION_RANK[permission] >= PERMISSION_RANK.ANALYZE : false;
  };
  readonly canAdminRepo = () => this.repository()?.permission === 'ADMIN';

  constructor() {
    effect(() => {
      this.analysisData.data = this.analyses();
    });
    effect(() => {
      this.accessData.data = this.access();
    });
    effect(() => {
      const paginator = this.analysisPaginator();
      if (paginator) this.analysisData.paginator = paginator;
    });
    effect(() => {
      const paginator = this.accessPaginator();
      if (paginator) this.accessData.paginator = paginator;
    });
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
