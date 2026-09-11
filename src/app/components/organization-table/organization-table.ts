import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import type { Organization } from '../../interfaces/api';
import { ClientTable } from '../../utils/client-table';
import { TableSearchComponent } from '../table-search/table-search';

@Component({
  selector: 'app-organization-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TableSearchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-table.html',
})
export class OrganizationTableComponent {
  readonly organizations = input.required<Organization[]>();
  readonly showActions = input(false);
  readonly rowClick = output<Organization>();
  readonly settings = output<Organization>();
  readonly remove = output<Organization>();

  readonly table = new ClientTable(
    computed(() => this.organizations()),
    (org, column) => {
      if (column === 'name') return org.name;
      if (column === 'slug') return org.slug;
      if (column === 'role') return org.role ?? '';
      return '';
    },
  );
  readonly displayedColumns = computed(() =>
    this.showActions() ? ['name', 'slug', 'role', 'actions'] : ['name', 'slug', 'role'],
  );
}
