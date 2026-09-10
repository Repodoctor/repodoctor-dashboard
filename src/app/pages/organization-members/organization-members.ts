import { Component, effect, inject, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationStore } from '../../stores/organization.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import type { Organization, OrganizationInvite, OrganizationMember } from '../../interfaces/api';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { isOrgAdmin } from '../../utils/org-role';

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

@Component({
  selector: 'app-organization-members-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    LoadingStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-members.html',
})
export class OrganizationMembersPage {
  private readonly organizations = inject(OrganizationStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly org = signal<Organization | null>(null);
  readonly members = signal<OrganizationMember[]>([]);
  readonly invites = signal<OrganizationInvite[]>([]);
  readonly drafts = signal<Record<string, OrganizationMember['role']>>({});
  readonly loading = signal(true);
  readonly inviting = signal(false);
  readonly savingRoles = signal(false);
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<(typeof ASSIGNABLE_ROLES)[number]>('MEMBER'),
  });
  readonly memberData = new MatTableDataSource<OrganizationMember>([]);
  readonly inviteData = new MatTableDataSource<OrganizationInvite>([]);
  private readonly memberPaginator = viewChild<MatPaginator>('memberPaginator');
  private readonly invitePaginator = viewChild<MatPaginator>('invitePaginator');

  readonly canAdmin = () => isOrgAdmin(this.org()?.role);

  readonly memberColumns = () =>
    this.canAdmin() ? ['name', 'email', 'role', 'actions'] : ['name', 'email', 'role'];
  readonly inviteColumns = () =>
    this.canAdmin() ? ['email', 'role', 'expires', 'actions'] : ['email', 'role', 'expires'];

  readonly rolesDirty = () =>
    this.members().some((member) => this.draftRole(member) !== member.role);

  constructor() {
    effect(() => {
      this.memberData.data = this.members();
    });
    effect(() => {
      this.inviteData.data = this.invites();
    });
    effect(() => {
      const paginator = this.memberPaginator();
      if (paginator) this.memberData.paginator = paginator;
    });
    effect(() => {
      const paginator = this.invitePaginator();
      if (paginator) this.inviteData.paginator = paginator;
    });
    const id = this.route.snapshot.paramMap.get('organizationId');
    if (!id) {
      this.toast.show('Missing organization id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  draftRole(member: OrganizationMember): OrganizationMember['role'] {
    return this.drafts()[member.userId] ?? member.role;
  }

  setDraftRole(member: OrganizationMember, role: OrganizationMember['role']): void {
    if (role === 'OWNER') return;
    this.drafts.update((current) => ({ ...current, [member.userId]: role }));
  }

  async invite(): Promise<void> {
    const org = this.org();
    if (!org || this.inviteForm.invalid) return;
    this.inviting.set(true);
    try {
      const { email, role } = this.inviteForm.getRawValue();
      const result = await this.organizations.addMember(org.id, { email, role });
      if (result.member) {
        this.members.set([...this.members().filter((item) => item.userId !== result.member!.userId), result.member]);
        this.toast.show(`${result.member.email} was added.`, 'success');
      }
      if (result.invite) {
        this.invites.set([...this.invites().filter((item) => item.email !== result.invite!.email), result.invite]);
        this.toast.show('Invite created. The signup link is copied. Email can be delayed if the mail quota is busy.', 'success');
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
      await this.organizations.revokeInvite(org.id, invite.id);
      this.invites.set(this.invites().filter((item) => item.id !== invite.id));
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }

  async saveRoles(): Promise<void> {
    const org = this.org();
    if (!org || !this.canAdmin()) return;
    const changes = this.members().filter((member) => member.role !== 'OWNER' && this.draftRole(member) !== member.role);
    if (changes.length === 0) return;
    this.savingRoles.set(true);
    try {
      const updated = await Promise.all(
        changes.map((member) => this.organizations.updateMember(org.id, member.userId, this.draftRole(member))),
      );
      const byId = new Map(updated.map((item) => [item.userId, item]));
      this.members.set(this.members().map((item) => byId.get(item.userId) ?? item));
      this.drafts.set({});
      this.toast.show('Member roles saved.', 'success');
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.savingRoles.set(false);
    }
  }

  async remove(member: OrganizationMember): Promise<void> {
    const org = this.org();
    if (!org) return;
    try {
      await this.organizations.removeMember(org.id, member.userId);
      this.members.set(this.members().filter((item) => item.userId !== member.userId));
      this.drafts.update((current) => {
        const next = { ...current };
        delete next[member.userId];
        return next;
      });
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const org = await this.organizations.get(id);
      this.org.set(org);
      const members = await this.organizations.listMembers(id).catch(() => [] as OrganizationMember[]);
      this.members.set(members);
      if (isOrgAdmin(org.role)) {
        this.invites.set(await this.organizations.listInvites(id).catch(() => [] as OrganizationInvite[]));
      } else {
        this.invites.set([]);
      }
      this.drafts.set({});
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
