import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CatalogService } from '../core/catalog.service';
import { errorMessage } from '../core/error-message';
import type { AnalysisRun, Finding, Repository } from '../core/models';

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
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else {
        @if (repository(); as repo) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">{{ repo.owner }}</p>
          <h1 class="mt-1 text-3xl font-semibold">{{ repo.fullName }}</h1>
          <p class="mt-1 font-mono text-xs text-ink-200">
            {{ repo.defaultBranch }} · {{ repo.private ? 'private' : 'public' }} · {{ repo.scmProvider }}
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
            @if (findingsError()) {
              <p class="text-sm text-red-200">{{ findingsError() }}</p>
            } @else if (findings().length === 0) {
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
              <button class="rd-btn" type="button" [disabled]="requesting()" (click)="requestAnalysis()">
                {{ requesting() ? 'Queuing…' : 'Request FULL analysis' }}
              </button>
            </div>
            @if (actionError()) {
              <p class="text-sm text-red-200">{{ actionError() }}</p>
            }
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

  readonly nav = NAV;
  readonly repositoryId = this.route.snapshot.paramMap.get('repositoryId') ?? '';
  readonly section = toSignal(this.route.paramMap.pipe(map((params) => params.get('section') ?? 'overview')), {
    initialValue: this.route.snapshot.paramMap.get('section') ?? 'overview',
  });

  readonly repository = signal<Repository | null>(null);
  readonly analyses = signal<AnalysisRun[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly loading = signal(true);
  readonly requesting = signal(false);
  readonly error = signal<string | null>(null);
  readonly findingsError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly openFindings = computed(() => this.findings().filter((item) => item.status === 'OPEN'));
  readonly seriousFindings = computed(() =>
    this.findings().filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH'),
  );
  readonly latestAnalysis = computed(() => this.analyses()[0] ?? null);
  readonly later = computed(() => LATER[this.section() ?? ''] ?? LATER['ai']!);

  constructor() {
    void this.load();
  }

  async requestAnalysis(): Promise<void> {
    const repo = this.repository();
    if (!repo) return;
    this.requesting.set(true);
    this.actionError.set(null);
    try {
      const latest = this.latestAnalysis();
      const run = await this.catalog.requestAnalysis(repo.id, repo.organizationId, {
        commitSha: latest?.commitSha ?? '0000000',
        branch: repo.defaultBranch,
      });
      this.analyses.set([run, ...this.analyses().filter((item) => item.id !== run.id)]);
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to queue analysis.'));
    } finally {
      this.requesting.set(false);
    }
  }

  private async load(): Promise<void> {
    if (!this.repositoryId) {
      this.error.set('Missing repository id');
      this.loading.set(false);
      return;
    }
    try {
      const organizationId = this.route.snapshot.queryParamMap.get('organizationId') ?? undefined;
      const repo = await this.catalog.getRepository(this.repositoryId, organizationId);
      this.repository.set(repo);
      const [analyses, findings] = await Promise.all([
        this.catalog.listAnalysis(repo.organizationId, repo.id),
        this.catalog.listFindings(repo.organizationId, repo.id).catch((error) => {
          this.findingsError.set(errorMessage(error, 'Unable to load findings.'));
          return [] as Finding[];
        }),
      ]);
      this.analyses.set(analyses);
      this.findings.set(findings);
    } catch (error) {
      this.error.set(errorMessage(error, 'Unable to load this repository.'));
    } finally {
      this.loading.set(false);
    }
  }
}
