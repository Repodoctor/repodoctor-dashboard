export type DataTableCellType = 'text' | 'mono' | 'accent' | 'date' | 'subtitle' | 'custom';

export type DataTableMobileRole = 'title' | 'meta' | 'detail' | false;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  type?: DataTableCellType;
  value?: (row: T) => unknown;
  sortValue?: (row: T) => unknown;
  subtitle?: (row: T) => string | null | undefined;
  sortable?: boolean;
  align?: 'start' | 'end';
  mobile?: DataTableMobileRole;
  emptyLabel?: string;
  dateFormat?: string;
}
