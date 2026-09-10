import { Component, effect, input, output, viewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import type { Repository } from '../core/models';

@Component({
  selector: 'app-repository-table',
  imports: [MatTableModule, MatPaginatorModule],
  template: `
    <div class="rd-table-wrap" [class.rd-table-static]="!clickable()">
      <table mat-table [dataSource]="dataSource">
        <ng-container matColumnDef="fullName">
          <th mat-header-cell *matHeaderCellDef>Repository</th>
          <td mat-cell *matCellDef="let repo">{{ repo.fullName }}</td>
        </ng-container>
        <ng-container matColumnDef="branch">
          <th mat-header-cell *matHeaderCellDef>Branch</th>
          <td mat-cell *matCellDef="let repo">
            <span class="font-mono text-xs text-ink-200">{{ repo.defaultBranch }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="visibility">
          <th mat-header-cell *matHeaderCellDef>Visibility</th>
          <td mat-cell *matCellDef="let repo">
            <span class="font-mono text-xs text-ink-200">{{ repo.private ? 'private' : 'public' }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="permission">
          <th mat-header-cell *matHeaderCellDef>Access</th>
          <td mat-cell *matCellDef="let repo">
            <span class="font-mono text-xs text-moss-200">{{ repo.permission ?? 'VIEW' }}</span>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns"
          [class.cursor-pointer]="clickable()"
          (click)="clickable() && rowClick.emit(row)"
        ></tr>
      </table>
      <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
    </div>
  `,
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
