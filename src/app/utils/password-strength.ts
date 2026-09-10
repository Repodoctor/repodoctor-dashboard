import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_HINT = 'At least 6 characters, with uppercase, lowercase, and a number.';

export function meetsPasswordPolicy(password: string): boolean {
  return password.length >= 6 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

export function passwordRules(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) return { passwordRules: true };
    return meetsPasswordPolicy(value) ? null : { passwordRules: true };
  };
}

export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  const labels = ['Does not meet requirements', 'Needs more', 'Needs more', 'Almost', 'Meets requirements'];
  return { score, label: password.length === 0 ? '' : labels[score] ?? 'Does not meet requirements' };
}

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}
