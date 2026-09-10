import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { PASSWORD_HINT, passwordRules, passwordStrength, passwordsMatch } from '../core/password-strength';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form class="w-full space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <p class="text-sm uppercase tracking-[0.2em] text-moss-400">RepoDoctor</p>
        <h1 class="text-3xl font-semibold">Choose a new password</h1>
        <p class="text-sm text-ink-200">{{ hint }}</p>
        @if (!auth.isAuthenticated()) {
          <p class="text-sm text-ink-200">
            This page is for the link in your reset email.
            <a routerLink="/forgot-password" class="text-moss-300 hover:text-moss-200">Request a new link</a>
            if it expired.
          </p>
        }
        <label class="block text-sm">New password
          <input class="rd-input mt-1" type="password" formControlName="password" autocomplete="new-password" />
        </label>
        @if (form.controls.password.value) {
          <p class="text-xs text-ink-200">{{ strength().label }}</p>
        }
        <label class="block text-sm">Confirm password
          <input class="rd-input mt-1" type="password" formControlName="confirmPassword" autocomplete="new-password" />
        </label>
        @if (form.hasError('mismatch') && form.touched) {
          <p class="text-sm text-red-200">Passwords do not match.</p>
        }
        @if (form.controls.password.touched && form.controls.password.hasError('passwordRules')) {
          <p class="text-sm text-red-200">{{ hint }}</p>
        }
        <button class="rd-btn w-full" [disabled]="form.invalid || loading() || !auth.isAuthenticated()">
          @if (loading()) {
            <span class="rd-spinner-sm mr-2"></span>
          }
          {{ loading() ? 'Saving…' : 'Save password' }}
        </button>
        <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Back to sign in</a>
      </form>
    </div>
  `,
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly hint = PASSWORD_HINT;
  readonly loading = signal(false);
  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, passwordRules()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    void this.auth.whenReady();
  }

  strength() {
    return passwordStrength(this.form.controls.password.value);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.auth.isAuthenticated()) return;
    this.loading.set(true);
    try {
      await this.auth.setPassword(this.form.controls.password.value);
      this.toast.show('Password saved. You can sign in with it from now on.', 'success');
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
