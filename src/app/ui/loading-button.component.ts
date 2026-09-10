import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-button',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-flat-button
      [class]="hostClass()"
      [disabled]="disabled() || loading()"
      [attr.type]="type()"
      [color]="color()"
    >
      @if (loading()) {
        <mat-progress-spinner class="mr-2" diameter="18" mode="indeterminate" />
      }
      {{ loading() ? loadingLabel() : label() }}
    </button>
  `,
})
export class LoadingButtonComponent {
  readonly label = input.required<string>();
  readonly loadingLabel = input('Saving…');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('submit');
  readonly hostClass = input('');
  readonly color = input<string | undefined>(undefined);
}
