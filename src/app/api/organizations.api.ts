import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type {
  Organization,
  OrganizationInvite,
  OrganizationInvitePreview,
  OrganizationMember,
} from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  private readonly api = inject(ApiClient);

  async list(): Promise<Organization[]> {
    const response = await this.api.get<{ items: Organization[] }>('/organizations');
    return response.items ?? [];
  }

  create(input: { name: string; slug?: string }): Promise<Organization> {
    return this.api.post<Organization>('/organizations', input);
  }

  get(id: string): Promise<Organization> {
    return this.api.get<Organization>(`/organizations/${id}`);
  }

  update(id: string, name: string): Promise<Organization> {
    return this.api.patch<Organization>(`/organizations/${id}`, { name });
  }

  delete(id: string): Promise<void> {
    return this.api.delete(`/organizations/${id}`);
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const response = await this.api.get<{ items: OrganizationMember[] }>(
      `/organizations/${organizationId}/members`,
    );
    return response.items ?? [];
  }

  addMember(
    organizationId: string,
    input: { email: string; role: OrganizationMember['role'] },
  ): Promise<{ status: 'added' | 'invited'; member?: OrganizationMember; invite?: OrganizationInvite }> {
    return this.api.post(`/organizations/${organizationId}/members`, input);
  }

  updateMember(
    organizationId: string,
    userId: string,
    role: OrganizationMember['role'],
  ): Promise<OrganizationMember> {
    return this.api.patch(`/organizations/${organizationId}/members/${userId}`, { role });
  }

  removeMember(organizationId: string, userId: string): Promise<void> {
    return this.api.delete(`/organizations/${organizationId}/members/${userId}`);
  }

  async listInvites(organizationId: string): Promise<OrganizationInvite[]> {
    const response = await this.api.get<{ items: OrganizationInvite[] }>(
      `/organizations/${organizationId}/invites`,
    );
    return response.items ?? [];
  }

  revokeInvite(organizationId: string, inviteId: string): Promise<void> {
    return this.api.delete(`/organizations/${organizationId}/invites/${inviteId}`);
  }

  previewInvite(token: string): Promise<OrganizationInvitePreview> {
    return this.api.get(`/invites/${token}`);
  }

  acceptInvite(token: string): Promise<OrganizationMember> {
    return this.api.post(`/invites/${token}/accept`, {});
  }
}
