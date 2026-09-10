import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ScmService } from '../../services/scm.service';
import { ToastService } from '../../services/toast.service';
import type { Repository } from '../../interfaces/api';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { RepositoryTableComponent } from '../../components/repository-table/repository-table';

@Component({
  selector: 'app-repositories-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, LoadingStateComponent, RepositoryTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repositories.html',
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
