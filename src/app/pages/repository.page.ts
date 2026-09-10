import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
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
import { CatalogService } from '../core/catalog.service';
import { ToastService } from '../core/toast.service';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from '../core/models';
import { FindingTableComponent } from '../ui/finding-table.component';
import { LoadingStateComponent } from '../ui/loading-state.component';

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
  template: `
    <div class="space-y-4">
      <nav mat-tab-nav-bar [tabPanel]="panel" mat-stretch-tabs="false">
        @for (item of nav; track item) {
          <a
            mat-tab-link
            [routerLink]="['/repositories', repositoryId, item]"
            [queryParams]="{ organizationId: repository()?.organizationId }"
            routerLinkActive
            #rla="routerLinkActive"
            [active]="rla.isActive || section() === item"
          >
            {{ item }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #panel />

      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading repository…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (repository(); as repo) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">{{ repo.owner }}</p>
          <h1 class="mt-1 text-3xl font-semibold">{{ repo.fullName }}</h1>
          <p class="mt-1 font-mono text-xs text-ink-200">
            {{ repo.defaultBranch }} · {{ repo.private ? 'private' : 'public' }} · {{ repo.scmProvider }}
            @if (repo.permission) {
              · {{ repo.permission }}
            }
          </p>
        </div>

        @if (section() === 'overview') {
          <div class="grid gap-4 md:grid-cols-3">
            <mat-card appearance="outlined">
              <mat-card-content>
                <p class="text-xs uppercase text-ink-200">Analyses</p>
                <p class="mt-2 font-mono text-3xl text-moss-300">{{ analyses().length }}</p>
              </mat-card-content>
            </mat-card>
            <mat-card appearance="outlined">
              <mat-card-content>
                <p class="text-xs uppercase text-ink-200">Open findings</p>
                <p class="mt-2 font-mono text-3xl text-moss-300">{{ openFindings().length }}</p>
              </mat-card-content>
            </mat-card>
            <mat-card appearance="outlined">
              <mat-card-content>
                <p class="text-xs uppercase text-ink-200">Critical / high</p>
                <p class="mt-2 font-mono text-3xl text-moss-300">{{ seriousFindings().length }}</p>
              </mat-card-content>
            </mat-card>
          </div>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Latest analysis</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (latestAnalysis(); as run) {
                <p class="font-mono text-sm text-moss-200">{{ run.status }} · {{ run.type }} · {{ run.trigger }}</p>
                <p class="text-xs text-ink-200">{{ run.commitSha.slice(0, 7) }} on {{ run.branch }}</p>
              } @else {
                <p class="text-sm text-ink-200">No analysis has been requested yet. A FULL run is queued when GitHub connects or a push webhook arrives.</p>
              }
            </mat-card-content>
          </mat-card>
        } @else if (section() === 'findings') {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Findings</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (findings().length === 0) {
                <p class="text-sm text-ink-200">No findings yet. Analyzers persist them through the findings API after RepoGraph and Repo Doctor run.</p>
              } @else {
                <app-finding-table [findings]="findings()" [clickable]="false" />
              }
            </mat-card-content>
          </mat-card>
        } @else if (section() === 'analysis') {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Analysis runs</mat-card-title>
              @if (canAnalyze()) {
                <button mat-flat-button class="!ml-auto" type="button" [disabled]="requesting()" (click)="requestAnalysis()">
                  {{ requesting() ? 'Queuing…' : 'Request FULL analysis' }}
                </button>
              }
            </mat-card-header>
            <mat-card-content>
              @if (analyses().length === 0) {
                <p class="text-sm text-ink-200">No analysis runs yet.</p>
              } @else {
                <div class="rd-table-wrap rd-table-static">
                  <table mat-table [dataSource]="analysisData">
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let run">{{ run.type }}</td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let run">{{ run.status }}</td>
                    </ng-container>
                    <ng-container matColumnDef="detail">
                      <th mat-header-cell *matHeaderCellDef>Detail</th>
                      <td mat-cell *matCellDef="let run">
                        <span class="font-mono text-xs text-ink-200">{{ run.trigger }} · {{ run.commitSha.slice(0, 7) }} · {{ run.branch }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="created">
                      <th mat-header-cell *matHeaderCellDef>Created</th>
                      <td mat-cell *matCellDef="let run">
                        <span class="font-mono text-xs text-ink-300">{{ run.createdAt }}</span>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="analysisColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: analysisColumns"></tr>
                  </table>
                  <mat-paginator #analysisPaginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
                </div>
              }
            </mat-card-content>
          </mat-card>
        } @else if (section() === 'settings') {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Repository access</mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-4">
              <p class="text-sm text-ink-200">
                VIEW reads findings. ANALYZE can request runs. MANAGE is reserved. ADMIN sets grants.
                Organization owners and admins always have ADMIN.
              </p>
              @if (!canAdminRepo()) {
                <p class="text-sm text-ink-200">You can view this repository as {{ repository()?.permission }}. Only repo ADMIN can change grants.</p>
              }
              @if (access().length === 0) {
                <p class="text-sm text-ink-200">{{ canAdminRepo() ? 'No members to show yet.' : 'Access grants are hidden unless you have ADMIN on this repository.' }}</p>
              } @else {
                <div class="rd-table-wrap rd-table-static">
                  <table mat-table [dataSource]="accessData">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let grant">{{ grant.displayName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="email">
                      <th mat-header-cell *matHeaderCellDef>Email</th>
                      <td mat-cell *matCellDef="let grant">
                        <span class="font-mono text-xs text-ink-200">{{ grant.email }} · {{ grant.role }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="permission">
                      <th mat-header-cell *matHeaderCellDef>Permission</th>
                      <td mat-cell *matCellDef="let grant">
                        @if (canAdminRepo() && grant.role !== 'OWNER' && grant.role !== 'ADMIN') {
                          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="!w-36">
                            <mat-select [value]="grant.permission" (selectionChange)="changeAccess(grant, $event.value)">
                              @for (permission of permissions; track permission) {
                                <mat-option [value]="permission">{{ permission }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        } @else {
                          <span class="font-mono text-xs text-moss-200">{{ grant.permission }}</span>
                        }
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="accessColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: accessColumns"></tr>
                  </table>
                  <mat-paginator #accessPaginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
                </div>
              }
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card appearance="outlined">
            <mat-card-content>
              <h2 class="text-2xl font-semibold">{{ later().title }}</h2>
              <p class="mt-2 text-sm text-ink-200">{{ later().body }}</p>
            </mat-card-content>
          </mat-card>
        }
        }
      }
    </div>
  `,
})
export class RepositoryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
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
