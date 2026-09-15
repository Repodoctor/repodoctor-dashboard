import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  input,
  output,
} from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ClientTable } from '../../utils/client-table';
import { SkeletonComponent } from '../skeleton/skeleton';
import { TableSearchComponent } from '../table-search/table-search';
import { DataTableCellDirective } from './data-table-cell.directive';
import { DataTableMobileDirective } from './data-table-mobile.directive';
import type { DataTableColumn } from './data-table.types';

const SKELETON_ROWS = [1, 2, 3, 4, 5, 6] as const;

@Component({
  selector: 'app-data-table',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    SkeletonComponent,
    TableSearchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.html',
})
export class DataTableComponent<T> {
  readonly rows = input.required<T[]>();
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly searchLabel = input('Search');
  readonly emptyLabel = input('No matching results.');
  readonly loadingLabel = input('Loading…');
  readonly loading = input(false);
  readonly clickable = input(false);
  readonly trackBy = input<(row: T) => string | number>((row) => {
    const record = row as Record<string, unknown>;
    const id = record['id'];
    if (typeof id === 'string' || typeof id === 'number') return id;
    const userId = record['userId'];
    if (typeof userId === 'string' || typeof userId === 'number') return userId;
    return String(record['email'] ?? JSON.stringify(row));
  });
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);
  readonly rowClick = output<T>();

  readonly skeletonRows = SKELETON_ROWS;
  readonly cellTemplates = contentChildren(DataTableCellDirective);
  readonly mobileTemplate = contentChild(DataTableMobileDirective);

  readonly table = new ClientTable<T>(
    computed(() => this.rows()),
    (row, column) => {
      const col = this.columns().find((item) => item.key === column);
      if (!col) return '';
      if (col.sortValue) return col.sortValue(row);
      if (col.value) return col.value(row);
      return (row as Record<string, unknown>)[column];
    },
  );

  readonly displayedColumns = computed(() => this.columns().map((column) => column.key));

  readonly mobileTitleColumns = computed(() =>
    this.columns().filter((column) => (column.mobile ?? this.defaultMobile(column)) === 'title'),
  );
  readonly mobileMetaColumns = computed(() =>
    this.columns().filter((column) => (column.mobile ?? this.defaultMobile(column)) === 'meta'),
  );
  readonly mobileDetailColumns = computed(() =>
    this.columns().filter((column) => (column.mobile ?? this.defaultMobile(column)) === 'detail'),
  );

  cellTemplate(key: string) {
    return this.cellTemplates().find((item) => item.appDataTableCell() === key)?.template ?? null;
  }

  displayValue(row: T, column: DataTableColumn<T>): unknown {
    if (column.value) return column.value(row);
    return (row as Record<string, unknown>)[column.key];
  }

  dateValue(row: T, column: DataTableColumn<T>): string | number | Date | null {
    const value = this.displayValue(row, column);
    if (value == null || value === '') return null;
    if (value instanceof Date || typeof value === 'string' || typeof value === 'number') return value;
    return String(value);
  }

  displayText(row: T, column: DataTableColumn<T>): string {
    const value = this.displayValue(row, column);
    if (value == null || value === '') return column.emptyLabel ?? '—';
    return String(value);
  }

  subtitleText(row: T, column: DataTableColumn<T>): string | null {
    const value = column.subtitle?.(row);
    return value ? String(value) : null;
  }

  trackRow(row: T): string | number {
    return this.trackBy()(row);
  }

  onRowActivate(row: T): void {
    if (!this.clickable()) return;
    this.rowClick.emit(row);
  }

  private defaultMobile(column: DataTableColumn<T>): 'title' | 'meta' | 'detail' | false {
    if (column.type === 'custom' || column.align === 'end') return false;
    if (column.type === 'subtitle') return 'title';
    if (column.type === 'text' || !column.type) return 'title';
    if (column.type === 'accent') return 'meta';
    return 'detail';
  }
}
