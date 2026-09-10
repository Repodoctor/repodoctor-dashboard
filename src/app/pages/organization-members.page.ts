import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { OrgSettingsNavComponent } from '../layout/org-settings-nav.component';
import type { Organization, OrganizationInvite, OrganizationMember } from '../core/models';

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

@Component({
  selector: 'app-organization-members-page',
  imports: [ReactiveFormsModule, OrgSettingsNavComponent],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="rd-card">Loading members…</div>
      } @else {
        @if (org(); as current) {
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Member permissions</p>
          <h1 class="text-3xl font-semibold">{{ current.name }}</h1>
          <p class="text-sm text-ink-200">Organization roles control who can invite, connect GitHub, and delete.</p>
        </div>
        <app-org-settings-nav [organizationId]="current.id" />
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
            <p class="text-xs text-ink-300">OWNER cannot be assigned here. VIEWER can read; MEMBER can analyze; ADMIN can manage.</p>
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
                  @if (canAdmin()) {
                    <div class="flex items-center gap-2">
                      <button class="rd-btn-ghost" type="button" (click)="copyInvite(invite)">Copy link</button>
                      <button class="rd-btn-ghost text-red-200" type="button" (click)="revokeInvite(invite)">Revoke</button>
                    </div>
                  }
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
                    <select class="rd-input py-1" [value]="member.role" (change)="changeRole(member, selectRole($event))">
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
        }
      }
    </div>
  `,
})
export class OrganizationMembersPage {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly org = signal<Organization | null>(null);
  readonly members = signal<OrganizationMember[]>([]);
  readonly invites = signal<OrganizationInvite[]>([]);
  readonly loading = signal(true);
  readonly inviting = signal(false);
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<(typeof ASSIGNABLE_ROLES)[number]>('MEMBER'),
  });

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

  async invite(): Promise<void> {
    const org = this.org();
    if (!org || this.inviteForm.invalid) return;
    this.inviting.set(true);
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
    } catch {
      // HTTP errors are toasted by the interceptor.
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
      this.toast.show(invite.signupUrl, 'info');
    }
  }

  async revokeInvite(invite: OrganizationInvite): Promise<void> {
    const org = this.org();
    if (!org) return;
    try {
      await this.auth.revokeInvite(org.id, invite.id);
      this.invites.set(this.invites().filter((item) => item.id !== invite.id));
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }

  selectRole(event: Event): OrganizationMember['role'] {
    return (event.target as HTMLSelectElement).value as OrganizationMember['role'];
  }

  async changeRole(member: OrganizationMember, role: OrganizationMember['role']): Promise<void> {
    const org = this.org();
    if (!org || role === 'OWNER') return;
    try {
      const updated = await this.auth.updateMember(org.id, member.userId, role);
      this.members.set(this.members().map((item) => (item.userId === updated.userId ? updated : item)));
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }

  async remove(member: OrganizationMember): Promise<void> {
    const org = this.org();
    if (!org) return;
    try {
      await this.auth.removeMember(org.id, member.userId);
      this.members.set(this.members().filter((item) => item.userId !== member.userId));
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const [org, members, invites] = await Promise.all([
        this.auth.getOrganization(id),
        this.auth.listMembers(id).catch(() => [] as OrganizationMember[]),
        this.auth.listInvites(id).catch(() => [] as OrganizationInvite[]),
      ]);
      this.org.set(org);
      this.members.set(members);
      this.invites.set(invites);
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
