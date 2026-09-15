import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { AuthStore } from '../../../stores/auth.store';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScmService } from '../../../services/scm.service';
import { ToastService } from '../../../services/toast.service';
import { scmProviderLabel, type ScmProviderName } from '../../../utils/scm-providers';
import type { Workspace } from '../../../interfaces/api';
import { DataTableComponent } from '../../../components/data-table/data-table';
import { workspaceColumns } from '../../../utils/data-table-columns';

@Component({
  selector: 'app-scm-callback-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatProgressSpinnerModule, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scm-callback.html',
})
export class ScmCallbackPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scm = inject(ScmService);
  private readonly auth = inject(AuthStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);

  readonly workspaces = signal<Workspace[]>([]);
  readonly orgColumns = workspaceColumns();
  readonly needsOrg = signal(false);
  readonly saving = signal(false);
  readonly failed = signal(false);

  constructor() {
    void this.start();
  }

  label(): string {
    return scmProviderLabel(this.provider());
  }

  private provider(): ScmProviderName {
    const value = this.route.snapshot.paramMap.get('provider');
    if (value === 'gitlab' || value === 'bitbucket' || value === 'azure_devops') {
      return value;
    }
    return 'github';
  }

  private callbackQuery(): Record<string, string | null> {
    const query: Record<string, string | null> = {};
    this.route.snapshot.queryParamMap.keys.forEach((key) => {
      query[key] = this.route.snapshot.queryParamMap.get(key);
    });
    return query;
  }

  async complete(workspaceId: string): Promise<void> {
    this.needsOrg.set(false);
    this.saving.set(true);
    try {
      const result = await this.scm.connect(workspaceId, this.provider(), { callback: this.callbackQuery() });
      this.scm.clearPendingWorkspace();
      const count = result.repositories.length;
      this.toast.show(
        count === 1
          ? `Connected 1 repository from ${this.label()}.`
          : `Connected ${count} repositories from ${this.label()}.`,
        'success',
      );
      await this.finishConnect(workspaceId);
    } catch {
      this.failed.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  private async finishConnect(workspaceId: string): Promise<void> {
    const origin = window.location.origin;
    const isPopup = window.name === 'repodoctor-scm-install' || Boolean(window.opener && !window.opener.closed);
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: 'repodoctor-scm-connected', workspaceId }, origin);
      } catch {
        try {
          window.opener.location.assign(`/workspaces/${workspaceId}/integrations`);
        } catch {
          // Fall through to close or in-tab navigation.
        }
      }
    }
    if (isPopup) {
      window.close();
      return;
    }
    await this.router.navigate(['/workspaces', workspaceId, 'integrations']);
  }

  private async start(): Promise<void> {
    const ready = await this.auth.waitForSession();
    if (!ready) {
      this.failed.set(true);
      this.toast.show('Sign in again, then reconnect GitHub.', 'error');
      return;
    }
    const fromState = this.scm.workspaceIdFromState(this.route.snapshot.queryParamMap.get('state'));
    const workspaceId = fromState ?? this.scm.readPendingWorkspace();
    if (workspaceId) {
      await this.complete(workspaceId);
      return;
    }
    try {
      const items = await this.workspaceStore.listAll();
      this.workspaces.set(items);
      if (items.length === 1) {
        await this.complete(items[0]!.id);
        return;
      }
      if (items.length === 0) {
        this.failed.set(true);
        this.toast.show('Create a workspace before connecting source control.', 'error');
        return;
      }
      this.needsOrg.set(true);
    } catch {
      this.failed.set(true);
    }
  }
}
