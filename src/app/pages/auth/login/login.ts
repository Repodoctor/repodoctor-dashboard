import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../../stores/auth.store';
import { ToastService } from '../../../services/toast.service';
import { errorMessage, isHttpError } from '../../../utils/error-message';
import { LoadingButtonComponent } from '../../../components/loading-button/loading-button';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly workspaces = inject(WorkspaceStore);
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
      void this.workspaces
        .previewInvite(token)
        .then((preview) => {
          this.form.patchValue({ email: preview.email });
          this.inviteHint.set(`Join ${preview.workspaceName} as ${preview.role} after you sign in.`);
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
          await this.workspaces.acceptInvite(this.inviteToken);
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
