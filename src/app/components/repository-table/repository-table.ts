import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import type { Repository } from '../../interfaces/api';
import { ClientTable } from '../../utils/client-table';
import { TableSearchComponent } from '../table-search/table-search';

@Component({
  selector: 'app-repository-table',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, TableSearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repository-table.html',
})
export class RepositoryTableComponent {
  readonly repositories = input.required<Repository[]>();
  readonly clickable = input(true);
  readonly rowClick = output<Repository>();
  readonly displayedColumns = ['fullName', 'branch', 'visibility', 'permission'];
  readonly table = new ClientTable(
    computed(() => this.repositories()),
    (repo, column) => {
      if (column === 'fullName') return repo.fullName;
      if (column === 'branch') return repo.defaultBranch;
      if (column === 'visibility') return repo.private ? 'private' : 'public';
      if (column === 'permission') return repo.permission ?? 'VIEW';
      return '';
    },
  );
}
