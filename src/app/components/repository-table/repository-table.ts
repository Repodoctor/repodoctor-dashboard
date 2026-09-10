import { Component, effect, input, output, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import type { Repository } from '../../interfaces/api';

@Component({
  selector: 'app-repository-table',
  imports: [MatTableModule, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repository-table.html',
})
export class RepositoryTableComponent {
  readonly repositories = input.required<Repository[]>();
  readonly clickable = input(true);
  readonly rowClick = output<Repository>();
  readonly displayedColumns = ['fullName', 'branch', 'visibility', 'permission'];
  readonly dataSource = new MatTableDataSource<Repository>([]);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.repositories();
    });
    effect(() => {
      const paginator = this.paginator();
      if (paginator) {
        this.dataSource.paginator = paginator;
      }
    });
  }
}
