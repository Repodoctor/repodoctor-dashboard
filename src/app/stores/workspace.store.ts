import { Injectable, computed, inject, signal } from '@angular/core';
import { WorkspacesApi } from '../api/workspaces.api';
import type {
  Workspace,
  WorkspaceInvite,
  WorkspaceInvitePreview,
  WorkspaceMember,
} from '../interfaces/api';

/**
 * Shared workspace state.
 *
 * Pages fetch through this store so the current org (and list) survive
 * tab switches inside `/workspaces/:id` instead of each route
 * re-owning the same GET.
 *
 * This is a signal store, not NgRx: the app is still small, auth already
 * uses signals, and a Redux-style store would add ceremony without a
 * second client (desktop/mobile) sharing the same state machine.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly api = inject(WorkspacesApi);

  private readonly currentSignal = signal<Workspace | null>(null);
  private readonly listSignal = signal<Workspace[]>([]);

  readonly current = this.currentSignal.asReadonly();
  readonly list = this.listSignal.asReadonly();
  readonly hasCurrent = computed(() => this.currentSignal() !== null);

  async listAll(): Promise<Workspace[]> {
    const items = await this.api.list();
    this.listSignal.set(items);
    return items;
  }

  async create(input: { name: string; slug?: string }): Promise<Workspace> {
    const org = await this.api.create(input);
    this.listSignal.update((items) => [org, ...items.filter((item) => item.id !== org.id)]);
    return org;
  }

  async get(id: string): Promise<Workspace> {
    const org = await this.api.get(id);
    this.currentSignal.set(org);
    this.listSignal.update((items) => items.map((item) => (item.id === org.id ? org : item)));
    return org;
  }

  async update(id: string, name: string): Promise<Workspace> {
    const org = await this.api.update(id, name);
    if (this.currentSignal()?.id === id) {
      this.currentSignal.set(org);
    }
    this.listSignal.update((items) => items.map((item) => (item.id === org.id ? org : item)));
    return org;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(id);
    if (this.currentSignal()?.id === id) {
      this.currentSignal.set(null);
    }
    this.listSignal.update((items) => items.filter((item) => item.id !== id));
  }

  listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.api.listMembers(workspaceId);
  }

  addMember(
    workspaceId: string,
    input: { email: string; role: WorkspaceMember['role'] },
  ): Promise<{ member?: WorkspaceMember; invite?: WorkspaceInvite }> {
    return this.api.addMember(workspaceId, input);
  }

  updateMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceMember['role'],
  ): Promise<WorkspaceMember> {
    return this.api.updateMember(workspaceId, userId, role);
  }

  removeMember(workspaceId: string, userId: string): Promise<void> {
    return this.api.removeMember(workspaceId, userId);
  }

  listInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    return this.api.listInvites(workspaceId);
  }

  revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
    return this.api.revokeInvite(workspaceId, inviteId);
  }

  previewInvite(token: string): Promise<WorkspaceInvitePreview> {
    return this.api.previewInvite(token);
  }

  acceptInvite(token: string): Promise<WorkspaceMember> {
    return this.api.acceptInvite(token);
  }

  clearCurrent(): void {
    this.currentSignal.set(null);
  }
}
