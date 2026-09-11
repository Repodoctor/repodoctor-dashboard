import { computed, signal, type Signal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';

export function searchHaystack(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value).toLowerCase();
  return Object.values(value as Record<string, unknown>).map(searchHaystack).join(' ');
}

export function compareUnknown(a: unknown, b: unknown): number {
  const left = a == null ? '' : a;
  const right = b == null ? '' : b;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export class ClientTable<T> {
  readonly query = signal('');
  readonly sortActive = signal('');
  readonly sortDirection = signal<'asc' | 'desc' | ''>('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  constructor(
    private readonly source: Signal<T[]>,
    private readonly valueOf: (row: T, column: string) => unknown = (row, column) =>
      (row as Record<string, unknown>)[column],
  ) {}

  readonly filtered = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const rows = this.source();
    if (!needle) return rows;
    return rows.filter((row) => searchHaystack(row).includes(needle));
  });

  readonly sorted = computed(() => {
    const active = this.sortActive();
    const direction = this.sortDirection();
    const rows = this.filtered();
    if (!active || !direction) return rows;
    return [...rows].sort((left, right) => {
      const cmp = compareUnknown(this.valueOf(left, active), this.valueOf(right, active));
      return direction === 'asc' ? cmp : -cmp;
    });
  });

  readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  readonly total = computed(() => this.filtered().length);

  onSearch(value: string): void {
    this.query.set(value);
    this.pageIndex.set(0);
  }

  onSort(sort: Sort): void {
    this.sortActive.set(sort.active);
    this.sortDirection.set(sort.direction);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
