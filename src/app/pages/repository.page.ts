import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

const SECTIONS: Record<string, { title: string; body: string }> = {
  overview: {
    title: 'Overview',
    body: 'Health score, critical/high findings, CI, architecture, and activity will appear here after analyzers run.',
  },
  findings: { title: 'Findings', body: 'Query findings from repodoctor-findings through the gateway.' },
  reviews: { title: 'Reviews', body: 'Pull request reviews from repodoctor-code-review.' },
  graph: { title: 'RepoGraph', body: 'Architecture graph artifacts from object storage, searchable metadata in Postgres.' },
  security: { title: 'Security', body: 'Secret detection and configuration analysis.' },
  dependencies: { title: 'Dependencies', body: 'Inventory, vulnerabilities, and license risk.' },
  ci: { title: 'CI Doctor', body: 'Failure diagnosis and remediation suggestions.' },
  docs: { title: 'Documentation', body: 'README quality, onboarding, and generated summaries.' },
  analysis: { title: 'Analysis', body: 'Analysis run lifecycle: queued, running, completed, failed.' },
  ai: { title: 'AI', body: 'Evidence-based explanations. AI is never the source of truth.' },
};

@Component({
  selector: 'app-repository-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        @for (item of nav; track item) {
          <a
            class="rounded-full border border-ink-400 px-3 py-1 text-xs hover:border-moss-400"
            [routerLink]="['/repositories', repositoryId, item]"
          >
            {{ item }}
          </a>
        }
      </div>
      <div class="rd-card">
        <p class="font-mono text-xs text-ink-200">{{ repositoryId }}</p>
        <h1 class="mt-1 text-2xl font-semibold">{{ copy.title }}</h1>
        <p class="mt-2 text-sm text-ink-200">{{ copy.body }}</p>
        <p class="mt-4 text-sm text-ink-300">Empty state: no analysis has run for this repository yet.</p>
      </div>
    </div>
  `,
})
export class RepositoryPage {
  private readonly route = inject(ActivatedRoute);
  readonly repositoryId = this.route.snapshot.paramMap.get('repositoryId') ?? '';
  readonly section = this.route.snapshot.paramMap.get('section') ?? 'overview';
  readonly nav = Object.keys(SECTIONS);
  readonly copy = SECTIONS[this.section] ?? SECTIONS['overview'];
}
