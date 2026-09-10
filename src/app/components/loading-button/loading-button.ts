import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-button',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-button.html',
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
