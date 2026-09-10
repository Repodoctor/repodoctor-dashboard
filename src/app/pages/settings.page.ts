import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { PASSWORD_HINT, passwordRules, passwordStrength, passwordsMatch } from '../core/password-strength';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Account</p>
        <h1 class="text-3xl font-semibold">Settings</h1>
        <p class="mt-1 text-sm text-ink-200">Personal profile and account deletion. Organization settings live on each organization.</p>
      </div>
      <div class="rd-card space-y-4">
        <h2 class="font-medium">Profile</h2>
        <p class="font-mono text-sm text-ink-200">{{ auth.user()?.email }}</p>
        <form class="grid gap-3 sm:grid-cols-[1fr_auto]" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <input class="rd-input" formControlName="displayName" />
          <button class="rd-btn" type="submit" [disabled]="profileForm.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Save' }}
          </button>
        </form>
      </div>
      <div class="rd-card space-y-4">
        <h2 class="font-medium">Password</h2>
        @if (!changingPassword()) {
          <button class="rd-btn-ghost" type="button" (click)="changingPassword.set(true)">Change password</button>
        } @else {
          <form class="space-y-3" [formGroup]="passwordForm" (ngSubmit)="savePassword()">
            <p class="text-sm text-ink-200">{{ hint }}</p>
            <label class="block text-sm">Current password
              <input class="rd-input mt-1" type="password" formControlName="currentPassword" autocomplete="current-password" />
            </label>
            <label class="block text-sm">New password
              <input class="rd-input mt-1" type="password" formControlName="password" autocomplete="new-password" />
            </label>
            @if (passwordForm.controls.password.value) {
              <p class="text-xs text-ink-200">{{ passwordStrengthLabel() }}</p>
            }
            <label class="block text-sm">Confirm new password
              <input class="rd-input mt-1" type="password" formControlName="confirmPassword" autocomplete="new-password" />
            </label>
            @if (passwordForm.hasError('mismatch') && passwordForm.touched) {
              <p class="text-sm text-red-200">Passwords do not match.</p>
            }
            @if (passwordForm.controls.password.touched && passwordForm.controls.password.hasError('passwordRules')) {
              <p class="text-sm text-red-200">{{ hint }}</p>
            }
            <div class="flex flex-wrap gap-2">
              <button class="rd-btn" type="submit" [disabled]="passwordForm.invalid || savingPassword()">
                {{ savingPassword() ? 'Saving…' : 'Save' }}
              </button>
              <button class="rd-btn-ghost" type="button" (click)="cancelPasswordChange()">Cancel</button>
            </div>
          </form>
        }
      </div>
      <div class="rd-card space-y-3">
        <h2 class="font-medium">Organizations you belong to</h2>
        @if (organizations().length === 0) {
          <p class="text-sm text-ink-200">You are not in any organizations.</p>
        } @else {
          <div class="space-y-2">
            @for (org of organizations(); track org.id) {
              <div class="flex items-center justify-between gap-3 rounded-md border border-ink-400 px-3 py-2">
                <div>
                  <p class="font-medium">{{ org.name }}</p>
                  <p class="font-mono text-xs text-ink-200">{{ org.role }}</p>
                </div>
                <a class="rd-btn-ghost" [routerLink]="['/organizations', org.id, 'settings']">Org settings</a>
              </div>
            }
          </div>
        }
      </div>
      <div class="rd-card space-y-4 border-red-500/40">
        <h2 class="font-medium text-red-200">Delete account</h2>
        <p class="text-sm text-ink-200">
          This signs you out and removes your RepoDoctor user. Organizations you <span class="font-medium">own</span>
          are deleted with their repositories, findings, and GitHub App installations. Organizations where you are only
          ADMIN, MEMBER, or VIEWER stay; you are removed from them.
        </p>
        @if (ownedOrgs().length > 0) {
          <p class="text-sm text-red-200">Owned organizations that will be deleted: {{ ownedNames() }}</p>
        }
        <label class="text-sm text-ink-200">
          Type your email to confirm
          <input class="rd-input mt-1" [formControl]="confirmEmail" />
        </label>
        <button
          class="rd-btn bg-red-400 hover:bg-red-300"
          type="button"
          [disabled]="confirmEmail.value !== auth.user()?.email || deleting()"
          (click)="deleteAccount()"
        >
          {{ deleting() ? 'Deleting…' : 'Delete my account' }}
        </button>
      </div>
    </div>
  `,
})
export class SettingsPage {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly organizations = signal<Organization[]>([]);
  readonly saving = signal(false);
  readonly savingPassword = signal(false);
  readonly deleting = signal(false);
  readonly changingPassword = signal(false);
  readonly hint = PASSWORD_HINT;
  readonly profileForm = this.fb.nonNullable.group({
    displayName: [this.auth.user()?.displayName ?? '', [Validators.required, Validators.minLength(1)]],
  });
  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      password: ['', [Validators.required, passwordRules()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly confirmEmail = this.fb.nonNullable.control('');

  readonly ownedOrgs = () => this.organizations().filter((item) => item.role === 'OWNER');
  readonly ownedNames = () => this.ownedOrgs().map((item) => item.name).join(', ');

  constructor() {
    void this.load();
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    try {
      await this.auth.updateProfile(this.profileForm.getRawValue().displayName);
      this.toast.show('Profile updated.', 'success');
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.saving.set(false);
    }
  }

  passwordStrengthLabel(): string {
    return passwordStrength(this.passwordForm.controls.password.value).label;
  }

  cancelPasswordChange(): void {
    this.changingPassword.set(false);
    this.passwordForm.reset({ currentPassword: '', password: '', confirmPassword: '' });
  }

  async savePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    try {
      const { currentPassword, password } = this.passwordForm.getRawValue();
      await this.auth.changePassword(currentPassword, password);
      this.toast.show('Password updated.', 'success');
      this.cancelPasswordChange();
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to update password. Check your current password.'), 'error');
      }
    } finally {
      this.savingPassword.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    if (this.confirmEmail.value !== this.auth.user()?.email) return;
    this.deleting.set(true);
    try {
      await this.auth.deleteAccount();
    } catch {
      // HTTP errors are toasted by the interceptor.
      this.deleting.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.organizations.set(await this.auth.listOrganizations());
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }
}
