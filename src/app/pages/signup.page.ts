import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-signup-page',
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
              This email is already confirmed. Choose a password or continue with GitHub to finish.
            } @else {
              Email is filled from the invite. Choose a password or continue with GitHub.
            }
          </p>
        }
        <p class="text-sm text-ink-200">{{ hint }}</p>
        <mat-form-field appearance="outline">
          <mat-label>Display name</mat-label>
          <input
            matInput
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
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
            name="rd-signup-email"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="none"
            spellcheck="false"
            [readOnly]="locked().email || !!inviteToken()"
            (mousedown)="unlock('email')"
            (focus)="unlock('email')"
          />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            type="password"
            formControlName="password"
            name="rd-signup-password"
            autocomplete="new-password"
            [readOnly]="locked().password"
            (mousedown)="unlock('password')"
            (focus)="unlock('password')"
          />
          @if (form.controls.password.value) {
            <mat-icon matSuffix [class]="passwordValid() ? 'text-moss-400' : 'text-red-400'">
              {{ passwordValid() ? 'check' : 'close' }}
            </mat-icon>
          }
        </mat-form-field>
        <app-password-feedback [showStrength]="true" [password]="form.controls.password.value" />
        <mat-form-field appearance="outline">
          <mat-label>Confirm password</mat-label>
          <input
            matInput
            type="password"
            formControlName="confirmPassword"
            name="rd-signup-confirm-password"
            autocomplete="new-password"
            [readOnly]="locked().confirmPassword"
            (mousedown)="unlock('confirmPassword')"
            (focus)="unlock('confirmPassword')"
          />
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
        <button mat-flat-button class="w-full" [disabled]="form.invalid || loading()">
          @if (loading()) {
            <mat-progress-spinner class="mr-2" diameter="18" mode="indeterminate" />
          }
          {{ submitLabel() }}
        </button>
        <button mat-stroked-button class="w-full" type="button" [disabled]="loading()" (click)="github()">
          Continue with GitHub
        </button>
        @if (!inviteToken()) {
          <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Already have an account</a>
        }
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
          this.form.controls.email.disable();
        })
        .catch(() => {
          // HTTP errors are toasted by the interceptor.
        });
    }
  }

  passwordValid(): boolean {
    return meetsPasswordPolicy(this.form.controls.password.value);
  }

  passwordsEqual(): boolean {
    const { password, confirmPassword } = this.form.getRawValue();
    return password.length > 0 && password === confirmPassword;
  }

  unlock(field: 'displayName' | 'email' | 'password' | 'confirmPassword'): void {
    this.locked.update((current) => ({ ...current, [field]: false }));
  }

  submitLabel(): string {
    if (this.loading()) {
      return this.inviteToken() ? 'Saving…' : 'Creating account…';
    }
    return this.inviteToken() ? 'Create account' : 'Sign up';
  }

  async github(): Promise<void> {
    this.loading.set(true);
    try {
      await this.auth.signInWithGithub({ invite: this.inviteToken() || undefined });
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
      const { displayName, email, password } = this.form.getRawValue();
      if (this.inviteToken()) {
        await this.finishInvite(displayName, email, password);
        this.toast.show('You are signed in.', 'success');
        await this.router.navigateByUrl('/dashboard');
        return;
      }
      await this.auth.signup({ displayName, email, password });
      this.toast.show('Confirm your email, then sign in.', 'info');
      await this.router.navigateByUrl('/login');
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to create account'), 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async finishInvite(displayName: string, email: string, password: string): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await this.auth.setPassword(password, displayName);
    } else {
      try {
        await this.auth.signup({ displayName, email, password }, { keepSession: true });
      } catch (error) {
        const message = errorMessage(error, '').toLowerCase();
        if (!message.includes('already') && !message.includes('registered')) {
          throw error;
        }
        await this.auth.login({ email, password });
      }
      if (!this.auth.isAuthenticated()) {
        await this.auth.login({ email, password });
      }
    }
    try {
      await this.auth.acceptInvite(this.inviteToken());
    } catch {
      // ensureUser also attaches pending invites for this email.
    }
    await this.auth.loadProfile().catch(() => undefined);
  }
}
