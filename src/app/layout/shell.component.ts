import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen grid grid-cols-1 bg-ink text-cloud lg:grid-cols-[240px_1fr]">
      <aside class="border-b border-line bg-panel lg:border-b-0 lg:border-r">
        <div class="flex items-center gap-2 px-5 py-5">
          <span class="h-2.5 w-2.5 rounded-full bg-pulse"></span>
          <span class="font-mono text-sm tracking-[0.18em] text-pulse uppercase">RepoDoctor</span>
        </div>
        <nav class="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          @for (item of links; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-line text-cloud"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              class="whitespace-nowrap rounded-md px-3 py-2 text-sm text-mute transition hover:bg-line hover:text-cloud"
            >
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>
      <div class="min-w-0">
        <header class="flex items-center justify-between border-b border-line px-5 py-4">
          <p class="text-sm text-mute">Software engineering intelligence</p>
          <div class="flex items-center gap-3 text-sm">
            <span class="hidden text-cloud sm:inline">{{ auth.user()?.email }}</span>
            <button class="rd-btn-ghost" type="button" (click)="auth.logout()">Sign out</button>
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
