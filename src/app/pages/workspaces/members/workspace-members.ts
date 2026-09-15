import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import type { Workspace, WorkspaceInvite, WorkspaceMember } from '../../../interfaces/api';
import { DataTableCellDirective } from '../../../components/data-table/data-table-cell.directive';
import { DataTableMobileDirective } from '../../../components/data-table/data-table-mobile.directive';
import { DataTableComponent } from '../../../components/data-table/data-table';
import type { DataTableColumn } from '../../../components/data-table/data-table.types';
import { SkeletonComponent } from '../../../components/skeleton/skeleton';
import { isOrgAdmin } from '../../../utils/workspace-role';
import { FREE_PLAN } from '../../../utils/plan';

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

@Component({
  selector: 'app-workspace-members-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SkeletonComponent,
    DataTableComponent,
    DataTableCellDirective,
    DataTableMobileDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-members.html',
})
export class WorkspaceMembersPage {
  private readonly workspaces = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly org = signal<Workspace | null>(null);
  readonly members = signal<WorkspaceMember[]>([]);
  readonly invites = signal<WorkspaceInvite[]>([]);
  readonly drafts = signal<Record<string, WorkspaceMember['role']>>({});
  readonly loading = signal(true);
  readonly inviting = signal(false);
  readonly savingRoles = signal(false);
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<(typeof ASSIGNABLE_ROLES)[number]>('MEMBER'),
  });
  readonly plan = FREE_PLAN;

  readonly canAdmin = () => isOrgAdmin(this.org()?.role);

  readonly inviteColumns = computed<DataTableColumn<WorkspaceInvite>[]>(() => {
    const cols: DataTableColumn<WorkspaceInvite>[] = [
      { key: 'email', header: 'Email', type: 'mono', value: (invite) => invite.email, mobile: 'title' },
      { key: 'role', header: 'Role', value: (invite) => invite.role, mobile: 'meta' },
      {
        key: 'expires',
        header: 'Expires',
        value: (invite) => invite.expiresAt.slice(0, 10),
        sortValue: (invite) => invite.expiresAt,
        mobile: 'meta',
      },
    ];
    if (this.canAdmin()) {
      cols.push({
        key: 'actions',
        header: '',
        type: 'custom',
        sortable: false,
        mobile: false,
      });
    }
    return cols;
  });

  readonly memberColumns = computed<DataTableColumn<WorkspaceMember>[]>(() => {
    const cols: DataTableColumn<WorkspaceMember>[] = [
      {
        key: 'name',
        header: 'Name',
        value: (member) => member.displayName,
        mobile: 'title',
      },
      {
        key: 'email',
        header: 'Email',
        type: 'mono',
        value: (member) => member.email,
        mobile: 'meta',
      },
      {
        key: 'role',
        header: 'Role',
        type: 'custom',
        sortValue: (member) => this.draftRole(member),
        mobile: false,
      },
    ];
    if (this.canAdmin()) {
      cols.push({
        key: 'actions',
        header: '',
        type: 'custom',
        sortable: false,
        mobile: false,
      });
    }
    return cols;
  });

  readonly rolesDirty = () =>
    this.members().some((member) => this.draftRole(member) !== member.role);

  constructor() {
    const id = this.route.snapshot.paramMap.get('workspaceId');
    if (!id) {
      this.toast.show('Missing workspace id', 'error');
      this.loading.set(false);
      return;
    }
    void this.load(id);
  }

  draftRole(member: WorkspaceMember): WorkspaceMember['role'] {
    return this.drafts()[member.userId] ?? member.role;
  }

  setDraftRole(member: WorkspaceMember, role: WorkspaceMember['role']): void {
    if (role === 'OWNER') return;
    this.drafts.update((current) => ({ ...current, [member.userId]: role }));
  }

  readonly trackMember = (member: WorkspaceMember) => member.userId;

  async invite(): Promise<void> {
    const org = this.org();
    if (!org || this.inviteForm.invalid) return;
    this.inviting.set(true);
    try {
      const { email, role } = this.inviteForm.getRawValue();
      const result = await this.workspaces.addMember(org.id, { email, role });
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

  async copyInvite(invite: WorkspaceInvite): Promise<void> {
    if (!invite.signupUrl) return;
    try {
      await navigator.clipboard.writeText(invite.signupUrl);
      this.toast.show('Signup link copied.', 'success');
    } catch {
      this.toast.show(invite.signupUrl, 'info');
    }
  }

  async revokeInvite(invite: WorkspaceInvite): Promise<void> {
    const org = this.org();
    if (!org) return;
    try {
      await this.workspaces.revokeInvite(org.id, invite.id);
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
        changes.map((member) => this.workspaces.updateMember(org.id, member.userId, this.draftRole(member))),
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

  async remove(member: WorkspaceMember): Promise<void> {
    const org = this.org();
    if (!org) return;
    try {
      await this.workspaces.removeMember(org.id, member.userId);
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
      const org = await this.workspaces.get(id);
      this.org.set(org);
      const members = await this.workspaces.listMembers(id).catch(() => [] as WorkspaceMember[]);
      this.members.set(members);
      if (isOrgAdmin(org.role)) {
        this.invites.set(await this.workspaces.listInvites(id).catch(() => [] as WorkspaceInvite[]));
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
