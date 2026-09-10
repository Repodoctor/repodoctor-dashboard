import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../core/auth.service';
import { APP_NAV_LINKS } from './nav-links';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatListModule, UserMenuComponent],
  template: `
    <div class="min-h-screen grid grid-cols-1 bg-ink text-cloud lg:grid-cols-[240px_1fr]">
      <aside class="flex flex-col border-b border-line bg-panel lg:min-h-screen lg:border-b-0 lg:border-r">
        <div class="flex items-center gap-2 px-5 py-5">
          <span class="h-2.5 w-2.5 rounded-full bg-pulse"></span>
          <span class="font-mono text-sm tracking-[0.18em] text-pulse uppercase">RepoDoctor</span>
        </div>
        <mat-nav-list class="!flex-1 !px-2 !pb-3">
          @for (item of links; track item.path) {
            <a
              mat-list-item
              [routerLink]="item.path"
              routerLinkActive="mdc-list-item--activated"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
        <div class="mt-auto border-t border-line p-3">
          <button mat-button class="w-full !justify-start" type="button" (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div class="min-w-0">
        <header class="flex items-center justify-between border-b border-line px-5 py-4">
          <p class="text-sm text-mute">Software engineering intelligence</p>
          <app-user-menu />
        </header>
        <main class="px-5 py-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly links = APP_NAV_LINKS;
}
