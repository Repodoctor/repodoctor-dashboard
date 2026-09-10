import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
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
          @if (inviteHint()) {
            <p class="rounded-md border border-moss-500/30 bg-ink-800 px-3 py-2 text-sm text-ink-200">
              {{ inviteHint() }}
            </p>
          }
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
          </mat-form-field>
          <button mat-flat-button class="w-full" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <mat-progress-spinner class="mr-2" diameter="18" mode="indeterminate" />
            }
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
          <button mat-stroked-button class="w-full" type="button" [disabled]="loading()" (click)="github()">
            Continue with GitHub
          </button>
          <div class="flex justify-between text-sm text-ink-200">
            <a routerLink="/signup" [queryParams]="inviteToken ? { invite: inviteToken } : {}" class="hover:text-moss-300">Create account</a>
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
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  readonly loading = signal(false);
  readonly inviteHint = signal<string | null>(null);
  inviteToken = '';
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('invite');
    if (token) {
      this.inviteToken = token;
      void this.auth
        .previewInvite(token)
        .then((preview) => {
          this.form.patchValue({ email: preview.email });
          this.inviteHint.set(`Join ${preview.organizationName} as ${preview.role} after you sign in.`);
        })
        .catch(() => undefined);
    }
  }

  async github(): Promise<void> {
    this.loading.set(true);
    try {
      await this.auth.signInWithGithub({
        invite: this.inviteToken || undefined,
        next: this.route.snapshot.queryParamMap.get('next') ?? undefined,
      });
    } catch (error) {
      this.loading.set(false);
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to start GitHub sign-in'), 'error');
      }
    }
  }

  async submit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.auth.login(this.form.getRawValue());
      if (this.inviteToken) {
        try {
          await this.auth.acceptInvite(this.inviteToken);
        } catch {
          // ensureUser also accepts pending invites for this email.
        }
      }
      await this.router.navigateByUrl(safeNext(this.route.snapshot.queryParamMap.get('next')));
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to sign in'), 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }
}

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return '/dashboard';
  }
  return raw;
}
