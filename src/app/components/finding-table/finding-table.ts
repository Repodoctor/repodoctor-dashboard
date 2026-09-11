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
  readonly clickable = input(true);
  readonly rowClick = output<Finding>();
  readonly displayedColumns = ['title', 'severity', 'source', 'status'];
  readonly table = new ClientTable(
    computed(() => this.findings()),
    (finding, column) => {
      if (column === 'title') return finding.title;
      if (column === 'severity') return finding.severity;
      if (column === 'source') return finding.source;
      if (column === 'status') return finding.status;
      return '';
    },
  );
}
