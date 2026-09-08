import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="grid min-h-screen lg:grid-cols-2">
      <section class="hidden border-r border-ink-400 bg-ink-800 p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.2em] text-moss-400">RepoDoctor</p>
          <h1 class="mt-6 max-w-md text-4xl font-semibold leading-tight text-moss-100">
            See the architecture, not just the diff.
          </h1>
          <p class="mt-4 max-w-md text-ink-200">
            Connect repositories, run deterministic analyzers, and keep AI grounded in evidence.
          </p>
        </div>
        <p class="text-xs text-ink-300">Phases 1–4: authentication, organizations, and tenant isolation.</p>
      </section>
      <section class="flex items-center justify-center px-6 py-12">
        <form class="w-full max-w-sm space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <h2 class="text-2xl font-semibold">Sign in</h2>
          <label class="block text-sm">
            Email
            <input class="rd-input mt-1" type="email" formControlName="email" autocomplete="username" />
          </label>
          <label class="block text-sm">
            Password
            <input class="rd-input mt-1" type="password" formControlName="password" autocomplete="current-password" />
          </label>
          @if (error()) {
            <p class="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{{ error() }}</p>
          }
          <button class="rd-btn w-full" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
          <div class="flex justify-between text-sm text-ink-200">
            <a routerLink="/signup" class="hover:text-moss-300">Create account</a>
            <a routerLink="/forgot-password" class="hover:text-moss-300">Forgot password</a>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.error.set(errorMessage(error, 'Unable to sign in'));
    } finally {
      this.loading.set(false);
    }
  }
}
