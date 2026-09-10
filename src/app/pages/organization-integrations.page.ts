import { Component, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import { SCM_PROVIDERS, scmProviderLabel, type ScmProviderName } from '../core/scm-providers';
import type { Organization, Repository, ScmInstallation } from '../core/models';

interface ProviderRow {
  provider: ScmProviderName;
  installations: ScmInstallation[];
}

@Component({
  selector: 'app-organization-integrations-page',
  imports: [OrgSettingsNavComponent],
  template: `
    <div class="space-y-6">
      @if (busy()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/80">
          <div class="rd-card flex flex-col items-center gap-4 text-center">
            <div class="rd-spinner" role="status" aria-label="Processing"></div>
            <p class="font-medium">{{ busy() }}</p>
            @if (waitingPopup()) {
              <p class="max-w-xs text-sm text-ink-200">Finish the provider window. This page will update when it closes.</p>
            }
          </div>
        </div>
      }
      @if (loading()) {
        <div class="rd-card flex items-center gap-3">
          <div class="rd-spinner-sm" role="status" aria-label="Loading"></div>
          Loading integrations…
        </div>
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
              <div class="relative">
                <button class="rd-btn-ghost" type="button" (click)="toggleAdd($event)">
                  Add Provider
                  <span class="ml-2 text-xs text-ink-300">▾</span>
                </button>
                @if (openMenu() === 'add') {
                  <div class="rd-menu left-auto right-0 w-72" (click)="$event.stopPropagation()">
                    @for (provider of addableProviders(); track provider.id) {
                      <button
                        class="rd-menu-item"
                        type="button"
                        [disabled]="!provider.available"
                        (click)="addProvider(provider.id, provider.available)"
                      >
                        <span class="flex items-center gap-2 font-medium" [class.text-ink-300]="!provider.available">
                          {{ provider.label }}
                        </span>
                        <span class="text-xs text-ink-300">{{ provider.description }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
          <div class="divide-y divide-ink-400 overflow-visible rounded-xl border border-ink-400 bg-ink-700/80">
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
                  <div class="relative z-50">
                    <button class="rd-btn-ghost" type="button" (click)="toggleManage($event, row.provider)">
                      Manage
                      <span class="ml-2 text-xs text-ink-300">▾</span>
                    </button>
                    @if (openMenu() === row.provider) {
                      <div class="rd-menu" (click)="$event.stopPropagation()">
                        <button class="rd-menu-item" type="button" (click)="manage(row.provider)">
                          Manage in {{ providerLabel(row.provider) }}
                        </button>
                        <button class="rd-menu-item" type="button" (click)="reconnect(row)">Reconnect</button>
                        @if (canAdmin()) {
                          <button class="rd-menu-item text-red-200" type="button" (click)="askDisconnect(row.provider)">
                            Disconnect
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
              @if (confirmId() === row.provider) {
                <div class="space-y-3 border-t border-ink-400 px-5 py-4">
                  <p class="text-sm text-ink-200">
                    Uninstalls every {{ providerLabel(row.provider) }} account and removes its imported repositories.
                  </p>
                  <div class="flex gap-2">
                    <button class="rd-btn" type="button" (click)="disconnect(row)">Disconnect</button>
                    <button class="rd-btn-ghost" type="button" (click)="confirmId.set(null)">Cancel</button>
                  </div>
                </div>
              }
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

  readonly providers = SCM_PROVIDERS;
  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<string | null>(null);
  readonly waitingPopup = signal(false);
  readonly openMenu = signal<string | null>(null);
  readonly confirmId = signal<string | null>(null);

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
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenu.set(null);
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

  toggleAdd(event: Event): void {
    event.stopPropagation();
    this.openMenu.set(this.openMenu() === 'add' ? null : 'add');
  }

  toggleManage(event: Event, provider: ScmProviderName): void {
    event.stopPropagation();
    this.openMenu.set(this.openMenu() === provider ? null : provider);
  }

  async addProvider(provider: ScmProviderName, available: boolean): Promise<void> {
    if (!available) return;
    this.openMenu.set(null);
    await this.openInstallPopup(provider);
  }

  async manage(provider: ScmProviderName): Promise<void> {
    this.openMenu.set(null);
    await this.openInstallPopup(provider);
  }

  async reconnect(row: ProviderRow): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.openMenu.set(null);
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

  askDisconnect(provider: ScmProviderName): void {
    this.openMenu.set(null);
    this.confirmId.set(provider);
  }

  async disconnect(row: ProviderRow): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Disconnecting ${this.providerLabel(row.provider)}…`);
    try {
      for (const install of row.installations) {
        await this.scm.disconnect(org.id, install.id);
      }
      this.confirmId.set(null);
      this.toast.show(`${this.providerLabel(row.provider)} disconnected.`, 'success');
      await this.load(org.id);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.busy.set(null);
    }
  }

  private async openInstallPopup(provider: ScmProviderName): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Waiting for ${this.providerLabel(provider)}…`);
    this.waitingPopup.set(true);
    try {
      this.scm.rememberOrganization(org.id);
      const { url } = await this.scm.getInstallUrl(org.id, provider);
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

  private waitForPopup(popup: Window): Promise<void> {
    return new Promise((resolve) => {
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          resolve();
        }
      }, 400);
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
