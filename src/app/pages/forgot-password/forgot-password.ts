import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthStore } from '../../stores/auth.store';
import { ToastService } from '../../services/toast.service';
import { errorMessage, isHttpError } from '../../utils/error-message';
import { AuthShellComponent } from '../../components/auth-shell/auth-shell';
import { LoadingButtonComponent } from '../../components/loading-button/loading-button';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, AuthShellComponent, LoadingButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly loading = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.auth.forgotPassword(this.form.controls.email.value);
      this.toast.show('If an account exists, a reset email is on the way.', 'success');
      await this.router.navigateByUrl('/login');
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error), 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
