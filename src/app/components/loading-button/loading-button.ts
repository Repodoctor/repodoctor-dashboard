import { Component, input, ChangeDetectionStrategy, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common'; // 1. Import the directive
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-button',
  imports: [NgTemplateOutlet, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-button.html',
})
export class LoadingButtonComponent {
  readonly label = input.required<string>();
  readonly loadingLabel = input('Saving…');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly type = input<'basic' | 'stroke'>('basic');
  readonly hostClass = input('');
  readonly color = input<string | undefined>(undefined);
  readonly pressed = output<void>();
}
