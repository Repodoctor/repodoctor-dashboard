import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import type { Finding } from '../../interfaces/api';
import { ClientTable } from '../../utils/client-table';
import { TableSearchComponent } from '../table-search/table-search';

@Component({
  selector: 'app-finding-table',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, TableSearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finding-table.html',
})
export class FindingTableComponent {
  readonly findings = input.required<Finding[]>();
  readonly repositoryNames = input<Record<string, string>>({});
  readonly clickable = input(true);
  readonly rowClick = output<Finding>();
  readonly displayedColumns = ['repository', 'title', 'severity', 'file', 'status'];
  readonly table = new ClientTable(
    computed(() => this.findings()),
    (finding, column) => {
      if (column === 'repository') return this.repositoryNames()[finding.repositoryId] ?? finding.repositoryId;
      if (column === 'title') return finding.title;
      if (column === 'severity') return finding.severity;
      if (column === 'file') return finding.filePath ?? '';
      if (column === 'status') return finding.status;
      return '';
    },
  );

  repoName(finding: Finding): string {
    return this.repositoryNames()[finding.repositoryId] ?? finding.repositoryId;
  }
}
