import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogApi } from '../../../api/catalog.api';
import { ScmService } from '../../../services/scm.service';
import { ToastService } from '../../../services/toast.service';
import type { Workspace, Repository, RepositoryAccessGrant } from '../../../interfaces/api';
import { DataTableCellDirective } from '../../../components/data-table/data-table-cell.directive';
import { DataTableMobileDirective } from '../../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../../components/data-table/data-table';
import type { DataTableColumn } from '../../../components/data-table/data-table.types';
import { isOrgAdmin } from '../../../utils/workspace-role';

const PERMISSIONS = ['NONE', 'VIEW', 'ANALYZE', 'MANAGE', 'ADMIN'] as const;

interface PermissionRow extends RepositoryAccessGrant {
  repositoryId: string;
  fullName: string;
}

@Component({
  selector: 'app-workspace-permissions-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    DataTableComponent,
    DataTableCellDirective,
    DataTableMobileDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-permissions.html',
})
export class WorkspacePermissionsPage {
  private readonly workspaces = inject(WorkspaceStore);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly org = signal<Workspace | null>(null);
  readonly rows = signal<PermissionRow[]>([]);
  readonly drafts = signal<Record<string, RepositoryAccessGrant['permission']>>({});
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly permissions = PERMISSIONS;

  readonly columns = computed<DataTableColumn<PermissionRow>[]>(() => [
    {
      key: 'repository',
      header: 'Repository',
      value: (row) => row.fullName,
      mobile: 'title',
    },
    {
      key: 'member',
      header: 'Member',
      type: 'subtitle',
      value: (row) => row.displayName,
      subtitle: (row) => `${row.email} · ${row.role}`,
      sortValue: (row) => `${row.displayName} ${row.email} ${row.role}`,
      mobile: 'detail',
    },
    {
      key: 'permission',
      header: 'Permission',
      type: 'custom',
      sortValue: (row) => this.draftPermission(row),
      mobile: false,
    },
  ]);

  readonly canAdmin = () => isOrgAdmin(this.org()?.role);

  readonly trackRow = (row: PermissionRow) => this.draftKey(row);

  constructor() {
    const id = this.route.snapshot.paramMap.get('workspaceId');
    if (!id) {
      this.toast.show('Missing workspace id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  canEdit(row: PermissionRow): boolean {
    return this.canAdmin() && row.role !== 'OWNER' && row.role !== 'ADMIN';
  }

  draftKey(row: PermissionRow): string {
    return `${row.repositoryId}:${row.userId}`;
  }

  draftPermission(row: PermissionRow): RepositoryAccessGrant['permission'] {
    return this.drafts()[this.draftKey(row)] ?? row.permission;
  }

  setDraft(row: PermissionRow, permission: RepositoryAccessGrant['permission']): void {
    this.drafts.update((current) => ({ ...current, [this.draftKey(row)]: permission }));
  }

  dirty(): boolean {
    return this.rows().some((row) => this.draftPermission(row) !== row.permission);
  }

  async save(): Promise<void> {
    const org = this.org();
    if (!org || !this.canAdmin()) return;
    const changes = this.rows().filter((row) => this.canEdit(row) && this.draftPermission(row) !== row.permission);
    if (changes.length === 0) return;
    this.saving.set(true);
    try {
      const updated = await Promise.all(
        changes.map((row) =>
          this.catalog.updateRepositoryAccess(row.repositoryId, row.userId, this.draftPermission(row), org.id),
        ),
      );
      const byKey = new Map(
        changes.map((row, index) => [this.draftKey(row), updated[index]!]),
      );
      this.rows.set(
        this.rows().map((row) => {
          const next = byKey.get(this.draftKey(row));
          return next ? { ...row, permission: next.permission, source: next.source } : row;
        }),
      );
      this.drafts.set({});
      this.toast.show('Permissions saved.', 'success');
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, repositories] = await Promise.all([
        this.workspaces.get(id),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
      ]);
      this.org.set(org);
      if (!isOrgAdmin(org.role)) {
        await this.router.navigate(['/workspaces', id]);
        return;
      }
      const grants = await Promise.all(
        repositories.map(async (repository) => {
          const items = await this.catalog.listRepositoryAccess(repository.id, id).catch(() => [] as RepositoryAccessGrant[]);
          return items.map((item) => ({
            ...item,
            repositoryId: repository.id,
            fullName: repository.fullName,
          }));
        }),
      );
      this.rows.set(grants.flat());
      this.drafts.set({});
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
