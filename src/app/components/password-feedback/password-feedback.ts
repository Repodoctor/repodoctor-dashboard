import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { passwordStrength } from '../../utils/password-strength';

@Component({
  selector: 'app-password-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-feedback.html',
})
export class PasswordFeedbackComponent {
  readonly password = input('');
  readonly confirm = input('');
  readonly showStrength = input(false);
  readonly showMatch = input(false);
  readonly steps = [1, 2, 3, 4];

  readonly strength = computed(() => passwordStrength(this.password()));
  readonly matches = computed(() => this.password().length > 0 && this.password() === this.confirm());
}
