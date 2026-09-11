import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { APP_ACCOUNT_NAV, APP_PRIMARY_NAV } from './nav-links';
import { UserMenuComponent } from '../user-menu/user-menu';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatListModule, UserMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
})
export class ShellComponent {
  readonly primary = APP_PRIMARY_NAV;
  readonly account = APP_ACCOUNT_NAV;
  readonly auth = inject(AuthStore);
}
