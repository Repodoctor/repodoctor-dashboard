import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { errorMessage } from '../core/error-message';
import type { Organization, Repository, ScmInstallation } from '../core/models';

@Component({
  selector: 'app-organization-detail-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading organization…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else if (org()) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization</p>
          <h1 class="text-3xl font-semibold">{{ org()!.name }}</h1>
          <p class="font-mono text-sm text-ink-200">{{ org()!.slug }}</p>
        </div>
        @if (actionError()) {
          <div class="rd-card border-red-500/40 text-red-200">{{ actionError() }}</div>
        }
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rd-card space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-medium">GitHub</h2>
                @if (githubInstall(); as install) {
                  <p class="mt-2 text-sm text-ink-200">
                    Installed on <span class="font-mono text-moss-200">{{ install.accountLogin }}</span>
                  </p>
                } @else {
                  <p class="mt-2 text-sm text-ink-200">
                    Install the RepoDoctor GitHub App to import repositories for this organization.
                  </p>
                }
              </div>
              @if (canManage()) {
                <button class="rd-btn shrink-0" type="button" [disabled]="connecting()" (click)="connectGithub()">
                  {{ connecting() ? 'Redirecting…' : githubInstall() ? 'Manage repos' : 'Connect GitHub' }}
                </button>
              }
            </div>
          </div>
          <div class="rd-card">
            <h2 class="font-medium">Members</h2>
            <p class="mt-2 text-sm text-ink-200">
              You are an authorized member of this tenant. The gateway rejects requests for organizations you do not belong to.
            </p>
          </div>
        </div>
        <div class="rd-card space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-medium">Repositories</h2>
            <a class="rd-btn-ghost" [routerLink]="['/organizations', org()!.id, 'repositories']">View all</a>
          </div>
          @if (repositories().length === 0) {
            <p class="text-sm text-ink-200">No repositories connected yet.</p>
          } @else {
            <div class="grid gap-2">
              @for (repo of repositories(); track repo.id) {
                <a class="flex items-center justify-between rounded-md border border-ink-400 px-3 py-2 hover:border-moss-400" [routerLink]="['/repositories', repo.id, 'overview']">
                  <span>{{ repo.fullName }}</span>
                  <span class="font-mono text-xs text-ink-200">{{ repo.defaultBranch }}</span>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class OrganizationDetailPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly route = inject(ActivatedRoute);
  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly loading = signal(true);
  readonly connecting = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly githubInstall = () => this.installations().find((item) => item.provider === 'github') ?? null;
  readonly canManage = () => {
    const role = this.org()?.role;
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
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

  async connectGithub(): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.connecting.set(true);
    this.actionError.set(null);
    try {
      this.scm.rememberOrganization(org.id);
      const { url } = await this.scm.getGithubInstallUrl(org.id);
      window.location.assign(url);
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to start GitHub App installation.'));
      this.connecting.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, memberships, installations, repositories] = await Promise.all([
        this.auth.getOrganization(id),
        this.auth.listOrganizations(),
        this.scm.listInstallations(id),
        this.scm.listRepositories(id),
      ]);
      const role = memberships.find((item) => item.id === id)?.role;
      this.org.set({ ...org, role });
      this.installations.set(installations);
      this.repositories.set(repositories);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
