import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/error-message';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import type { Organization, ScmInstallation } from '../core/models';

@Component({
  selector: 'app-organization-settings-page',
  imports: [ReactiveFormsModule, OrgSettingsNavComponent],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading settings…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else {
        @if (org(); as current) {
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
        <div class="rd-card space-y-4">
          <h2 class="font-medium">GitHub</h2>
          @if (githubInstall(); as install) {
            <p class="text-sm text-ink-200">
              Installed on <span class="font-mono text-moss-200">{{ install.accountLogin }}</span>
            </p>
          } @else {
            <p class="text-sm text-ink-200">No GitHub App installation for this organization.</p>
          }
          <div class="flex flex-wrap gap-2">
            @if (canManage()) {
              <button class="rd-btn" type="button" [disabled]="connecting()" (click)="connectGithub()">
                {{ connecting() ? 'Redirecting…' : githubInstall() ? 'Manage repos' : 'Connect GitHub' }}
              </button>
            }
            @if (canAdmin() && githubInstall()) {
              <button class="rd-btn-ghost text-red-200" type="button" [disabled]="disconnecting()" (click)="askDisconnect()">
                Disconnect
              </button>
            }
          </div>
          @if (confirmDisconnect()) {
            <div class="space-y-3 rounded-md border border-red-500/40 p-3">
              <p class="text-sm text-ink-200">
                Uninstalls the GitHub App and removes imported repositories. The organization stays.
              </p>
              <div class="flex gap-2">
                <button class="rd-btn" type="button" [disabled]="disconnecting()" (click)="disconnectGithub()">
                  {{ disconnecting() ? 'Disconnecting…' : 'Disconnect GitHub' }}
                </button>
                <button class="rd-btn-ghost" type="button" (click)="confirmDisconnect.set(false)">Cancel</button>
              </div>
            </div>
          }
        </div>
        @if (canAdmin()) {
          <div class="rd-card space-y-4 border-red-500/40">
            <h2 class="font-medium text-red-200">Delete organization</h2>
            <p class="text-sm text-ink-200">
              Removes repositories, analysis, findings, and the GitHub App installation. OWNER and ADMIN can do this.
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
      }
    </div>
  `,
})
export class OrganizationSettingsPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly connecting = signal(false);
  readonly disconnecting = signal(false);
  readonly confirmDisconnect = signal(false);
  readonly pendingDelete = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly nameForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  readonly githubInstall = () => this.installations().find((item) => item.provider === 'github') ?? null;
  readonly canManage = () => {
    const role = this.org()?.role;
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  };
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

  async connectGithub(): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.connecting.set(true);
    this.actionError.set(null);
    try {
      this.scm.rememberOrganization(org.id);
      const { url } = await this.scm.getGithubInstallUrl(org.id);
      window.location.assign(url);
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to start GitHub App installation.'));
      this.connecting.set(false);
    }
  }

  askDisconnect(): void {
    this.confirmDisconnect.set(true);
  }

  async disconnectGithub(): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.disconnecting.set(true);
    this.actionError.set(null);
    try {
      await this.scm.disconnectGithub(org.id);
      this.installations.set([]);
      this.confirmDisconnect.set(false);
      this.toast.show('GitHub disconnected.', 'success');
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to disconnect GitHub.'));
    } finally {
      this.disconnecting.set(false);
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
      const [org, installations] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.nameForm.patchValue({ name: org.name });
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
