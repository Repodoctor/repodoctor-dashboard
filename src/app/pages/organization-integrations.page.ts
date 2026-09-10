import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import { SCM_PROVIDERS, scmProviderLabel, type ScmProviderName } from '../core/scm-providers';
import type { Organization, Repository, ScmInstallation } from '../core/models';
import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';
import { LoadingStateComponent } from '../ui/loading-state.component';

interface ProviderRow {
  provider: ScmProviderName;
  installations: ScmInstallation[];
}

@Component({
  selector: 'app-organization-integrations-page',
  imports: [
    OrgSettingsNavComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    LoadingStateComponent,
  ],
  template: `
    <div class="space-y-6">
      @if (busy()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/80">
          <mat-card appearance="outlined">
            <mat-card-content class="flex flex-col items-center gap-4 text-center">
              <mat-progress-spinner diameter="40" mode="indeterminate" />
              <p class="font-medium">{{ busy() }}</p>
              @if (waitingPopup()) {
                <p class="max-w-xs text-sm text-ink-200">Finish the provider window. This page will update when it closes.</p>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading integrations…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (org(); as current) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization settings</p>
          <h1 class="text-3xl font-semibold">Integrations</h1>
          <p class="mt-1 text-sm text-ink-200">Connect external tools to extend your team's workflow.</p>
        </div>
        <app-org-settings-nav [organizationId]="current.id" />
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-medium text-ink-200">Source Control</h2>
            @if (canManage()) {
              <button mat-stroked-button type="button" [matMenuTriggerFor]="addMenu">
                Add Provider
                <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
              </button>
              <mat-menu #addMenu="matMenu">
                @for (provider of addableProviders(); track provider.id) {
                  <button
                    mat-menu-item
                    type="button"
                    [disabled]="!provider.available"
                    (click)="addProvider(provider.id, provider.available)"
                  >
                    <span>{{ provider.label }}</span>
                    <span class="ml-2 text-xs text-ink-300">{{ provider.description }}</span>
                  </button>
                }
              </mat-menu>
            }
          </div>
          <div class="divide-y divide-line overflow-visible rounded-xl border border-line bg-panel">
            @if (providerRows().length === 0) {
              <p class="px-5 py-8 text-sm text-ink-300">No source-control accounts yet. Add a provider to import repositories.</p>
            }
            @for (row of providerRows(); track row.provider) {
              <div class="flex items-center gap-4 px-5 py-4">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ink-400 text-xs font-semibold">
                  {{ providerMark(row.provider) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ providerLabel(row.provider) }}</p>
                  <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-200">
                    <span>
                      Connect as
                      <span class="font-medium text-moss-100">{{ connectionActor(row) }}</span>
                      @if (connectionAccounts(row).length > 0) {
                        to {{ connectionAccounts(row).length }}
                        {{ connectionAccounts(row).length === 1 ? 'organization' : 'organizations' }}
                      }
                    </span>
                    @if (row.provider === 'github' && connectionAccounts(row).length > 0) {
                      <span class="inline-flex items-center pl-1">
                        @for (login of connectionAccounts(row); track login) {
                          <img
                            class="-ml-1 h-5 w-5 rounded-full ring-2 ring-ink-700 first:ml-0"
                            [src]="'https://github.com/' + login + '.png?size=40'"
                            [alt]="login"
                          />
                        }
                      </span>
                      @if (connectionAccounts(row).length > 1) {
                        <span class="truncate">
                          {{ visibleOrgNames(row) }}
                          @if (hiddenOrgCount(row) > 0) {
                            <span class="text-ink-300">, +{{ hiddenOrgCount(row) }}</span>
                          }
                        </span>
                      }
                    }
                  </p>
                </div>
                @if (canManage()) {
                  <button mat-stroked-button type="button" [matMenuTriggerFor]="manageMenu">
                    Manage
                    <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
                  </button>
                  <mat-menu #manageMenu="matMenu">
                    <button mat-menu-item type="button" (click)="addProvider(row.provider, true)">
                      Add organization
                    </button>
                    <button mat-menu-item type="button" (click)="manage(row)">
                      Manage in {{ providerLabel(row.provider) }}
                    </button>
                    <button mat-menu-item type="button" (click)="reconnect(row)">Reconnect</button>
                    @if (canAdmin()) {
                      <button mat-menu-item type="button" (click)="askDisconnect(row)">Disconnect</button>
                    }
                  </mat-menu>
                }
              </div>
            }
          </div>
        </section>
        }
      }
    </div>
  `,
})
export class OrganizationIntegrationsPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly providers = SCM_PROVIDERS;
  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<string | null>(null);
  readonly waitingPopup = signal(false);

  readonly canManage = () => {
    const role = this.org()?.role;
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  };
  readonly canAdmin = () => {
    const role = this.org()?.role;
    return role === 'OWNER' || role === 'ADMIN';
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.toast.show('Missing organization id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'repodoctor-scm-connected') return;
      const organizationId = typeof event.data.organizationId === 'string' ? event.data.organizationId : id;
      void this.onScmConnected(organizationId);
    };
    window.addEventListener('message', onMessage);
    this.destroyRef.onDestroy(() => window.removeEventListener('message', onMessage));
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
      this.scm.rememberOrganization(org.id);
      const { url } = await this.scm.getInstallUrl(org.id, provider, externalInstallationId);
      const popup = window.open(url, 'repodoctor-scm-install', 'popup=yes,width=980,height=780');
      if (!popup) {
        window.location.assign(url);
        return;
      }
      await this.waitForPopup(popup);
      await this.load(org.id);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.busy.set(null);
      this.waitingPopup.set(false);
    }
  }

  private async onScmConnected(organizationId: string): Promise<void> {
    this.waitingPopup.set(false);
    this.busy.set(null);
    await this.load(organizationId);
  }

  private waitForPopup(popup: Window): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.clearInterval(timer);
        window.removeEventListener('message', onMessage);
        resolve();
      };
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'repodoctor-scm-connected') return;
        try {
          popup.close();
        } catch {
          // The callback window also tries to close itself.
        }
        finish();
      };
      const timer = window.setInterval(() => {
        if (popup.closed) finish();
      }, 400);
      window.addEventListener('message', onMessage);
    });
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, installations, repositories] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.repositories.set(repositories);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
