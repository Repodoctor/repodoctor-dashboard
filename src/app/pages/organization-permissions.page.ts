import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CatalogService } from '../core/catalog.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import type { Organization, Repository, RepositoryAccessGrant } from '../core/models';
import { LoadingStateComponent } from '../ui/loading-state.component';
import { isOrgAdmin } from '../core/org-role';

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
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading permissions…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (org()) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Repository permissions</mat-card-title>
          </mat-card-header>
          <mat-card-content class="space-y-4">
            <p class="text-sm text-ink-200">
              Org roles set the default: VIEWER can VIEW, MEMBER can ANALYZE, ADMIN and OWNER have ADMIN.
              Overrides here change what a member can do on one repository.
            </p>
            <ul class="list-disc space-y-1 pl-5 text-xs text-ink-300">
              <li><span class="font-mono text-moss-200">VIEW</span> — read findings and repository details</li>
              <li><span class="font-mono text-moss-200">ANALYZE</span> — request analysis runs</li>
              <li><span class="font-mono text-moss-200">MANAGE</span> — reserved for later repository settings</li>
              <li><span class="font-mono text-moss-200">ADMIN</span> — change access grants</li>
            </ul>
            @if (rows().length === 0) {
              <p class="text-sm text-ink-200">No repositories yet. Connect a provider from Integrations.</p>
            } @else {
              <div class="rd-table-wrap rd-table-static">
                <table mat-table [dataSource]="tableData">
                  <ng-container matColumnDef="repository">
                    <th mat-header-cell *matHeaderCellDef>Repository</th>
                    <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="member">
                    <th mat-header-cell *matHeaderCellDef>Member</th>
                    <td mat-cell *matCellDef="let row">
                      <p>{{ row.displayName }}</p>
                      <p class="font-mono text-xs text-ink-300">{{ row.email }} · {{ row.role }}</p>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="permission">
                    <th mat-header-cell *matHeaderCellDef>Permission</th>
                    <td mat-cell *matCellDef="let row">
                      @if (canEdit(row)) {
                        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="!w-36">
                          <mat-select [value]="draftPermission(row)" (selectionChange)="setDraft(row, $event.value)">
                            @for (permission of permissions; track permission) {
                              <mat-option [value]="permission">{{ permission }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      } @else {
                        <span class="font-mono text-xs text-moss-200">{{ row.permission }}</span>
                      }
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="columns"></tr>
                  <tr mat-row *matRowDef="let row; columns: columns"></tr>
                </table>
                <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
              </div>
              @if (canAdmin()) {
                <div class="flex justify-end">
                  <button mat-flat-button type="button" [disabled]="!dirty() || saving()" (click)="save()">
                    {{ saving() ? 'Saving…' : 'Save permissions' }}
                  </button>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>
        }
      }
    </div>
  `,
})
export class OrganizationPermissionsPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogService);
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
        this.auth.getOrganization(id),
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
