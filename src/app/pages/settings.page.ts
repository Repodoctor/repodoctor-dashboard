import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { PASSWORD_HINT, passwordRules, passwordStrength, passwordsMatch } from '../core/password-strength';
import type { Organization } from '../core/models';
import { OrganizationTableComponent } from '../ui/organization-table.component';

@Component({
  selector: 'app-settings-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    OrganizationTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Account</p>
        <h1 class="text-3xl font-semibold">Settings</h1>
        <p class="mt-1 text-sm text-ink-200">Personal profile and account deletion. Organization settings live on each organization.</p>
      </div>
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content class="space-y-4">
          <p class="font-mono text-sm text-ink-200">{{ auth.user()?.email }}</p>
          <form class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Display name</mat-label>
              <input matInput formControlName="displayName" />
            </mat-form-field>
            <button mat-flat-button class="sm:mt-1" type="submit" [disabled]="profileForm.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Password</mat-card-title>
        </mat-card-header>
        <mat-card-content class="space-y-4">
          @if (!changingPassword()) {
            <button mat-stroked-button type="button" (click)="changingPassword.set(true)">Change password</button>
          } @else {
            <form class="space-y-3" [formGroup]="passwordForm" (ngSubmit)="savePassword()">
              <p class="text-sm text-ink-200">{{ hint }}</p>
              <mat-form-field appearance="outline">
                <mat-label>Current password</mat-label>
                <input matInput type="password" formControlName="currentPassword" autocomplete="current-password" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>New password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="new-password" />
              </mat-form-field>
              @if (passwordForm.controls.password.value) {
                <p class="text-xs text-ink-200">{{ passwordStrengthLabel() }}</p>
              }
              <mat-form-field appearance="outline">
                <mat-label>Confirm new password</mat-label>
                <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
              </mat-form-field>
              @if (passwordForm.hasError('mismatch') && passwordForm.touched) {
                <p class="text-sm text-red-200">Passwords do not match.</p>
              }
              @if (passwordForm.controls.password.touched && passwordForm.controls.password.hasError('passwordRules')) {
                <p class="text-sm text-red-200">{{ hint }}</p>
              }
              <div class="flex flex-wrap gap-2">
                <button mat-flat-button type="submit" [disabled]="passwordForm.invalid || savingPassword()">
                  {{ savingPassword() ? 'Saving…' : 'Save' }}
                </button>
                <button mat-stroked-button type="button" (click)="cancelPasswordChange()">Cancel</button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Organizations you belong to</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (organizations().length === 0) {
            <p class="text-sm text-ink-200">You are not in any organizations.</p>
          } @else {
            <app-organization-table [organizations]="organizations()" (rowClick)="openOrgSettings($event)" />
          }
        </mat-card-content>
      </mat-card>
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title class="text-red-200">Delete account</mat-card-title>
        </mat-card-header>
        <mat-card-content class="space-y-4">
          <p class="text-sm text-ink-200">
            This signs you out and removes your RepoDoctor user. Organizations you <span class="font-medium">own</span>
            are deleted with their repositories, findings, and GitHub App installations. Organizations where you are only
            ADMIN, MEMBER, or VIEWER stay; you are removed from them.
          </p>
          @if (ownedOrgs().length > 0) {
            <p class="text-sm text-red-200">Owned organizations that will be deleted: {{ ownedNames() }}</p>
          }
          <mat-form-field appearance="outline">
            <mat-label>Type your email to confirm</mat-label>
            <input matInput [formControl]="confirmEmail" />
          </mat-form-field>
          <button
            mat-flat-button
            color="warn"
            type="button"
            [disabled]="confirmEmail.value !== auth.user()?.email || deleting()"
            (click)="deleteAccount()"
          >
            {{ deleting() ? 'Deleting…' : 'Delete my account' }}
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class SettingsPage {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

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

  openOrgSettings(org: Organization): void {
    void this.router.navigate(['/organizations', org.id, 'settings']);
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
