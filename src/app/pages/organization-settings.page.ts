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
import { BusyOverlayComponent } from '../ui/busy-overlay.component';
import { isOrgAdmin } from '../core/org-role';

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
  template: `
    <div class="space-y-6">
      <app-busy-overlay [message]="saving() ? 'Processing…' : null" />
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading details…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (org(); as current) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (canAdmin()) {
              <form class="flex flex-wrap items-start gap-3" [formGroup]="nameForm" (ngSubmit)="saveName()">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-[16rem] flex-1">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <button mat-flat-button class="ml-auto" type="submit" [disabled]="nameForm.invalid || saving()">
                  {{ saving() ? 'Saving…' : 'Save' }}
                </button>
              </form>
            } @else {
              <p class="text-sm text-ink-200">{{ current.name }} · {{ current.slug }}</p>
              <p class="text-xs text-ink-300">Only OWNER or ADMIN can rename the organization.</p>
            }
          </mat-card-content>
        </mat-card>
        @if (canAdmin()) {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title class="text-red-200">Delete organization</mat-card-title>
            </mat-card-header>
            <mat-card-content class="space-y-4">
              <p class="text-sm text-ink-200">
                Removes repositories, analysis, findings, and every source-control installation. OWNER and ADMIN can do this.
              </p>
              <button mat-flat-button color="warn" type="button" (click)="askDelete()">Delete organization</button>
            </mat-card-content>
          </mat-card>
        }
        }
      }
    </div>
  `,
})
export class OrganizationSettingsPage {
  private readonly auth = inject(AuthService);
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
      const updated = await this.auth.updateOrganization(org.id, this.nameForm.getRawValue().name);
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
      await this.auth.deleteOrganization(org.id);
      this.toast.show(`${org.name} was deleted.`, 'success');
      await this.router.navigateByUrl('/organizations');
    } catch {
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const org = await this.auth.getOrganization(id);
      this.org.set(org);
      this.nameForm.patchValue({ name: org.name });
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
