import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CatalogService } from '../core/catalog.service';
import { errorMessage } from '../core/error-message';
import type { Finding, Organization } from '../core/models';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Overview</p>
        <h1 class="mt-1 text-3xl font-semibold">Welcome back{{ auth.user() ? ', ' + auth.user()!.displayName : '' }}</h1>
      </div>
      @if (loading()) {
        <div class="rd-card text-ink-200">Loading organizations…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else if (organizations().length === 0) {
        <div class="rd-card">
          <h2 class="text-lg font-medium">No organizations yet</h2>
          <p class="mt-2 text-sm text-ink-200">Create an organization to start connecting repositories.</p>
          <a routerLink="/organizations" class="rd-btn mt-4">Create organization</a>
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rd-card">
            <p class="text-xs uppercase text-ink-200">Organizations</p>
            <p class="mt-2 font-mono text-3xl text-moss-300">{{ organizations().length }}</p>
          </div>
          <div class="rd-card">
            <p class="text-xs uppercase text-ink-200">Repositories</p>
            <p class="mt-2 font-mono text-3xl text-moss-300">{{ repositoryCount() }}</p>
            <p class="mt-2 text-xs text-ink-300">Connected through GitHub App ingestion.</p>
          </div>
          <div class="rd-card">
            <p class="text-xs uppercase text-ink-200">Open findings</p>
            <p class="mt-2 font-mono text-3xl text-moss-300">{{ openFindings().length }}</p>
            <p class="mt-2 text-xs text-ink-300">Across every organization you can access.</p>
          </div>
        </div>
        @if (findings().length > 0) {
          <div class="rd-card space-y-3">
            <h2 class="text-lg font-medium">Organization findings</h2>
            <ul class="divide-y divide-ink-400">
              @for (finding of findings().slice(0, 8); track finding.id) {
                <li class="py-3">
                  <a
                    class="flex items-start justify-between gap-3 hover:text-moss-300"
                    [routerLink]="['/repositories', finding.repositoryId, 'findings']"
                    [queryParams]="{ organizationId: finding.organizationId }"
                  >
                    <div>
                      <p class="font-medium">{{ finding.title }}</p>
                      <p class="mt-1 font-mono text-xs text-ink-200">{{ finding.severity }} · {{ finding.source }} · {{ finding.status }}</p>
                    </div>
                  </a>
                </li>
              }
            </ul>
          </div>
        }
        <div class="rd-card">
          <h2 class="text-lg font-medium">Your organizations</h2>
          <ul class="mt-4 divide-y divide-ink-400">
            @for (org of organizations(); track org.id) {
              <li class="flex items-center justify-between py-3">
                <div>
                  <p class="font-medium">{{ org.name }}</p>
                  <p class="font-mono text-xs text-ink-200">{{ org.slug }} · {{ org.role }}</p>
                </div>
                <a class="rd-btn-ghost" [routerLink]="['/organizations', org.id]">Open</a>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class DashboardPage {
  readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  readonly organizations = signal<Organization[]>([]);
  readonly repositoryCount = signal(0);
  readonly findings = signal<Finding[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly openFindings = () => this.findings().filter((item) => item.status === 'OPEN');

  constructor() {
    void this.refresh();
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const [organizations, repositories, findings] = await Promise.all([
        this.auth.listOrganizations(),
        this.catalog.listMyRepositories().catch(() => []),
        this.catalog.listFindings().catch(() => []),
      ]);
      this.organizations.set(organizations);
      this.repositoryCount.set(repositories.length);
      this.findings.set(findings);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
