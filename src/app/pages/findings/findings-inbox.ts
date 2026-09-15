import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { map } from 'rxjs';
import { CatalogApi } from '../../api/catalog.api';
import type { Finding, Repository } from '../../interfaces/api';
import { DataTableMobileDirective } from '../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../components/data-table/data-table';
import { PageHeaderComponent } from '../../components/page-header/page-header';
import { findingColumns } from '../../utils/data-table-columns';
import { isFindingCategory, type FindingCategory } from '../../utils/finding-category';

const COPY: Record<
  FindingCategory,
  { eyebrow: string; title: string; subtitle: string; empty: string }
> = {
  code: {
    eyebrow: 'SAST',
    title: 'Code',
    subtitle: 'Semgrep findings from scanned repositories. A scanner crash is a failed run, not an empty inbox.',
    empty: 'No Semgrep findings yet. Connect GitHub and click Scan repository.',
  },
  secrets: {
    eyebrow: 'Secrets',
    title: 'Secrets',
    subtitle: 'Gitleaks detections. Raw secret values are never stored or shown.',
    empty: 'No secrets yet. The Gitleaks adapter is not in this slice.',
  },
  'supply-chain': {
    eyebrow: 'Dependencies',
    title: 'Supply chain',
    subtitle: 'Trivy filesystem, dependency, and (later) container image findings.',
    empty: 'No supply-chain findings yet. The Trivy adapter is not in this slice.',
  },
};

@Component({
  selector: 'app-findings-inbox-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    DataTableComponent,
    DataTableMobileDirective,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './findings-inbox.html',
})
export class FindingsInboxPage {
  private readonly catalog = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly category = (this.route.snapshot.data['category'] as FindingCategory) ?? 'code';
  readonly copy = COPY[this.category];
  readonly repositoryFilter = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('repositoryId'))),
    { initialValue: this.route.snapshot.queryParamMap.get('repositoryId') },
  );
  readonly findings = signal<Finding[]>([]);
  readonly repositoryNames = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly findingCols = computed(() => findingColumns((finding) => this.repoName(finding)));

  constructor() {
    this.route.queryParamMap.subscribe(() => {
      void this.refresh();
    });
  }

  repoName(finding: Finding): string {
    return this.repositoryNames()[finding.repositoryId] ?? finding.repositoryId;
  }

  filterLabel(): string | null {
    const id = this.repositoryFilter();
    if (!id) return null;
    return this.repositoryNames()[id] ?? id;
  }

  openFinding(finding: Finding): void {
    void this.router.navigate(['/repositories', finding.repositoryId, 'findings'], {
      queryParams: { organizationId: finding.organizationId },
    });
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const repositoryId = this.repositoryFilter() ?? undefined;
      const [repositories, findings] = await Promise.all([
        this.catalog.listMyRepositories().catch(() => [] as Repository[]),
        this.catalog.listFindings().catch(() => [] as Finding[]),
      ]);
      const names: Record<string, string> = {};
      for (const repo of repositories) names[repo.id] = repo.fullName;
      this.repositoryNames.set(names);
      this.findings.set(
        findings.filter((item) => {
          if (!isFindingCategory(item.source, this.category)) return false;
          if (repositoryId && item.repositoryId !== repositoryId) return false;
          return true;
        }),
      );
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
