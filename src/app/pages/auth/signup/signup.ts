import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../../stores/auth.store';
import { ToastService } from '../../../services/toast.service';
import { errorMessage, isHttpError } from '../../../utils/error-message';
import { passwordRules, passwordsMatch } from '../../../utils/password-strength';
import { AuthShellComponent } from '../../../components/auth-shell/auth-shell';
import { LoadingButtonComponent } from '../../../components/loading-button/loading-button';
import { PasswordFieldsComponent } from '../../../components/password-fields/password-fields';

@Component({
  selector: 'app-signup-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    AuthShellComponent,
    LoadingButtonComponent,
    PasswordFieldsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup.html',
})
export class SignupPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly workspaces = inject(WorkspaceStore);
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
      void this.workspaces
        .previewInvite(token)
        .then((preview) => {
          this.inviteOrg.set(preview.workspaceName);
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
      await this.workspaces.acceptInvite(this.inviteToken());
    } catch {
      // ensureUser also attaches pending invites for this email.
    }
    await this.auth.loadProfile().catch(() => undefined);
  }
}
