import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../../stores/organization.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../../stores/auth.store';
import { ToastService } from '../../../services/toast.service';
import { errorMessage, isHttpError } from '../../../utils/error-message';
import { passwordSetupDestination } from '../../../utils/auth-link';
import { passwordRules, passwordsMatch } from '../../../utils/password-strength';
import { AuthShellComponent } from '../../../components/auth-shell/auth-shell';
import { LoadingButtonComponent } from '../../../components/loading-button/loading-button';
import { PasswordFieldsComponent } from '../../../components/password-fields/password-fields';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './set-password.html',
})
export class SetPasswordPage {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthStore);
  private readonly organizations = inject(OrganizationStore);
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
    void this.auth.whenReady().then(async () => {
      if (this.auth.consumeAuthUrlError()) return;
      if (this.auth.hasPasswordSetupLink() && !this.auth.isAuthenticated()) {
        await this.auth.waitForSession();
      }
      const destination = passwordSetupDestination({
        hasSetupLink: this.auth.hasPasswordSetupLink(),
        pendingPassword: Boolean(this.auth.pendingPassword()),
        authenticated: this.auth.isAuthenticated(),
      });
      if (destination === '/') {
        this.auth.clearPendingPassword();
        await this.router.navigateByUrl('/', { replaceUrl: true });
        return;
      }
      if (destination === '/dashboard') {
        await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
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
          await this.organizations.acceptInvite(invite);
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
