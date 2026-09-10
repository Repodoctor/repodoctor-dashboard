import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Repository, ScmInstallation } from './models';
import type { ScmProviderName } from './scm-providers';

const PENDING_ORG_KEY = 'repodoctor.pendingScmOrganizationId';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class ScmService {
  constructor(private readonly http: HttpClient) {}

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

  async getInstallUrl(
    organizationId: string,
    provider: ScmProviderName,
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string; configured: boolean; label: string }> {
    const query = externalInstallationId
      ? `?externalInstallationId=${encodeURIComponent(externalInstallationId)}`
      : '';
    return firstValueFrom(
      this.http.get<{ url: string; slug: string; configured: boolean; label: string }>(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm/${provider}/install${query}`,
      ),
    );
  }

  async connect(
    organizationId: string,
    provider: ScmProviderName,
    input: { externalInstallationId?: string; callback?: Record<string, string | null> },
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return firstValueFrom(
      this.http.post<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }>(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm/${provider}`,
        input,
      ),
    );
  }

  async disconnect(organizationId: string, installationId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm/installations/${installationId}`,
      ),
    );
  }

  async listInstallations(organizationId: string): Promise<ScmInstallation[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: ScmInstallation[] }>(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm`,
      ),
    );
    return response.items ?? [];
  }

  async listRepositories(organizationId: string): Promise<Repository[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: Repository[] }>(
        `${environment.apiBaseUrl}/repositories?organizationId=${encodeURIComponent(organizationId)}`,
      ),
    );
    return response.items ?? [];
  }
}
