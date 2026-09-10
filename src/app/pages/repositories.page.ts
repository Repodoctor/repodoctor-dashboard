import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import type { Repository } from '../core/models';
import { LoadingStateComponent } from '../ui/loading-state.component';
import { RepositoryTableComponent } from '../ui/repository-table.component';

@Component({
  selector: 'app-repositories-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, LoadingStateComponent, RepositoryTableComponent],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading repositories…" />
          </mat-card-content>
        </mat-card>
      } @else if (items().length === 0) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <p class="text-ink-200">No repositories yet. Install the GitHub App on this organization to import them.</p>
            <a mat-flat-button class="mt-4" [routerLink]="['/organizations', organizationId]">Open organization</a>
          </mat-card-content>
        </mat-card>
      } @else {
        <app-repository-table [repositories]="items()" (rowClick)="open($event)" />
      }
    </div>
  `,
})
export class RepositoriesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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

  open(repo: Repository): void {
    void this.router.navigate(['/repositories', repo.id, 'overview'], {
      queryParams: { organizationId: repo.organizationId },
    });
  }
}
