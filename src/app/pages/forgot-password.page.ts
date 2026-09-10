import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { errorMessage, isHttpError } from '../core/error-message';
import { AuthShellComponent } from '../ui/auth-shell.component';
import { LoadingButtonComponent } from '../ui/loading-button.component';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, AuthShellComponent, LoadingButtonComponent],
  template: `
    <app-auth-shell>
      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <h1 class="text-3xl font-semibold">Reset password</h1>
        <p class="text-sm text-ink-200">
          If an account exists, we send a reset email. That link opens a page to choose a new password.
        </p>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <app-loading-button
          hostClass="w-full"
          [disabled]="form.invalid"
          [loading]="loading()"
          label="Send reset request"
          loadingLabel="Sending…"
        />
        <a routerLink="/login" class="block text-sm text-ink-200 hover:text-moss-300">Back to sign in</a>
      </form>
    </app-auth-shell>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
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
