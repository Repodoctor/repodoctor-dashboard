import { Component, effect, inject, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../stores/organization.store';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogApi } from '../../api/catalog.api';
import { ScmService } from '../../services/scm.service';
import { ToastService } from '../../services/toast.service';
import type { Organization, Repository, RepositoryAccessGrant } from '../../interfaces/api';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { isOrgAdmin } from '../../utils/org-role';

const PERMISSIONS = ['VIEW', 'ANALYZE', 'MANAGE', 'ADMIN'] as const;

interface PermissionRow extends RepositoryAccessGrant {
  repositoryId: string;
  fullName: string;
}

@Component({
  selector: 'app-organization-permissions-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    LoadingStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-permissions.html',
})
export class OrganizationPermissionsPage {
  private readonly organizations = inject(OrganizationStore);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogApi);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly org = signal<Organization | null>(null);
  readonly rows = signal<PermissionRow[]>([]);
  readonly drafts = signal<Record<string, RepositoryAccessGrant['permission']>>({});
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly permissions = PERMISSIONS;
  readonly columns = ['repository', 'member', 'permission'];
  readonly tableData = new MatTableDataSource<PermissionRow>([]);
  private readonly paginator = viewChild(MatPaginator);

  readonly canAdmin = () => isOrgAdmin(this.org()?.role);

  constructor() {
    effect(() => {
      this.tableData.data = this.rows();
    });
    effect(() => {
      const paginator = this.paginator();
      if (paginator) this.tableData.paginator = paginator;
    });
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.toast.show('Missing organization id', 'error');
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
        this.organizations.get(id),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
      ]);
      this.org.set(org);
      if (!isOrgAdmin(org.role)) {
        await this.router.navigate(['/organizations', id]);
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
