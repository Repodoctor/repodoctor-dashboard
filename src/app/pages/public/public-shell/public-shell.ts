import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../../../stores/auth.store';
import { PUBLIC_NAV_LINKS } from '../public-nav';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-shell.html',
})
export class PublicShellComponent {
  readonly auth = inject(AuthStore);
  readonly links = PUBLIC_NAV_LINKS;
}
