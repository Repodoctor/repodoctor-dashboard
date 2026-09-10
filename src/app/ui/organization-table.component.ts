import { Component, computed, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-organization-table',
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="rd-table-wrap">
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let org">{{ org.name }}</td>
        </ng-container>
        <ng-container matColumnDef="slug">
          <th mat-header-cell *matHeaderCellDef>Slug</th>
          <td mat-cell *matCellDef="let org">
            <span class="font-mono text-xs text-ink-200">{{ org.slug }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let org">
            <span class="font-mono text-xs text-moss-200">{{ org.role }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let org">
            @if (org.role === 'OWNER' || org.role === 'ADMIN') {
              <button
                mat-icon-button
                type="button"
                aria-label="Organization actions"
                [matMenuTriggerFor]="menu"
                (click)="$event.stopPropagation()"
              >
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item type="button" (click)="settings.emit(org)">Settings</button>
                <button mat-menu-item type="button" (click)="remove.emit(org)">Delete</button>
              </mat-menu>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns()" (click)="rowClick.emit(row)"></tr>
      </table>
      <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
    </div>
  `,
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
