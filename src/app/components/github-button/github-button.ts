import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-github-button',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './github-button.html',
})
export class GithubButtonComponent {
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
