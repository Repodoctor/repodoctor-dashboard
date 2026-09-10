import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CatalogService } from '../core/catalog.service';
import { ToastService } from '../core/toast.service';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from '../core/models';

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
  imports: [RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        @for (item of nav; track item) {
          <a
            class="rounded-full border px-3 py-1 text-xs"
            [class.border-moss-400]="section() === item"
            [class.text-moss-200]="section() === item"
            [class.border-ink-400]="section() !== item"
            [routerLink]="['/repositories', repositoryId, item]"
            [queryParams]="{ organizationId: repository()?.organizationId }"
          >
            {{ item }}
          </a>
        }
      </div>

      @if (loading()) {
        <div class="rd-card">Loading repository…</div>
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
            <div class="rd-card">
              <p class="text-xs uppercase text-ink-200">Analyses</p>
              <p class="mt-2 font-mono text-3xl text-moss-300">{{ analyses().length }}</p>
            </div>
            <div class="rd-card">
              <p class="text-xs uppercase text-ink-200">Open findings</p>
              <p class="mt-2 font-mono text-3xl text-moss-300">{{ openFindings().length }}</p>
            </div>
            <div class="rd-card">
              <p class="text-xs uppercase text-ink-200">Critical / high</p>
              <p class="mt-2 font-mono text-3xl text-moss-300">{{ seriousFindings().length }}</p>
            </div>
          </div>
          <div class="rd-card space-y-2">
            <h2 class="font-medium">Latest analysis</h2>
            @if (latestAnalysis(); as run) {
              <p class="font-mono text-sm text-moss-200">{{ run.status }} · {{ run.type }} · {{ run.trigger }}</p>
              <p class="text-xs text-ink-200">{{ run.commitSha.slice(0, 7) }} on {{ run.branch }}</p>
            } @else {
              <p class="text-sm text-ink-200">No analysis has been requested yet. A FULL run is queued when GitHub connects or a push webhook arrives.</p>
            }
          </div>
        } @else if (section() === 'findings') {
          <div class="rd-card space-y-4">
            <h2 class="font-medium">Findings</h2>
            @if (findings().length === 0) {
              <p class="text-sm text-ink-200">No findings yet. Analyzers persist them through the findings API after RepoGraph and Repo Doctor run.</p>
            } @else {
              <div class="space-y-2">
                @for (finding of findings(); track finding.id) {
                  <div class="rounded-md border border-ink-400 px-3 py-2">
                    <div class="flex items-center justify-between gap-3">
                      <p class="font-medium">{{ finding.title }}</p>
                      <span class="font-mono text-xs text-moss-200">{{ finding.severity }}</span>
                    </div>
                    <p class="mt-1 text-sm text-ink-200">{{ finding.description }}</p>
                    <p class="mt-1 font-mono text-xs text-ink-300">
                      {{ finding.source }} · {{ finding.status }}
                      @if (finding.filePath) {
                        · {{ finding.filePath }}{{ finding.lineNumber ? ':' + finding.lineNumber : '' }}
                      }
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        } @else if (section() === 'analysis') {
          <div class="rd-card space-y-4">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-medium">Analysis runs</h2>
              @if (canAnalyze()) {
                <button class="rd-btn" type="button" [disabled]="requesting()" (click)="requestAnalysis()">
                  {{ requesting() ? 'Queuing…' : 'Request FULL analysis' }}
                </button>
              }
            </div>
            @if (analyses().length === 0) {
              <p class="text-sm text-ink-200">No analysis runs yet.</p>
            } @else {
              <div class="space-y-2">
                @for (run of analyses(); track run.id) {
                  <div class="flex items-center justify-between rounded-md border border-ink-400 px-3 py-2">
                    <div>
                      <p class="font-mono text-sm">{{ run.type }} · {{ run.status }}</p>
                      <p class="text-xs text-ink-200">{{ run.trigger }} · {{ run.commitSha.slice(0, 7) }} · {{ run.branch }}</p>
                    </div>
                    <p class="font-mono text-xs text-ink-300">{{ run.createdAt }}</p>
                  </div>
                }
              </div>
            }
          </div>
        } @else if (section() === 'settings') {
          <div class="rd-card space-y-4">
            <h2 class="font-medium">Repository access</h2>
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
              <div class="space-y-2">
                @for (grant of access(); track grant.userId) {
                  <div class="flex items-center justify-between gap-3 rounded-md border border-ink-400 px-3 py-2">
                    <div class="min-w-0">
                      <p class="truncate font-medium">{{ grant.displayName }}</p>
                      <p class="truncate font-mono text-xs text-ink-200">{{ grant.email }} · {{ grant.role }}</p>
                    </div>
                    @if (canAdminRepo() && grant.role !== 'OWNER' && grant.role !== 'ADMIN') {
                      <select
                        class="rd-input py-1"
                        [value]="grant.permission"
                        (change)="changeAccess(grant, selectPermission($event))"
                      >
                        @for (permission of permissions; track permission) {
                          <option [value]="permission">{{ permission }}</option>
                        }
                      </select>
                    } @else {
                      <span class="font-mono text-xs text-moss-200">{{ grant.permission }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="rd-card">
            <h2 class="text-2xl font-semibold">{{ later().title }}</h2>
            <p class="mt-2 text-sm text-ink-200">{{ later().body }}</p>
          </div>
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
    void this.load();
  }

  selectPermission(event: Event): RepositoryAccessGrant['permission'] {
    return (event.target as HTMLSelectElement).value as RepositoryAccessGrant['permission'];
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
