import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import type { Repository } from '../core/models';

@Component({
  selector: 'app-repositories-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization</p>
        <h1 class="text-3xl font-semibold">Repositories</h1>
      </div>
      @if (loading()) {
        <div class="rd-card">Loading repositories…</div>
      } @else if (items().length === 0) {
        <div class="rd-card">
          <p class="text-ink-200">No repositories yet. Install the GitHub App on this organization to import them.</p>
          <a class="rd-btn mt-4" [routerLink]="['/organizations', organizationId]">Open organization</a>
        </div>
      } @else {
        <div class="grid gap-3">
          @for (repo of items(); track repo.id) {
            <a class="rd-card block hover:border-moss-400" [routerLink]="['/repositories', repo.id, 'overview']" [queryParams]="{ organizationId: repo.organizationId }">
              <p class="font-medium">{{ repo.fullName }}</p>
              <p class="mt-1 font-mono text-xs text-ink-200">
                {{ repo.defaultBranch }} · {{ repo.private ? 'private' : 'public' }}
              </p>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class RepositoriesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);
  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly items = signal<Repository[]>([]);
  readonly loading = signal(true);

  constructor() {
    if (!this.organizationId) {
      this.toast.show('Missing organization id', 'error');
      this.loading.set(false);
      return;
    }
    void this.scm
      .listRepositories(this.organizationId)
      .then((items) => this.items.set(items))
      .catch(() => {
        // HTTP errors are toasted by the interceptor.
      })
      .finally(() => this.loading.set(false));
  }
}
