import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import type { Organization, OrganizationInvite, OrganizationMember } from '../core/models';
import { LoadingStateComponent } from '../ui/loading-state.component';

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
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-loading-state label="Loading members…" />
          </mat-card-content>
        </mat-card>
      } @else {
        @if (org()) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Members</mat-card-title>
          </mat-card-header>
          <mat-card-content class="space-y-4">
            @if (canAdmin()) {
              <form class="flex flex-wrap items-start gap-3" [formGroup]="inviteForm" (ngSubmit)="invite()">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-[16rem] flex-1">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="user@example.com" />
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-36">
                  <mat-label>Role</mat-label>
                  <mat-select formControlName="role">
                    @for (role of assignableRoles; track role) {
                      <mat-option [value]="role">{{ role }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-flat-button class="ml-auto" type="submit" [disabled]="inviteForm.invalid || inviting()">
                  {{ inviting() ? 'Inviting…' : 'Invite' }}
                </button>
              </form>
              <p class="text-xs text-ink-300">
                OWNER cannot be assigned here. VIEWER can read; MEMBER can analyze; ADMIN can manage.
              </p>
            }
            @if (invites().length > 0) {
              <div>
                <p class="mb-2 text-xs uppercase tracking-[0.16em] text-ink-300">Pending invites</p>
                <div class="rd-table-wrap rd-table-static">
                  <table mat-table [dataSource]="inviteData">
                    <ng-container matColumnDef="email">
                      <th mat-header-cell *matHeaderCellDef>Email</th>
                      <td mat-cell *matCellDef="let invite">
                        <span class="font-mono text-xs">{{ invite.email }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="role">
                      <th mat-header-cell *matHeaderCellDef>Role</th>
                      <td mat-cell *matCellDef="let invite">{{ invite.role }}</td>
                    </ng-container>
                    <ng-container matColumnDef="expires">
                      <th mat-header-cell *matHeaderCellDef>Expires</th>
                      <td mat-cell *matCellDef="let invite">{{ invite.expiresAt.slice(0, 10) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let invite">
                        @if (canAdmin()) {
                          <button mat-stroked-button type="button" (click)="copyInvite(invite)">Copy link</button>
                          <button mat-button color="warn" type="button" (click)="revokeInvite(invite)">Revoke</button>
                        }
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="inviteColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: inviteColumns"></tr>
                  </table>
                  <mat-paginator #invitePaginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
                </div>
              </div>
            }
            <div class="rd-table-wrap rd-table-static">
              <table mat-table [dataSource]="memberData">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let member">{{ member.displayName }}</td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let member">
                    <span class="font-mono text-xs text-ink-200">{{ member.email }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let member">
                    @if (canAdmin() && member.role !== 'OWNER') {
                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="!w-36">
                        <mat-select [value]="draftRole(member)" (selectionChange)="setDraftRole(member, $event.value)">
                          @for (role of assignableRoles; track role) {
                            <mat-option [value]="role">{{ role }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    } @else {
                      <span class="font-mono text-xs text-moss-200">{{ member.role }}</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let member">
                    @if (canAdmin() && member.role !== 'OWNER') {
                      <button mat-button color="warn" type="button" (click)="remove(member)">Remove</button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="memberColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: memberColumns"></tr>
              </table>
              <mat-paginator #memberPaginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
            </div>
            @if (canAdmin()) {
              <div class="flex justify-end">
                <button mat-flat-button type="button" [disabled]="!rolesDirty() || savingRoles()" (click)="saveRoles()">
                  {{ savingRoles() ? 'Saving…' : 'Save roles' }}
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
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
  readonly drafts = signal<Record<string, OrganizationMember['role']>>({});
  readonly loading = signal(true);
  readonly inviting = signal(false);
  readonly savingRoles = signal(false);
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<(typeof ASSIGNABLE_ROLES)[number]>('MEMBER'),
  });
  readonly memberColumns = ['name', 'email', 'role', 'actions'];
  readonly inviteColumns = ['email', 'role', 'expires', 'actions'];
  readonly memberData = new MatTableDataSource<OrganizationMember>([]);
  readonly inviteData = new MatTableDataSource<OrganizationInvite>([]);
  private readonly memberPaginator = viewChild<MatPaginator>('memberPaginator');
  private readonly invitePaginator = viewChild<MatPaginator>('invitePaginator');

  readonly canAdmin = () => {
    const role = this.org()?.role;
    return role === 'OWNER' || role === 'ADMIN';
  };

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
      const result = await this.auth.addMember(org.id, { email, role });
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
      await this.auth.revokeInvite(org.id, invite.id);
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
        changes.map((member) => this.auth.updateMember(org.id, member.userId, this.draftRole(member))),
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
      await this.auth.removeMember(org.id, member.userId);
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
      const [org, members, invites] = await Promise.all([
        this.auth.getOrganization(id),
        this.auth.listMembers(id).catch(() => [] as OrganizationMember[]),
        this.auth.listInvites(id).catch(() => [] as OrganizationInvite[]),
      ]);
      this.org.set(org);
      this.members.set(members);
      this.invites.set(invites);
      this.drafts.set({});
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
