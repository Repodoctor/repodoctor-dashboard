import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../../stores/organization.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../services/toast.service';
import type { Organization } from '../../../interfaces/api';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { LoadingStateComponent } from '../../../components/loading-state/loading-state';
import { BusyOverlayComponent } from '../../../components/busy-overlay/busy-overlay';
import { isOrgAdmin } from '../../../utils/org-role';

@Component({
  selector: 'app-organization-settings-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingStateComponent,
    BusyOverlayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-settings.html',
})
export class OrganizationSettingsPage {
  private readonly organizations = inject(OrganizationStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly org = signal<Organization | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly nameForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  readonly canAdmin = () => isOrgAdmin(this.org()?.role);

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.toast.show('Missing organization id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  async saveName(): Promise<void> {
    const org = this.org();
    if (!org || this.nameForm.invalid) return;
    this.saving.set(true);
    try {
      const updated = await this.organizations.update(org.id, this.nameForm.getRawValue().name);
      this.org.set({ ...updated, role: org.role });
      this.toast.show('Organization updated.', 'success');
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.saving.set(false);
    }
  }

  async askDelete(): Promise<void> {
    const org = this.org();
    if (!org) return;
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Delete organization',
            body: `Delete ${org.name}? Repositories, analysis, findings, and every source-control installation are removed. Type the organization name to confirm. This cannot be undone.`,
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
      await this.router.navigateByUrl('/organizations');
    } catch {
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const org = await this.organizations.get(id);
      this.org.set(org);
      this.nameForm.patchValue({ name: org.name });
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
