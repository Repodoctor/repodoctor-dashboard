import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-in-progress',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './in-progress.html',
})
export class InProgressComponent {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly hint = input('This tab is routed so you can see where the feature will live.');
}
