import { Injectable, inject } from '@angular/core';
import { ScmApi } from '../api/scm.api';
import type { Repository, ScmInstallation, ScmProviderName } from '../interfaces/api';

const PENDING_ORG_KEY = 'repodoctor.pendingScmOrganizationId';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class ScmService {
  private readonly api = inject(ScmApi);

  rememberOrganization(organizationId: string): void {
    sessionStorage.setItem(PENDING_ORG_KEY, organizationId);
    localStorage.setItem(PENDING_ORG_KEY, organizationId);
  }

  readPendingOrganization(): string | null {
    return sessionStorage.getItem(PENDING_ORG_KEY) ?? localStorage.getItem(PENDING_ORG_KEY);
  }

  clearPendingOrganization(): void {
    sessionStorage.removeItem(PENDING_ORG_KEY);
    localStorage.removeItem(PENDING_ORG_KEY);
  }

  organizationIdFromState(state: string | null): string | null {
    if (!state || !UUID.test(state)) return null;
    return state;
  }

  getInstallUrl(
    organizationId: string,
    provider: ScmProviderName,
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string; configured: boolean; label: string }> {
    return this.api.getInstallUrl(organizationId, provider, externalInstallationId);
  }

  connect(
    organizationId: string,
    provider: ScmProviderName,
    input: { externalInstallationId?: string; callback?: Record<string, string | null> },
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return this.api.connect(organizationId, provider, input);
  }

  disconnect(organizationId: string, installationId: string): Promise<void> {
    return this.api.disconnect(organizationId, installationId);
  }

  listInstallations(organizationId: string): Promise<ScmInstallation[]> {
    return this.api.listInstallations(organizationId);
  }

  listRepositories(organizationId: string): Promise<Repository[]> {
    return this.api.listRepositories(organizationId);
  }
}
