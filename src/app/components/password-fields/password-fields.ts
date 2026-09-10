import { Component, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { meetsPasswordPolicy, PASSWORD_HINT } from '../../utils/password-strength';
import { PasswordFeedbackComponent } from '../password-feedback/password-feedback';

@Component({
  selector: 'app-password-fields',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, PasswordFeedbackComponent],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-fields.html',
})
export class PasswordFieldsComponent {
  private readonly parent = inject(FormGroupDirective);
  readonly showCurrent = input(false);
  readonly showHint = input(true);
  readonly lockUntilFocus = input(false);
  readonly currentLabel = input('Current password');
  readonly passwordLabel = input('Password');
  readonly confirmLabel = input('Confirm password');
  readonly currentName = input('current-password');
  readonly passwordName = input('password');
  readonly confirmName = input('confirm-password');
  readonly currentAutocomplete = input('current-password');
  readonly passwordAutocomplete = input('new-password');
  readonly hint = PASSWORD_HINT;
  private readonly unlocked = signal({ current: false, password: false, confirm: false });

  get passwordValue(): string {
    return String(this.parent.form.get('password')?.value ?? '');
  }

  get confirmValue(): string {
    return String(this.parent.form.get('confirmPassword')?.value ?? '');
  }

  get passwordTouched(): boolean {
    return Boolean(this.parent.form.get('password')?.touched);
  }

  get passwordInvalid(): boolean {
    return Boolean(this.parent.form.get('password')?.hasError('passwordRules'));
  }

  passwordValid(): boolean {
    return meetsPasswordPolicy(this.passwordValue);
  }

  passwordsEqual(): boolean {
    return this.passwordValue.length > 0 && this.passwordValue === this.confirmValue;
  }

  isLocked(field: 'current' | 'password' | 'confirm'): boolean {
    return this.lockUntilFocus() && !this.unlocked()[field];
  }

  unlock(field: 'current' | 'password' | 'confirm'): void {
    if (!this.lockUntilFocus()) return;
    this.unlocked.update((current) => ({ ...current, [field]: true }));
  }
}
