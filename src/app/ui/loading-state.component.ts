import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex items-center gap-3 text-ink-200" [class.justify-center]="center()" [class.py-10]="center()">
      <mat-progress-spinner [diameter]="center() ? 40 : 24" mode="indeterminate" />
      @if (label()) {
        <span>{{ label() }}</span>
      }
    </div>
  `,
})
export class LoadingStateComponent {
  readonly label = input('');
  readonly center = input(false);
}
