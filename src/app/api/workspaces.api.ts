import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type {
  Workspace,
  WorkspaceInvite,
  WorkspaceInvitePreview,
  WorkspaceMember,
} from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class WorkspacesApi {
  private readonly api = inject(ApiClient);

  async list(): Promise<Workspace[]> {
    const response = await this.api.get<{ items: Workspace[] }>('/workspaces');
    return response.items ?? [];
  }

  create(input: { name: string; slug?: string }): Promise<Workspace> {
    return this.api.post<Workspace>('/workspaces', input);
  }

  get(id: string): Promise<Workspace> {
    return this.api.get<Workspace>(`/workspaces/${id}`);
  }

  update(id: string, name: string): Promise<Workspace> {
    return this.api.patch<Workspace>(`/workspaces/${id}`, { name });
  }

  delete(id: string): Promise<void> {
    return this.api.delete(`/workspaces/${id}`);
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await this.api.get<{ items: WorkspaceMember[] }>(
      `/workspaces/${workspaceId}/members`,
    );
    return response.items ?? [];
  }

  addMember(
    workspaceId: string,
    input: { email: string; role: WorkspaceMember['role'] },
  ): Promise<{ status: 'added' | 'invited'; member?: WorkspaceMember; invite?: WorkspaceInvite }> {
    return this.api.post(`/workspaces/${workspaceId}/members`, input);
  }

  updateMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceMember['role'],
  ): Promise<WorkspaceMember> {
    return this.api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
  }

  removeMember(workspaceId: string, userId: string): Promise<void> {
    return this.api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }

  async listInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const response = await this.api.get<{ items: WorkspaceInvite[] }>(
      `/workspaces/${workspaceId}/invites`,
    );
    return response.items ?? [];
  }

  revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
    return this.api.delete(`/workspaces/${workspaceId}/invites/${inviteId}`);
  }

  previewInvite(token: string): Promise<WorkspaceInvitePreview> {
    return this.api.get(`/invites/${token}`);
  }

  acceptInvite(token: string): Promise<WorkspaceMember> {
    return this.api.post(`/invites/${token}/accept`, {});
  }
}
