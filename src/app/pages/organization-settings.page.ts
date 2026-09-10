import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/error-message';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-organization-settings-page',
  imports: [ReactiveFormsModule, OrgSettingsNavComponent],
  template: `
    <div class="space-y-6">
      @if (saving()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/80">
          <div class="rd-card flex flex-col items-center gap-4 text-center">
            <div class="rd-spinner" role="status" aria-label="Processing"></div>
            <p class="font-medium">Processing…</p>
          </div>
        </div>
      }
      @if (loading()) {
        <div class="rd-card flex items-center gap-3">
          <div class="rd-spinner-sm" role="status" aria-label="Loading"></div>
          Loading settings…
        </div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else if (org(); as current) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization settings</p>
          <h1 class="text-3xl font-semibold">{{ current.name }}</h1>
        </div>
        <app-org-settings-nav [organizationId]="current.id" />
        @if (actionError()) {
          <div class="rd-card border-red-500/40 text-red-200">{{ actionError() }}</div>
        }
        <div class="rd-card space-y-4">
          <h2 class="font-medium">Details</h2>
          @if (canAdmin()) {
            <form class="grid gap-3 sm:grid-cols-[1fr_auto]" [formGroup]="nameForm" (ngSubmit)="saveName()">
              <input class="rd-input" formControlName="name" />
              <button class="rd-btn" type="submit" [disabled]="nameForm.invalid || saving()">
                {{ saving() ? 'Saving…' : 'Save' }}
              </button>
            </form>
          } @else {
            <p class="text-sm text-ink-200">{{ current.name }} · {{ current.slug }}</p>
            <p class="text-xs text-ink-300">Only OWNER or ADMIN can rename the organization.</p>
          }
        </div>
        @if (canAdmin()) {
          <div class="rd-card space-y-4 border-red-500/40">
            <h2 class="font-medium text-red-200">Delete organization</h2>
            <p class="text-sm text-ink-200">
              Removes repositories, analysis, findings, and every source-control installation. OWNER and ADMIN can do this.
            </p>
            @if (!pendingDelete()) {
              <button class="rd-btn bg-red-400 hover:bg-red-300" type="button" (click)="pendingDelete.set(true)">
                Delete organization
              </button>
            } @else {
              <div class="flex gap-2">
                <button class="rd-btn bg-red-400 hover:bg-red-300" type="button" [disabled]="saving()" (click)="deleteOrg()">
                  {{ saving() ? 'Deleting…' : 'Confirm delete' }}
                </button>
                <button class="rd-btn-ghost" type="button" (click)="pendingDelete.set(false)">Cancel</button>
              </div>
            }
          </div>
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

  readonly org = signal<Organization | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pendingDelete = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly nameForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  readonly canAdmin = () => {
    const role = this.org()?.role;
    return role === 'OWNER' || role === 'ADMIN';
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.error.set('Missing organization id');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  async saveName(): Promise<void> {
    const org = this.org();
    if (!org || this.nameForm.invalid) return;
    this.saving.set(true);
    this.actionError.set(null);
    try {
      const updated = await this.auth.updateOrganization(org.id, this.nameForm.getRawValue().name);
      this.org.set({ ...updated, role: org.role });
      this.toast.show('Organization updated.', 'success');
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to update the organization.'));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteOrg(): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.saving.set(true);
    this.actionError.set(null);
    try {
      await this.auth.deleteOrganization(org.id);
      this.toast.show(`${org.name} was deleted.`, 'success');
      await this.router.navigateByUrl('/organizations');
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to delete the organization.'));
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const org = await this.auth.getOrganization(id);
      this.org.set(org);
      this.nameForm.patchValue({ name: org.name });
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
