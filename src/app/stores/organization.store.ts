import { Injectable, computed, inject, signal } from '@angular/core';
import { OrganizationsApi } from '../api/organizations.api';
import type {
  Organization,
  OrganizationInvite,
  OrganizationInvitePreview,
  OrganizationMember,
} from '../interfaces/api';

/**
 * Shared organization state.
 *
 * Pages fetch through this store so the current org (and list) survive
 * tab switches inside `/organizations/:id` instead of each route
 * re-owning the same GET.
 *
 * This is a signal store, not NgRx: the app is still small, auth already
 * uses signals, and a Redux-style store would add ceremony without a
 * second client (desktop/mobile) sharing the same state machine.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationStore {
  private readonly api = inject(OrganizationsApi);

  private readonly currentSignal = signal<Organization | null>(null);
  private readonly listSignal = signal<Organization[]>([]);

  readonly current = this.currentSignal.asReadonly();
  readonly list = this.listSignal.asReadonly();
  readonly hasCurrent = computed(() => this.currentSignal() !== null);

  async listAll(): Promise<Organization[]> {
    const items = await this.api.list();
    this.listSignal.set(items);
    return items;
  }

  async create(input: { name: string; slug?: string }): Promise<Organization> {
    const org = await this.api.create(input);
    this.listSignal.update((items) => [org, ...items.filter((item) => item.id !== org.id)]);
    return org;
  }

  async get(id: string): Promise<Organization> {
    const org = await this.api.get(id);
    this.currentSignal.set(org);
    this.listSignal.update((items) => items.map((item) => (item.id === org.id ? org : item)));
    return org;
  }

  async update(id: string, name: string): Promise<Organization> {
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

  listMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.api.listMembers(organizationId);
  }

  addMember(
    organizationId: string,
    input: { email: string; role: OrganizationMember['role'] },
  ): Promise<{ member?: OrganizationMember; invite?: OrganizationInvite }> {
    return this.api.addMember(organizationId, input);
  }

  updateMember(
    organizationId: string,
    userId: string,
    role: OrganizationMember['role'],
  ): Promise<OrganizationMember> {
    return this.api.updateMember(organizationId, userId, role);
  }

  removeMember(organizationId: string, userId: string): Promise<void> {
    return this.api.removeMember(organizationId, userId);
  }

  listInvites(organizationId: string): Promise<OrganizationInvite[]> {
    return this.api.listInvites(organizationId);
  }

  revokeInvite(organizationId: string, inviteId: string): Promise<void> {
    return this.api.revokeInvite(organizationId, inviteId);
  }

  previewInvite(token: string): Promise<OrganizationInvitePreview> {
    return this.api.previewInvite(token);
  }

  acceptInvite(token: string): Promise<OrganizationMember> {
    return this.api.acceptInvite(token);
  }

  clearCurrent(): void {
    this.currentSignal.set(null);
  }
}
