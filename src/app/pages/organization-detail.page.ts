import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { errorMessage } from '../core/error-message';
import type { Organization, OrganizationMember, Repository, ScmInstallation } from '../core/models';

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

@Component({
  selector: 'app-organization-detail-page',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading organization…</div>
      } @else if (error()) {
        <div class="rd-card border-red-500/40 text-red-200">{{ error() }}</div>
      } @else {
        @if (org(); as current) {
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Organization</p>
            <h1 class="text-3xl font-semibold">{{ current.name }}</h1>
            <p class="font-mono text-sm text-ink-200">{{ current.slug }} · {{ current.role }}</p>
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
            <div class="rd-card space-y-4">
              <h2 class="font-medium">Members</h2>
              @if (canAdmin()) {
                <form class="grid gap-2 sm:grid-cols-[1fr_auto_auto]" [formGroup]="inviteForm" (ngSubmit)="invite()">
                  <input class="rd-input" type="email" formControlName="email" placeholder="user@example.com" />
                  <select class="rd-input" formControlName="role">
                    @for (role of assignableRoles; track role) {
                      <option [value]="role">{{ role }}</option>
                    }
                  </select>
                  <button class="rd-btn" type="submit" [disabled]="inviteForm.invalid || inviting()">
                    {{ inviting() ? 'Adding…' : 'Add' }}
                  </button>
                </form>
                <p class="text-xs text-ink-300">They must already have a RepoDoctor account. OWNER cannot be assigned here.</p>
              }
              <div class="space-y-2">
                @for (member of members(); track member.userId) {
                  <div class="flex items-center justify-between gap-3 rounded-md border border-ink-400 px-3 py-2">
                    <div class="min-w-0">
                      <p class="truncate font-medium">{{ member.displayName }}</p>
                      <p class="truncate font-mono text-xs text-ink-200">{{ member.email }}</p>
                    </div>
                    @if (canAdmin() && member.role !== 'OWNER') {
                      <div class="flex items-center gap-2">
                        <select
                          class="rd-input py-1"
                          [value]="member.role"
                          (change)="changeRole(member, selectRole($event))"
                        >
                          @for (role of assignableRoles; track role) {
                            <option [value]="role">{{ role }}</option>
                          }
                        </select>
                        <button class="rd-btn-ghost text-red-200" type="button" (click)="remove(member)">Remove</button>
                      </div>
                    } @else {
                      <span class="font-mono text-xs text-moss-200">{{ member.role }}</span>
                    }
                  </div>
                }
              </div>
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
                    <span class="font-mono text-xs text-ink-200">{{ repo.defaultBranch }}</span>
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
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly members = signal<OrganizationMember[]>([]);
  readonly loading = signal(true);
  readonly connecting = signal(false);
  readonly inviting = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<(typeof ASSIGNABLE_ROLES)[number]>('MEMBER'),
  });

  readonly githubInstall = () => this.installations().find((item) => item.provider === 'github') ?? null;
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

  async invite(): Promise<void> {
    const org = this.org();
    if (!org || this.inviteForm.invalid) return;
    this.inviting.set(true);
    this.actionError.set(null);
    try {
      const { email, role } = this.inviteForm.getRawValue();
      const member = await this.auth.addMember(org.id, { email, role });
      this.members.set([...this.members().filter((item) => item.userId !== member.userId), member]);
      this.inviteForm.reset({ email: '', role: 'MEMBER' });
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to add that member. They must sign up first.'));
    } finally {
      this.inviting.set(false);
    }
  }

  selectRole(event: Event): OrganizationMember['role'] {
    return (event.target as HTMLSelectElement).value as OrganizationMember['role'];
  }

  async changeRole(member: OrganizationMember, role: OrganizationMember['role']): Promise<void> {
    const org = this.org();
    if (!org || role === 'OWNER') return;
    this.actionError.set(null);
    try {
      const updated = await this.auth.updateMember(org.id, member.userId, role);
      this.members.set(this.members().map((item) => (item.userId === updated.userId ? updated : item)));
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to update member role.'));
    }
  }

  async remove(member: OrganizationMember): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.actionError.set(null);
    try {
      await this.auth.removeMember(org.id, member.userId);
      this.members.set(this.members().filter((item) => item.userId !== member.userId));
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to remove that member.'));
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, installations, repositories, members] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
        this.auth.listMembers(id).catch(() => [] as OrganizationMember[]),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.repositories.set(repositories);
      this.members.set(members);
      if (!installations.length && !repositories.length) {
        this.actionError.set(null);
      }
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
