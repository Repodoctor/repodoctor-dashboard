import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-busy-overlay',
  imports: [MatCardModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './busy-overlay.html',
})
export class BusyOverlayComponent {
  readonly message = input<string | null>(null);
  readonly detail = input('');
}
