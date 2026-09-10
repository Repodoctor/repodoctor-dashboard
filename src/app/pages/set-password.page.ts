import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { meetsPasswordPolicy, PASSWORD_HINT, passwordRules, passwordsMatch } from '../core/password-strength';
import { PasswordFeedbackComponent } from '../ui/password-feedback.component';

@Component({
  selector: 'app-set-password-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PasswordFeedbackComponent,
  ],
  template: `
    <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form class="w-full space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <p class="text-sm uppercase tracking-[0.2em] text-moss-400">RepoDoctor</p>
        <h1 class="text-3xl font-semibold">{{ title() }}</h1>
        <p class="text-sm text-ink-200">{{ hint }}</p>
        @if (!auth.isAuthenticated()) {
          <p class="text-sm text-ink-200">
            This page is for the link in your email. If it expired,
            <a routerLink="/forgot-password" class="text-moss-300 hover:text-moss-200">request a new one</a>.
          </p>
        }
        @if (isInvite()) {
          <mat-form-field appearance="outline">
            <mat-label>Display name</mat-label>
            <input matInput formControlName="displayName" autocomplete="nickname" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.value) {
            <mat-icon matSuffix [class]="passwordValid() ? 'text-moss-400' : 'text-red-400'">
              {{ passwordValid() ? 'check' : 'close' }}
            </mat-icon>
          }
        </mat-form-field>
        <app-password-feedback [showStrength]="true" [password]="form.controls.password.value" />
        <mat-form-field appearance="outline">
          <mat-label>Confirm password</mat-label>
          <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
          @if (form.controls.confirmPassword.value) {
            <mat-icon matSuffix [class]="passwordsEqual() ? 'text-moss-400' : 'text-red-400'">
              {{ passwordsEqual() ? 'check' : 'close' }}
            </mat-icon>
          }
        </mat-form-field>
        <app-password-feedback
          [showMatch]="true"
          [password]="form.controls.password.value"
          [confirm]="form.controls.confirmPassword.value"
        />
        @if (form.controls.password.touched && form.controls.password.hasError('passwordRules')) {
          <p class="text-sm text-red-200">{{ hint }}</p>
        }
        <button mat-flat-button class="w-full" [disabled]="form.invalid || loading() || !auth.isAuthenticated()">
          @if (loading()) {
            <mat-progress-spinner class="mr-2" diameter="18" mode="indeterminate" />
          }
          {{ loading() ? 'Saving…' : 'Save password' }}
        </button>
        <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Back to sign in</a>
      </form>
    </div>
  `,
})
export class SetPasswordPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly hint = PASSWORD_HINT;
  readonly loading = signal(false);
  readonly form = this.fb.nonNullable.group(
    {
      displayName: [this.auth.user()?.displayName ?? ''],
      password: ['', [Validators.required, passwordRules()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    void this.auth.whenReady().then(() => {
      if (this.auth.isAuthenticated() && !this.auth.pendingPassword()) {
        void this.router.navigateByUrl('/dashboard');
        return;
      }
      const name = this.auth.user()?.displayName;
      if (name) this.form.patchValue({ displayName: name });
    });
  }

  isInvite(): boolean {
    return this.auth.pendingPassword() === 'invite';
  }

  title(): string {
    return this.isInvite() ? 'Create your password' : 'Choose a new password';
  }

  passwordValid(): boolean {
    return meetsPasswordPolicy(this.form.controls.password.value);
  }

  passwordsEqual(): boolean {
    const { password, confirmPassword } = this.form.getRawValue();
    return password.length > 0 && password === confirmPassword;
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.auth.isAuthenticated()) return;
    this.loading.set(true);
    try {
      const { password, displayName } = this.form.getRawValue();
      await this.auth.setPassword(password, this.isInvite() ? displayName : undefined);
      const invite = this.auth.pendingInviteToken();
      if (invite) {
        try {
          await this.auth.acceptInvite(invite);
        } catch {
          // ensureUser also attaches pending invites for this email.
        }
        this.auth.clearPendingInvite();
      }
      this.toast.show('Password saved. You are signed in.', 'success');
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to save password'), 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
