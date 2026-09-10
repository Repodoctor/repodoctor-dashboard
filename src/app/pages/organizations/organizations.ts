import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../stores/organization.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import type { Organization } from '../../interfaces/api';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { OrganizationTableComponent } from '../../components/organization-table/organization-table';
import { PageHeaderComponent } from '../../components/page-header/page-header';

@Component({
  selector: 'app-organizations-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingStateComponent,
    OrganizationTableComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
})
export class OrganizationsPage {
  private readonly organizations = inject(OrganizationStore);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly items = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
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

  open(org: Organization): void {
    void this.router.navigate(['/organizations', org.id]);
  }

  async askDelete(org: Organization): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Delete organization',
            body: `Delete ${org.name}? Repositories, analysis runs, findings, and GitHub App installations are removed. RepoDoctor also uninstalls the GitHub App from that account. Type the organization name to confirm. This cannot be undone.`,
            confirm: 'Delete organization',
            typedValueLabel: 'Type the organization name to confirm',
            typedValueToMatch: org.name,
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.saving.set(true);
    try {
      await this.organizations.delete(org.id);
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
      await this.organizations.create({ name, slug: slug || undefined });
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
      this.items.set(await this.organizations.listAll());
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
