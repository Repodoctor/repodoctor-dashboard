import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth.service';
import { AvatarComponent } from './avatar.component';
import { APP_NAV_LINKS } from './nav-links';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, AvatarComponent],
  template: `
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line focus:outline-none focus:ring-2 focus:ring-pulse"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="'Account menu for ' + (auth.user()?.displayName || auth.user()?.email)"
    >
      <app-avatar
        [url]="auth.avatarUrl()"
        [name]="auth.user()?.displayName"
        [email]="auth.user()?.email"
        size="md"
      />
    </button>
    <mat-menu #menu="matMenu" xPosition="before" panelClass="rd-user-menu">
      <div class="flex items-center gap-3 px-4 py-3" (click)="$event.stopPropagation()">
        <app-avatar
          [url]="auth.avatarUrl()"
          [name]="auth.user()?.displayName"
          [email]="auth.user()?.email"
          size="md"
        />
        <div class="min-w-0">
          <p class="truncate font-medium">{{ auth.user()?.displayName }}</p>
          <p class="truncate font-mono text-xs text-ink-300">{{ auth.user()?.email }}</p>
        </div>
      </div>
      <hr class="my-1 border-line" />
      @for (item of links; track item.path) {
        <a mat-menu-item [routerLink]="item.path">
          <mat-icon>{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
      <hr class="my-1 border-line" />
      <button mat-menu-item type="button" (click)="auth.logout()">
        <mat-icon>logout</mat-icon>
        <span>Sign out</span>
      </button>
    </mat-menu>
  `,
})
export class UserMenuComponent {
  readonly auth = inject(AuthService);
  readonly links = APP_NAV_LINKS;
}
