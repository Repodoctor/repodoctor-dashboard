import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { passwordRules, passwordsMatch } from '../core/password-strength';
import { AuthShellComponent } from '../ui/auth-shell.component';
import { LoadingButtonComponent } from '../ui/loading-button.component';
import { PasswordFieldsComponent } from '../ui/password-fields.component';

@Component({
  selector: 'app-set-password-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AuthShellComponent,
    LoadingButtonComponent,
    PasswordFieldsComponent,
  ],
  template: `
    <app-auth-shell>
      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <h1 class="text-3xl font-semibold">{{ title() }}</h1>
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
        <app-password-fields [passwordLabel]="isInvite() ? 'Password' : 'New password'" />
        <app-loading-button
          hostClass="w-full"
          [disabled]="form.invalid || !auth.isAuthenticated()"
          [loading]="loading()"
          label="Save password"
          loadingLabel="Saving…"
        />
        <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Back to sign in</a>
      </form>
    </app-auth-shell>
  `,
})
export class SetPasswordPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
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
      if (this.auth.consumeAuthUrlError()) return;
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
