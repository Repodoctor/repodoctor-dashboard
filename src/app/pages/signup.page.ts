import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-signup-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form class="w-full space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <p class="text-sm uppercase tracking-[0.2em] text-moss-400">RepoDoctor</p>
        <h1 class="text-3xl font-semibold">Create your workspace account</h1>
        <label class="block text-sm">Display name
          <input class="rd-input mt-1" formControlName="displayName" />
        </label>
        <label class="block text-sm">Email
          <input class="rd-input mt-1" type="email" formControlName="email" />
        </label>
        <label class="block text-sm">Password
          <input class="rd-input mt-1" type="password" formControlName="password" />
        </label>
        @if (error()) {
          <p class="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{{ error() }}</p>
        }
        <button class="rd-btn w-full" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating account…' : 'Sign up' }}
        </button>
        <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Already have an account</a>
      </form>
    </div>
  `,
})
export class SignupPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.signup(this.form.getRawValue());
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.error.set(errorMessage(error, 'Unable to create account'));
    } finally {
      this.loading.set(false);
    }
  }
}
