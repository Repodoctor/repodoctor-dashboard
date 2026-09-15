import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../services/toast.service';
import type { Workspace } from '../../../interfaces/api';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { DataTableCellDirective } from '../../../components/data-table/data-table-cell.directive';
import { DataTableMobileDirective } from '../../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../../components/data-table/data-table';
import { PageHeaderComponent } from '../../../components/page-header/page-header';
import { workspaceColumns } from '../../../utils/data-table-columns';
import { FREE_PLAN } from '../../../utils/plan';

@Component({
  selector: 'app-workspaces-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    DataTableComponent,
    DataTableCellDirective,
    DataTableMobileDirective,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspaces.html',
})
export class WorkspacesPage {
  private readonly workspaces = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly items = signal<Workspace[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly plan = FREE_PLAN;
  readonly orgColumns = workspaceColumns(true);
  readonly ownedCount = () => this.items().filter((org) => org.role === 'OWNER').length;
  readonly atWorkspaceLimit = () => this.ownedCount() >= FREE_PLAN.maxOwnedWorkspaces;
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
  });

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    const installationId = query.get('installation_id');
    if (installationId) {
      void this.router.navigate(['/settings/scm/github/callback'], {
        queryParams: {
          installation_id: installationId,
          setup_action: query.get('setup_action'),
          state: query.get('state'),
        },
      });
      return;
    }
    void this.refresh();
  }

  open(org: Workspace): void {
    void this.router.navigate(['/workspaces', org.id]);
  }

  async askDelete(org: Workspace): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Delete workspace',
            body: `Delete ${org.name}? Repositories, analysis runs, findings, and GitHub App installations are removed. RepoDoctor also uninstalls the GitHub App from that account. Type the workspace name to confirm. This cannot be undone.`,
            confirm: 'Delete workspace',
            typedValueLabel: 'Type the workspace name to confirm',
            typedValueToMatch: org.name,
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.saving.set(true);
    try {
      await this.workspaces.delete(org.id);
      this.toast.show(`${org.name} was deleted.`, 'success');
      await this.refresh();
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.saving.set(false);
    }
  }

  async create(): Promise<void> {
    this.saving.set(true);
    try {
      const { name, slug } = this.form.getRawValue();
      await this.workspaces.create({ name, slug: slug || undefined });
      this.form.reset({ name: '', slug: '' });
      await this.refresh();
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.saving.set(false);
    }
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.workspaces.listAll());
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
