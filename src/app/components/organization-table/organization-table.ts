import { Component, computed, effect, input, output, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import type { Organization } from '../../interfaces/api';

@Component({
  selector: 'app-organization-table',
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-table.html',
})
export class OrganizationTableComponent {
  readonly organizations = input.required<Organization[]>();
  readonly showActions = input(false);
  readonly rowClick = output<Organization>();
  readonly settings = output<Organization>();
  readonly remove = output<Organization>();

  readonly dataSource = new MatTableDataSource<Organization>([]);
  private readonly paginator = viewChild(MatPaginator);
  readonly displayedColumns = computed(() =>
    this.showActions() ? ['name', 'slug', 'role', 'actions'] : ['name', 'slug', 'role'],
  );

  constructor() {
    effect(() => {
      this.dataSource.data = this.organizations();
    });
    effect(() => {
      const paginator = this.paginator();
      if (paginator) {
        this.dataSource.paginator = paginator;
      }
    });
  }
}
