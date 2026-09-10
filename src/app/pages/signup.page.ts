import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { PASSWORD_HINT, passwordRules, passwordStrength, passwordsMatch } from '../core/password-strength';

@Component({
  selector: 'app-signup-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form
        class="w-full space-y-4"
        [formGroup]="form"
        (ngSubmit)="submit()"
        autocomplete="off"
      >
        <p class="text-sm uppercase tracking-[0.2em] text-moss-400">RepoDoctor</p>
        <h1 class="text-3xl font-semibold">Create your workspace account</h1>
        @if (inviteOrg()) {
          <p class="rounded-md border border-moss-500/30 bg-ink-800 px-3 py-2 text-sm text-ink-200">
            You were invited to <span class="text-moss-200">{{ inviteOrg() }}</span> as {{ inviteRole() }}.
            @if (finishingInvite()) {
              Clicking the invite link confirmed this email. Choose a password to finish creating your account.
            }
          </p>
        }
        <p class="text-sm text-ink-200">{{ hint }}</p>
        <label class="block text-sm">Display name
          <input
            class="rd-input mt-1"
            formControlName="displayName"
            name="rd-signup-display-name"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="none"
            spellcheck="false"
            [readOnly]="locked().displayName"
            (mousedown)="unlock('displayName')"
            (focus)="unlock('displayName')"
          />
        </label>
        <label class="block text-sm">Email
          <input
            class="rd-input mt-1"
            type="email"
            formControlName="email"
            name="rd-signup-email"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="none"
            spellcheck="false"
            [readOnly]="locked().email"
            (mousedown)="unlock('email')"
            (focus)="unlock('email')"
          />
        </label>
        <label class="block text-sm">Password
          <input
            class="rd-input mt-1"
            type="password"
            formControlName="password"
            name="rd-signup-password"
            autocomplete="new-password"
            [readOnly]="locked().password"
            (mousedown)="unlock('password')"
            (focus)="unlock('password')"
          />
        </label>
        @if (form.controls.password.value) {
          <div>
            <div class="flex gap-1">
              @for (step of [1, 2, 3, 4]; track step) {
                <span
                  class="h-1.5 flex-1 rounded-full"
                  [class]="strength().score >= step ? 'bg-moss-400' : 'bg-ink-400'"
                ></span>
              }
            </div>
            <p class="mt-1 text-xs text-ink-200">{{ strength().label }}</p>
          </div>
        }
        <label class="block text-sm">Confirm password
          <input
            class="rd-input mt-1"
            type="password"
            formControlName="confirmPassword"
            name="rd-signup-confirm-password"
            autocomplete="new-password"
            [readOnly]="locked().confirmPassword"
            (mousedown)="unlock('confirmPassword')"
            (focus)="unlock('confirmPassword')"
          />
        </label>
        @if (form.hasError('mismatch') && form.touched) {
          <p class="text-sm text-red-200">Passwords do not match.</p>
        }
        @if (form.controls.password.touched && form.controls.password.hasError('passwordRules')) {
          <p class="text-sm text-red-200">{{ hint }}</p>
        }
        <button class="rd-btn w-full" [disabled]="form.invalid || loading()">
          @if (loading()) {
            <span class="rd-spinner-sm mr-2"></span>
          }
          {{ submitLabel() }}
        </button>
        <a routerLink="/login" [queryParams]="inviteToken() ? { invite: inviteToken() } : {}" class="block text-sm text-ink-200 hover:text-moss-300">Already have an account</a>
      </form>
    </div>
  `,
})
export class SignupPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  readonly loading = signal(false);
  readonly inviteOrg = signal<string | null>(null);
  readonly inviteRole = signal<string | null>(null);
  readonly inviteToken = signal('');
  readonly hint = PASSWORD_HINT;
  readonly finishingInvite = () => this.auth.isAuthenticated() && Boolean(this.inviteToken());
  readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordRules()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  readonly locked = signal({
    displayName: true,
    email: true,
    password: true,
    confirmPassword: true,
  });

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('invite');
    if (token) {
      this.inviteToken.set(token);
      void this.auth
        .previewInvite(token)
        .then((preview) => {
          this.inviteOrg.set(preview.organizationName);
          this.inviteRole.set(preview.role);
          this.form.patchValue({ email: preview.email });
          this.unlock('email');
        })
        .catch(() => {
          // HTTP errors are toasted by the interceptor.
        });
    }
  }

  strength() {
    return passwordStrength(this.form.controls.password.value);
  }

  unlock(field: 'displayName' | 'email' | 'password' | 'confirmPassword'): void {
    this.locked.update((current) => ({ ...current, [field]: false }));
  }

  submitLabel(): string {
    if (this.loading()) {
      return this.finishingInvite() ? 'Saving…' : 'Creating account…';
    }
    return this.finishingInvite() ? 'Create account' : 'Sign up';
  }

  async submit(): Promise<void> {
    this.loading.set(true);
    try {
      const { displayName, email, password } = this.form.getRawValue();
      if (this.finishingInvite()) {
        await this.auth.setPassword(password, displayName);
        try {
          await this.auth.acceptInvite(this.inviteToken());
        } catch {
          // ensureUser also attaches pending invites for this email.
        }
        this.toast.show('Account created. You can sign in with this password later.', 'success');
        await this.router.navigateByUrl('/dashboard');
        return;
      }
      await this.auth.signup({ displayName, email, password });
      this.toast.show('Confirm your email, then sign in.', 'info');
      await this.router.navigate(['/login'], {
        queryParams: this.inviteToken() ? { invite: this.inviteToken() } : undefined,
      });
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to create account'), 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
