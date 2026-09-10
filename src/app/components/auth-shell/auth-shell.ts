import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-shell.html',
})
export class AuthShellComponent {
  readonly center = input(false);
}
