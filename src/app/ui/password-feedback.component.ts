import { Component, computed, input } from '@angular/core';
import { passwordStrength } from '../core/password-strength';

@Component({
  selector: 'app-password-feedback',
  template: `
    @if (showStrength() && password()) {
      <div>
        <div class="flex gap-1">
          @for (step of steps; track step) {
            <span
              class="h-1.5 flex-1 rounded-full"
              [class]="strength().score >= step ? 'bg-moss-400' : 'bg-ink-400'"
            ></span>
          }
        </div>
        <p class="mt-1 text-xs text-ink-200">{{ strength().label }}</p>
      </div>
    }
    @if (showMatch() && confirm()) {
      <p class="text-xs" [class]="matches() ? 'text-moss-300' : 'text-red-400'">
        {{ matches() ? 'Passwords match' : 'Passwords do not match' }}
      </p>
    }
  `,
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
