import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import type { Organization } from '../core/models';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';
import { LoadingStateComponent } from '../ui/loading-state.component';
import { OrganizationTableComponent } from '../ui/organization-table.component';

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
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Tenancy</p>
          <h1 class="text-3xl font-semibold">Organizations</h1>
        </div>
      </div>
      <mat-card appearance="outlined">
        <mat-card-content>
          <form class="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-start" [formGroup]="form" (ngSubmit)="create()">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Slug (optional)</mat-label>
              <input matInput formControlName="slug" />
            </mat-form-field>
            <button mat-flat-button class="md:mt-1" type="submit" [disabled]="form.invalid || saving()">Create</button>
          </form>
        </mat-card-content>
      </mat-card>
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading…" />
          </mat-card-content>
        </mat-card>
      } @else if (items().length === 0) {
        <mat-card appearance="outlined">
          <mat-card-content class="text-ink-200">No organizations yet. Create one to become OWNER.</mat-card-content>
        </mat-card>
      } @else {
        <app-organization-table
          [organizations]="items()"
          [showActions]="true"
          (rowClick)="open($event)"
          (settings)="openSettings($event)"
          (remove)="askDelete($event)"
        />
      }
    </div>
  `,
})
export class OrganizationsPage {
  private readonly auth = inject(AuthService);
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

  openSettings(org: Organization): void {
    void this.router.navigate(['/organizations', org.id, 'settings']);
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
      await this.auth.deleteOrganization(org.id);
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
      await this.auth.createOrganization({ name, slug: slug || undefined });
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
      this.items.set(await this.auth.listOrganizations());
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
