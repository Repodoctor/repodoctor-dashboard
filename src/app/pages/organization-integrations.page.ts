import { Component, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/error-message';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import { SCM_PROVIDERS, scmProviderLabel, type ScmProviderName } from '../core/scm-providers';
import type { Organization, Repository, ScmInstallation } from '../core/models';

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
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else {
        @if (org(); as current) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization settings</p>
          <h1 class="text-3xl font-semibold">Integrations</h1>
          <p class="mt-1 text-sm text-ink-200">Connect external tools to extend your team's workflow.</p>
        </div>
        <app-org-settings-nav [organizationId]="current.id" />
        @if (actionError()) {
          <div class="rd-card border-red-500/40 text-red-200">{{ actionError() }}</div>
        }
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
                    @for (provider of providers; track provider.id) {
                      <button class="rd-menu-item" type="button" (click)="addProvider(provider.id)">
                        <span class="font-medium">{{ provider.label }}</span>
                        <span class="text-xs text-ink-300">{{ provider.description }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
          <div class="divide-y divide-ink-400 overflow-visible rounded-xl border border-ink-400 bg-ink-700/80">
            @if (installations().length === 0) {
              <p class="px-5 py-8 text-sm text-ink-300">No source-control accounts yet. Add a provider to import repositories.</p>
            }
            @for (install of installations(); track install.id) {
              <div class="flex items-center gap-4 px-5 py-4">
                <div class="flex h-9 w-9 items-center justify-center rounded-md border border-ink-400 text-xs font-semibold">
                  {{ providerMark(install.provider) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ providerLabel(install.provider) }}</p>
                  <p class="truncate text-sm text-ink-200">
                    Connected as
                    <span class="font-mono text-moss-200">{{ install.accountLogin }}</span>
                    <span> · {{ repoSummary(install.id) }}</span>
                  </p>
                </div>
                @if (canManage()) {
                  <div class="relative z-50">
                    <button class="rd-btn-ghost" type="button" (click)="toggleManage($event, install.id)">
                      Manage
                      <span class="ml-2 text-xs text-ink-300">▾</span>
                    </button>
                    @if (openMenu() === install.id) {
                      <div class="rd-menu" (click)="$event.stopPropagation()">
                        <button class="rd-menu-item" type="button" (click)="manage(install)">
                          Manage in {{ providerLabel(install.provider) }}
                        </button>
                        <button class="rd-menu-item" type="button" (click)="reconnect(install)">Reconnect</button>
                        @if (canAdmin()) {
                          <button class="rd-menu-item text-red-200" type="button" (click)="askDisconnect(install)">
                            Disconnect
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
              @if (confirmId() === install.id) {
                <div class="space-y-3 border-t border-ink-400 px-5 py-4">
                  <p class="text-sm text-ink-200">
                    Uninstalls this {{ providerLabel(install.provider) }} account and removes its imported repositories.
                    Other connected accounts stay.
                  </p>
                  <div class="flex gap-2">
                    <button class="rd-btn" type="button" (click)="disconnect(install)">Disconnect</button>
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
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

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
      this.error.set('Missing organization id');
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

  repoCount(installationId: string): number {
    return this.repositories().filter((repo) => repo.installationId === installationId).length;
  }

  repoSummary(installationId: string): string {
    const count = this.repoCount(installationId);
    return count === 1 ? '1 repository' : `${count} repositories`;
  }

  toggleAdd(event: Event): void {
    event.stopPropagation();
    this.openMenu.set(this.openMenu() === 'add' ? null : 'add');
  }

  toggleManage(event: Event, installationId: string): void {
    event.stopPropagation();
    this.openMenu.set(this.openMenu() === installationId ? null : installationId);
  }

  async addProvider(provider: ScmProviderName): Promise<void> {
    this.openMenu.set(null);
    await this.openInstallPopup(provider);
  }

  async manage(install: ScmInstallation): Promise<void> {
    this.openMenu.set(null);
    await this.openInstallPopup(install.provider, install.externalInstallationId);
  }

  async reconnect(install: ScmInstallation): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.openMenu.set(null);
    this.busy.set(`Reconnecting ${this.providerLabel(install.provider)}…`);
    this.actionError.set(null);
    try {
      const result = await this.scm.connect(org.id, install.provider, {
        externalInstallationId: install.externalInstallationId,
      });
      this.toast.show(
        result.repositories.length === 1
          ? 'Refreshed 1 repository.'
          : `Refreshed ${result.repositories.length} repositories.`,
        'success',
      );
      await this.load(org.id);
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to reconnect this installation.'));
    } finally {
      this.busy.set(null);
    }
  }

  askDisconnect(install: ScmInstallation): void {
    this.openMenu.set(null);
    this.confirmId.set(install.id);
  }

  async disconnect(install: ScmInstallation): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Disconnecting ${this.providerLabel(install.provider)}…`);
    this.actionError.set(null);
    try {
      await this.scm.disconnect(org.id, install.id);
      this.confirmId.set(null);
      this.toast.show(`${this.providerLabel(install.provider)} disconnected.`, 'success');
      await this.load(org.id);
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to disconnect this installation.'));
    } finally {
      this.busy.set(null);
    }
  }

  private async openInstallPopup(provider: ScmProviderName, externalInstallationId?: string): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.busy.set(`Waiting for ${this.providerLabel(provider)}…`);
    this.waitingPopup.set(true);
    this.actionError.set(null);
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
    } catch (error) {
      this.actionError.set(errorMessage(error, `Unable to start ${this.providerLabel(provider)}.`));
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
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
