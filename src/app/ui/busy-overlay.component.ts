import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-busy-overlay',
  imports: [MatCardModule, MatProgressSpinnerModule],
  template: `
    @if (message()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/80">
        <mat-card appearance="outlined">
          <mat-card-content class="flex flex-col items-center gap-4 text-center">
            <mat-progress-spinner diameter="40" mode="indeterminate" />
            <p class="font-medium">{{ message() }}</p>
            @if (detail()) {
              <p class="max-w-xs text-sm text-ink-200">{{ detail() }}</p>
            }
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
})
export class BusyOverlayComponent {
  readonly message = input<string | null>(null);
  readonly detail = input('');
}
