import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form class="w-full space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <h1 class="text-3xl font-semibold">Reset password</h1>
        <p class="text-sm text-ink-200">
          If an account exists, the gateway accepts the request. Production sends mail through Supabase Auth.
        </p>
        <label class="block text-sm">Email
          <input class="rd-input mt-1" type="email" formControlName="email" />
        </label>
        @if (error()) {
          <p class="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{{ error() }}</p>
        }
        @if (success()) {
          <p class="rounded-md border border-moss-700 bg-ink-700 px-3 py-2 text-sm text-moss-200">
            If that email is registered, a reset message will be sent.
          </p>
        }
        <button class="rd-btn w-full" [disabled]="form.invalid || loading()">Send reset request</button>
        <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Back to sign in</a>
      </form>
    </div>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit(): Promise<void> {
    this.error.set(null);
    this.success.set(false);
    this.loading.set(true);
    try {
      await this.auth.forgotPassword(this.form.controls.email.value);
      this.success.set(true);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
