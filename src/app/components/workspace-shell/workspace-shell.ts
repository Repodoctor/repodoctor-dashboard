import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { WorkspaceStore } from '../../stores/workspace.store';
import { ToastService } from '../../services/toast.service';
import { WorkspaceSettingsNavComponent } from '../workspace-settings-nav/workspace-settings-nav';
import { PageHeaderComponent } from '../page-header/page-header';

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterOutlet, WorkspaceSettingsNavComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-shell.html',
})
export class WorkspaceShellComponent {
  private readonly workspaces = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly workspaceId = this.route.snapshot.paramMap.get('workspaceId') ?? '';
  readonly org = this.workspaces.current;

  constructor() {
    if (!this.workspaceId) {
      this.toast.show('Missing workspace id', 'error');
      return;
    }
    void this.workspaces.get(this.workspaceId).catch(() => undefined);
  }
}
