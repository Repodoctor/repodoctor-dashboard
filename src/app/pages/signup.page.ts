import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { passwordRules, passwordsMatch } from '../core/password-strength';
import { AuthShellComponent } from '../ui/auth-shell.component';
import { GithubButtonComponent } from '../ui/github-button.component';
import { LoadingButtonComponent } from '../ui/loading-button.component';
import { PasswordFieldsComponent } from '../ui/password-fields.component';

@Component({
  selector: 'app-signup-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    AuthShellComponent,
    GithubButtonComponent,
    LoadingButtonComponent,
    PasswordFieldsComponent,
  ],
  template: `
    <app-auth-shell>
      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
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
        <app-password-fields
          [lockUntilFocus]="true"
          passwordName="rd-signup-password"
          confirmName="rd-signup-confirm-password"
        />
        <app-loading-button
          hostClass="w-full"
          [disabled]="form.invalid"
          [loading]="loading()"
          [label]="inviteToken() ? 'Create account' : 'Sign up'"
          [loadingLabel]="inviteToken() ? 'Saving…' : 'Creating account…'"
        />
        <app-github-button [disabled]="loading()" (pressed)="github()" />
        @if (!inviteToken()) {
          <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Already have an account</a>
        }
      </form>
    </app-auth-shell>
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

  unlock(field: 'displayName' | 'email'): void {
    this.locked.update((current) => ({ ...current, [field]: false }));
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
