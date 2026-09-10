import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AvatarComponent } from '../avatar/avatar';
import { APP_NAV_LINKS } from '../shell/nav-links';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-menu.html',
})
export class UserMenuComponent {
  readonly auth = inject(AuthStore);
  readonly links = APP_NAV_LINKS;
}
