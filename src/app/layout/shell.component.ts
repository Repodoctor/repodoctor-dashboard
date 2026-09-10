import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatListModule],
  template: `
    <div class="min-h-screen grid grid-cols-1 bg-ink text-cloud lg:grid-cols-[240px_1fr]">
      <aside class="border-b border-line bg-panel lg:border-b-0 lg:border-r">
        <div class="flex items-center gap-2 px-5 py-5">
          <span class="h-2.5 w-2.5 rounded-full bg-pulse"></span>
          <span class="font-mono text-sm tracking-[0.18em] text-pulse uppercase">RepoDoctor</span>
        </div>
        <mat-nav-list class="!px-2 !pb-3">
          @for (item of links; track item.path) {
            <a
              mat-list-item
              [routerLink]="item.path"
              routerLinkActive="mdc-list-item--activated"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            >
              {{ item.label }}
            </a>
          }
        </mat-nav-list>
      </aside>
      <div class="min-w-0">
        <header class="flex items-center justify-between border-b border-line px-5 py-4">
          <p class="text-sm text-mute">Software engineering intelligence</p>
          <div class="flex items-center gap-3 text-sm">
            <span class="hidden text-cloud sm:inline">{{ auth.user()?.email }}</span>
            <button mat-stroked-button type="button" (click)="auth.logout()">Sign out</button>
          </div>
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
  readonly links = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/organizations', label: 'Organizations' },
    { path: '/settings', label: 'Settings' },
  ];
}
