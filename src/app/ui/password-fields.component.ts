import { Component, inject, input, signal } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { meetsPasswordPolicy, PASSWORD_HINT } from '../core/password-strength';
import { PasswordFeedbackComponent } from './password-feedback.component';

@Component({
  selector: 'app-password-fields',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, PasswordFeedbackComponent],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  template: `
    @if (showHint()) {
      <p class="text-sm text-ink-200">{{ hint }}</p>
    }
    @if (showCurrent()) {
      <mat-form-field appearance="outline">
        <mat-label>{{ currentLabel() }}</mat-label>
        <input
          matInput
          type="password"
          formControlName="currentPassword"
          [attr.name]="currentName()"
          [autocomplete]="currentAutocomplete()"
          [readOnly]="isLocked('current')"
          (mousedown)="unlock('current')"
          (focus)="unlock('current')"
        />
      </mat-form-field>
    }
    <mat-form-field appearance="outline">
      <mat-label>{{ passwordLabel() }}</mat-label>
      <input
        matInput
        type="password"
        formControlName="password"
        [attr.name]="passwordName()"
        [autocomplete]="passwordAutocomplete()"
        [readOnly]="isLocked('password')"
        (mousedown)="unlock('password')"
        (focus)="unlock('password')"
      />
      @if (passwordValue) {
        <mat-icon matSuffix [class]="passwordValid() ? 'text-moss-400' : 'text-red-400'">
          {{ passwordValid() ? 'check' : 'close' }}
        </mat-icon>
      }
    </mat-form-field>
    <app-password-feedback [showStrength]="true" [password]="passwordValue" />
    <mat-form-field appearance="outline">
      <mat-label>{{ confirmLabel() }}</mat-label>
      <input
        matInput
        type="password"
        formControlName="confirmPassword"
        [attr.name]="confirmName()"
        autocomplete="new-password"
        [readOnly]="isLocked('confirm')"
        (mousedown)="unlock('confirm')"
        (focus)="unlock('confirm')"
      />
      @if (confirmValue) {
        <mat-icon matSuffix [class]="passwordsEqual() ? 'text-moss-400' : 'text-red-400'">
          {{ passwordsEqual() ? 'check' : 'close' }}
        </mat-icon>
      }
    </mat-form-field>
    <app-password-feedback [showMatch]="true" [password]="passwordValue" [confirm]="confirmValue" />
    @if (passwordTouched && passwordInvalid) {
      <p class="text-sm text-red-200">{{ hint }}</p>
    }
  `,
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
