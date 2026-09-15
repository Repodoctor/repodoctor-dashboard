import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { firstValueFrom } from 'rxjs';
import { ScmService } from '../../../services/scm.service';
import { ToastService } from '../../../services/toast.service';
import { SCM_PROVIDERS, scmProviderLabel, type ScmProviderName } from '../../../utils/scm-providers';
import type { Workspace, Repository, ScmInstallation } from '../../../interfaces/api';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { SkeletonComponent } from '../../../components/skeleton/skeleton';
import { BusyOverlayComponent } from '../../../components/busy-overlay/busy-overlay';
import { isOrgAdmin } from '../../../utils/workspace-role';

interface ProviderRow {
  provider: ScmProviderName;
  installations: ScmInstallation[];
}

@Component({
  selector: 'app-workspace-integrations-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    SkeletonComponent,
    BusyOverlayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-integrations.html',
})
export class WorkspaceIntegrationsPage {
  private readonly workspaces = inject(WorkspaceStore);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly providers = SCM_PROVIDERS;
  readonly org = signal<Workspace | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<string | null>(null);
  readonly waitingPopup = signal(false);

  readonly canManage = () => isOrgAdmin(this.org()?.role);
  readonly canAdmin = () => isOrgAdmin(this.org()?.role);

  constructor() {
    const id = this.route.snapshot.paramMap.get('workspaceId');
    if (!id) {
      this.toast.show('Missing workspace id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  providerLabel(provider: ScmProviderName): string {
    return scmProviderLabel(provider);
  }

  providerMark(provider: ScmProviderName): string {
    if (provider === 'github') return 'GH';
    if (provider === 'gitlab') return 'GL';
    if (provider === 'bitbucket') return 'BB';
    return 'AZ';
  }

  providerRows(): ProviderRow[] {
    const groups = new Map<ScmProviderName, ScmInstallation[]>();
    for (const install of this.installations()) {
      const list = groups.get(install.provider) ?? [];
      list.push(install);
      groups.set(install.provider, list);
    }
    return [...groups.entries()].map(([provider, installations]) => ({ provider, installations }));
  }

  addableProviders() {
    const connected = new Set(this.installations().map((item) => item.provider));
    return this.providers.filter((item) => !connected.has(item.id));
  }

  connectionAccounts(row: ProviderRow): string[] {
    return [...new Set(row.installations.map((item) => item.accountLogin))];
  }

  connectionActor(row: ProviderRow): string {
    return this.connectionAccounts(row)[0] ?? row.provider;
  }

  visibleOrgNames(row: ProviderRow): string {
    return this.connectionAccounts(row).slice(0, 3).join(', ');
  }

  hiddenOrgCount(row: ProviderRow): number {
    return Math.max(0, this.connectionAccounts(row).length - 3);
  }

  async addProvider(provider: ScmProviderName, available: boolean): Promise<void> {
    if (!available) return;
    await this.openInstallPopup(provider);
  }

  async manage(row: ProviderRow): Promise<void> {
    const only = row.installations.length === 1 ? row.installations[0] : undefined;
    await this.openInstallPopup(row.provider, only?.externalInstallationId);
  }

  async reconnect(row: ProviderRow): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Reconnecting ${this.providerLabel(row.provider)}…`);
    try {
      let total = 0;
      for (const install of row.installations) {
        const result = await this.scm.connect(org.id, install.provider, {
          externalInstallationId: install.externalInstallationId,
        });
        total += result.repositories.length;
      }
      this.toast.show(total === 1 ? 'Refreshed 1 repository.' : `Refreshed ${total} repositories.`, 'success');
      await this.load(org.id);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.busy.set(null);
    }
  }

  async askDisconnect(row: ProviderRow): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: `Disconnect ${this.providerLabel(row.provider)}`,
            body: `Uninstalls every ${this.providerLabel(row.provider)} account and removes its imported repositories.`,
            confirm: 'Disconnect',
          },
        })
        .afterClosed(),
    );
    if (confirmed) {
      await this.disconnect(row);
    }
  }

  async disconnect(row: ProviderRow): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Disconnecting ${this.providerLabel(row.provider)}…`);
    try {
      for (const install of row.installations) {
        await this.scm.disconnect(org.id, install.id);
      }
      this.toast.show(`${this.providerLabel(row.provider)} disconnected.`, 'success');
      await this.load(org.id);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.busy.set(null);
    }
  }

  private async openInstallPopup(provider: ScmProviderName, externalInstallationId?: string): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Waiting for ${this.providerLabel(provider)}…`);
    this.waitingPopup.set(true);
    try {
      this.scm.rememberWorkspace(org.id);
      const { url } = await this.scm.getInstallUrl(org.id, provider, externalInstallationId);
      const popup = window.open(url, 'repodoctor-scm-install', 'popup=yes,width=980,height=780');
      if (!popup) {
        window.location.assign(url);
        return;
      }
      try {
        await this.scm.waitForPopupConnected();
      } catch {
        // Webhook ingest may still have completed if the window was closed early.
      }
      try {
        popup.close();
      } catch {
        // GitHub COOP may already have isolated the handle.
      }
      await this.load(org.id);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.busy.set(null);
      this.waitingPopup.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const org = await this.workspaces.get(id);
      this.org.set(org);
      if (!isOrgAdmin(org.role)) {
        await this.router.navigate(['/workspaces', id]);
        return;
      }
      const [installations, repositories] = await Promise.all([
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
      ]);
      this.installations.set(installations);
      this.repositories.set(repositories);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
