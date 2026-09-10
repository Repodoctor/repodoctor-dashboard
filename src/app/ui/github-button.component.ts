import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-github-button',
  imports: [MatButtonModule],
  template: `
    <button mat-stroked-button class="w-full" type="button" [disabled]="disabled()" (click)="pressed.emit()">
      Continue with GitHub
    </button>
  `,
})
export class GithubButtonComponent {
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
