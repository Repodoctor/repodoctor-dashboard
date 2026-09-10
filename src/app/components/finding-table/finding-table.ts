import { Component, effect, input, output, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import type { Finding } from '../../interfaces/api';

@Component({
  selector: 'app-finding-table',
  imports: [MatTableModule, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finding-table.html',
})
export class FindingTableComponent {
  readonly findings = input.required<Finding[]>();
  readonly clickable = input(true);
  readonly rowClick = output<Finding>();
  readonly displayedColumns = ['title', 'severity', 'source', 'status'];
  readonly dataSource = new MatTableDataSource<Finding>([]);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.findings();
    });
    effect(() => {
      const paginator = this.paginator();
      if (paginator) {
        this.dataSource.paginator = paginator;
      }
    });
  }
}
