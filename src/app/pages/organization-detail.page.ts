import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { CatalogService } from '../core/catalog.service';
import { errorMessage } from '../core/error-message';
import type { Finding, Organization, Repository, ScmInstallation } from '../core/models';

@Component({
  selector: 'app-organization-detail-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading organization…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else {
        @if (org(); as current) {
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization</p>
            <h1 class="text-3xl font-semibold">{{ current.name }}</h1>
            <p class="font-mono text-sm text-ink-200">{{ current.slug }} · {{ current.role }}</p>
          </div>
          <a class="rd-btn-ghost" [routerLink]="['/organizations', current.id, 'settings']">Settings</a>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rd-card space-y-2">
            <h2 class="font-medium">GitHub</h2>
            @if (githubInstall(); as install) {
              <p class="text-sm text-ink-200">
                Installed on <span class="font-mono text-moss-200">{{ install.accountLogin }}</span>
              </p>
            } @else {
              <p class="text-sm text-ink-200">Not connected. Connect from organization settings.</p>
            }
          </div>
          <div class="rd-card space-y-2">
            <h2 class="font-medium">Access</h2>
            <p class="text-sm text-ink-200">Members and repository grants are managed in settings.</p>
            <a class="rd-btn-ghost" [routerLink]="['/organizations', current.id, 'settings', 'members']">Members</a>
          </div>
        </div>
        <div class="rd-card space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-medium">Repositories</h2>
            <a class="rd-btn-ghost" [routerLink]="['/organizations', current.id, 'repositories']">View all</a>
          </div>
          @if (repositories().length === 0) {
            <p class="text-sm text-ink-200">No repositories connected yet.</p>
          } @else {
            <div class="grid gap-2">
              @for (repo of repositories(); track repo.id) {
                <a
                  class="flex items-center justify-between rounded-md border border-ink-400 px-3 py-2 hover:border-moss-400"
                  [routerLink]="['/repositories', repo.id, 'overview']"
                  [queryParams]="{ organizationId: repo.organizationId }"
                >
                  <span>{{ repo.fullName }}</span>
                  <span class="font-mono text-xs text-ink-200">{{ repo.permission ?? repo.defaultBranch }}</span>
                </a>
              }
            </div>
          }
        </div>
        <div class="rd-card space-y-4">
          <h2 class="font-medium">Findings</h2>
          @if (findingsError()) {
            <p class="text-sm text-red-200">{{ findingsError() }}</p>
          } @else if (findings().length === 0) {
            <p class="text-sm text-ink-200">No findings yet for this organization.</p>
          } @else {
            <div class="space-y-2">
              @for (finding of findings(); track finding.id) {
                <a
                  class="block rounded-md border border-ink-400 px-3 py-2 hover:border-moss-400"
                  [routerLink]="['/repositories', finding.repositoryId, 'findings']"
                  [queryParams]="{ organizationId: finding.organizationId }"
                >
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium">{{ finding.title }}</p>
                    <span class="font-mono text-xs text-moss-200">{{ finding.severity }}</span>
                  </div>
                  <p class="mt-1 text-sm text-ink-200">{{ finding.description }}</p>
                </a>
              }
            </div>
          }
        </div>
        }
      }
    </div>
  `,
})
export class OrganizationDetailPage {
  private readonly auth = inject(AuthService);
  private readonly scm = inject(ScmService);
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);

  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly findingsError = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly githubInstall = () => this.installations().find((item) => item.provider === 'github') ?? null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.error.set('Missing organization id');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, installations, repositories, findings] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
        this.catalog.listFindings(id).catch((error) => {
          this.findingsError.set(errorMessage(error, 'Unable to load findings.'));
          return [] as Finding[];
        }),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.repositories.set(repositories);
      this.findings.set(findings);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
