import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import type { Finding, Repository } from '../../interfaces/api';
import { categoryPath, findingCategory } from '../../utils/finding-category';
import { ClientTable } from '../../utils/client-table';
import { TableSearchComponent } from '../table-search/table-search';

@Component({
  selector: 'app-repository-table',
  imports: [DatePipe, RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, TableSearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repository-table.html',
})
export class RepositoryTableComponent {
  readonly repositories = input.required<Repository[]>();
  readonly findings = input<Finding[]>([]);
  readonly clickable = input(true);
  readonly rowClick = output<Repository>();
  readonly displayedColumns = [
    'fullName',
    'branch',
    'visibility',
    'lastScan',
    'codeFindings',
    'supplyChainFindings',
    'scannedDependencies',
  ];
  readonly table = new ClientTable(
    computed(() => this.repositories()),
    (repo, column) => {
      if (column === 'fullName') return repo.fullName;
      if (column === 'branch') return repo.defaultBranch;
      if (column === 'visibility') return repo.private ? 'private' : 'public';
      if (column === 'lastScan') return repo.lastAnalyzedAt ?? '';
      if (column === 'codeFindings') return this.codeCount(repo.id);
      if (column === 'supplyChainFindings') return this.supplyChainCount(repo.id);
      if (column === 'scannedDependencies') return repo.lastAnalyzedAt ? 0 : -1;
      return '';
    },
  );

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

  findingsLink(repositoryId: string, category: 'code' | 'supply-chain'): string[] {
    return [categoryPath(category)];
  }

  findingsQuery(repositoryId: string): { repositoryId: string } {
    return { repositoryId };
  }
}
