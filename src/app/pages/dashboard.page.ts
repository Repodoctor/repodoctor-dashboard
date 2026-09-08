import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Overview</p>
        <h1 class="mt-1 text-3xl font-semibold">Welcome back{{ auth.user() ? ', ' + auth.user()!.displayName : '' }}</h1>
      </div>
      @if (loading()) {
        <div class="rd-card text-ink-200">Loading organizations…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else if (organizations().length === 0) {
        <div class="rd-card">
          <h2 class="text-lg font-medium">No organizations yet</h2>
          <p class="mt-2 text-sm text-ink-200">Create an organization to start connecting repositories.</p>
          <a routerLink="/organizations" class="rd-btn mt-4">Create organization</a>
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rd-card">
            <p class="text-xs uppercase text-ink-200">Organizations</p>
            <p class="mt-2 font-mono text-3xl text-moss-300">{{ organizations().length }}</p>
          </div>
          <div class="rd-card">
            <p class="text-xs uppercase text-ink-200">Repositories</p>
            <p class="mt-2 font-mono text-3xl text-moss-300">0</p>
            <p class="mt-2 text-xs text-ink-300">Ingestion ships in a later phase.</p>
          </div>
          <div class="rd-card">
            <p class="text-xs uppercase text-ink-200">Health score</p>
            <p class="mt-2 font-mono text-3xl text-moss-300">—</p>
            <p class="mt-2 text-xs text-ink-300">Deterministic scoring is defined in contracts.</p>
          </div>
        </div>
        <div class="rd-card">
          <h2 class="text-lg font-medium">Your organizations</h2>
          <ul class="mt-4 divide-y divide-ink-400">
            @for (org of organizations(); track org.id) {
              <li class="flex items-center justify-between py-3">
                <div>
                  <p class="font-medium">{{ org.name }}</p>
                  <p class="font-mono text-xs text-ink-200">{{ org.slug }} · {{ org.role }}</p>
                </div>
                <a class="rd-btn-ghost" [routerLink]="['/organizations', org.id]">Open</a>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class DashboardPage {
  readonly auth = inject(AuthService);
  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.refresh();
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.organizations.set(await this.auth.listOrganizations());
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
