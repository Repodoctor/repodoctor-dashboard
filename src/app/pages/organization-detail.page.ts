import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ScmService } from '../core/scm.service';
import { CatalogService } from '../core/catalog.service';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/error-message';
import type { Finding, Organization, OrganizationInvite, OrganizationMember, Repository, ScmInstallation } from '../core/models';

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
          @if (confirmDisconnect()) {
            <div class="rd-card space-y-3 border-red-500/40">
              <p class="font-medium">Disconnect GitHub?</p>
              <p class="text-sm text-ink-200">
                This uninstalls the GitHub App and removes imported repositories. The organization and members stay.
              </p>
              <div class="flex gap-2">
                <button class="rd-btn" type="button" [disabled]="disconnecting()" (click)="disconnectGithub()">
                  {{ disconnecting() ? 'Disconnecting…' : 'Disconnect GitHub' }}
                </button>
                <button class="rd-btn-ghost" type="button" [disabled]="disconnecting()" (click)="confirmDisconnect.set(false)">
                  Cancel
                </button>
              </div>
            </div>
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
                @if (canManage() || (canAdmin() && githubInstall())) {
                  <div class="flex shrink-0 flex-col items-end gap-2">
                    @if (canManage()) {
                      <button class="rd-btn shrink-0" type="button" [disabled]="connecting()" (click)="connectGithub()">
                        {{ connecting() ? 'Redirecting…' : githubInstall() ? 'Manage repos' : 'Connect GitHub' }}
                      </button>
                    }
                    @if (canAdmin() && githubInstall()) {
                      <button class="rd-btn-ghost text-red-200" type="button" [disabled]="disconnecting()" (click)="askDisconnect()">
                        {{ disconnecting() ? 'Disconnecting…' : 'Disconnect' }}
                      </button>
                    }
                  </div>
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
                    {{ inviting() ? 'Inviting…' : 'Invite' }}
                  </button>
                </form>
                <p class="text-xs text-ink-300">If they do not have an account yet, you get a signup link to share. OWNER cannot be assigned here.</p>
              }
              @if (invites().length > 0) {
                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.16em] text-ink-300">Pending invites</p>
                  @for (invite of invites(); track invite.id) {
                    <div class="flex items-center justify-between gap-3 rounded-md border border-ink-400 px-3 py-2">
                      <div class="min-w-0">
                        <p class="truncate font-mono text-xs text-moss-200">{{ invite.email }}</p>
                        <p class="text-xs text-ink-300">{{ invite.role }} · expires {{ invite.expiresAt.slice(0, 10) }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <button class="rd-btn-ghost" type="button" (click)="copyInvite(invite)">Copy link</button>
                        <button class="rd-btn-ghost text-red-200" type="button" (click)="revokeInvite(invite)">Revoke</button>
                      </div>
                    </div>
                  }
                </div>
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
                    <p class="mt-1 font-mono text-xs text-ink-300">{{ finding.source }} · {{ finding.status }}</p>
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
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly org = signal<Organization | null>(null);
  readonly installations = signal<ScmInstallation[]>([]);
  readonly repositories = signal<Repository[]>([]);
  readonly members = signal<OrganizationMember[]>([]);
  readonly invites = signal<OrganizationInvite[]>([]);
  readonly findings = signal<Finding[]>([]);
  readonly findingsError = signal<string | null>(null);
  readonly loading = signal(true);
  readonly connecting = signal(false);
  readonly disconnecting = signal(false);
  readonly confirmDisconnect = signal(false);
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

  askDisconnect(): void {
    this.confirmDisconnect.set(true);
    this.actionError.set(null);
  }

  async disconnectGithub(): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.disconnecting.set(true);
    this.actionError.set(null);
    try {
      await this.scm.disconnectGithub(org.id);
      this.installations.set([]);
      this.repositories.set([]);
      this.confirmDisconnect.set(false);
      this.toast.show('GitHub disconnected. The organization is unchanged.', 'success');
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to disconnect GitHub.'));
    } finally {
      this.disconnecting.set(false);
    }
  }

  async invite(): Promise<void> {
    const org = this.org();
    if (!org || this.inviteForm.invalid) return;
    this.inviting.set(true);
    this.actionError.set(null);
    try {
      const { email, role } = this.inviteForm.getRawValue();
      const result = await this.auth.addMember(org.id, { email, role });
      if (result.member) {
        this.members.set([...this.members().filter((item) => item.userId !== result.member!.userId), result.member]);
        this.toast.show(`${result.member.email} was added.`, 'success');
      }
      if (result.invite) {
        this.invites.set([...this.invites().filter((item) => item.email !== result.invite!.email), result.invite]);
        this.toast.show('Invite created. Copy the signup link to share it.', 'success');
        await this.copyInvite(result.invite);
      }
      this.inviteForm.reset({ email: '', role: 'MEMBER' });
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to invite that member.'));
    } finally {
      this.inviting.set(false);
    }
  }

  async copyInvite(invite: OrganizationInvite): Promise<void> {
    if (!invite.signupUrl) return;
    try {
      await navigator.clipboard.writeText(invite.signupUrl);
      this.toast.show('Signup link copied.', 'success');
    } catch {
      this.actionError.set(invite.signupUrl);
    }
  }

  async revokeInvite(invite: OrganizationInvite): Promise<void> {
    const org = this.org();
    if (!org) return;
    this.actionError.set(null);
    try {
      await this.auth.revokeInvite(org.id, invite.id);
      this.invites.set(this.invites().filter((item) => item.id !== invite.id));
    } catch (error) {
      this.actionError.set(errorMessage(error, 'Unable to revoke that invite.'));
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
      const [org, installations, repositories, members, invites, findings] = await Promise.all([
        this.auth.getOrganization(id),
        this.scm.listInstallations(id).catch(() => [] as ScmInstallation[]),
        this.scm.listRepositories(id).catch(() => [] as Repository[]),
        this.auth.listMembers(id).catch(() => [] as OrganizationMember[]),
        this.auth.listInvites(id).catch(() => [] as OrganizationInvite[]),
        this.catalog.listFindings(id).catch((error) => {
          this.findingsError.set(errorMessage(error, 'Unable to load findings.'));
          return [] as Finding[];
        }),
      ]);
      this.org.set(org);
      this.installations.set(installations);
      this.repositories.set(repositories);
      this.members.set(members);
      this.invites.set(invites);
      this.findings.set(findings);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
