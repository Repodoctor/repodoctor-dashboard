import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Repository, ScmInstallation } from './models';

const PENDING_ORG_KEY = 'repodoctor.pendingGithubOrganizationId';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ScmProviderName = ScmInstallation['provider'];

@Injectable({ providedIn: 'root' })
export class ScmService {
  constructor(private readonly http: HttpClient) {}

  rememberOrganization(organizationId: string): void {
    sessionStorage.setItem(PENDING_ORG_KEY, organizationId);
  }

  readPendingOrganization(): string | null {
    return sessionStorage.getItem(PENDING_ORG_KEY);
  }

  clearPendingOrganization(): void {
    sessionStorage.removeItem(PENDING_ORG_KEY);
  }

  organizationIdFromState(state: string | null): string | null {
    if (!state || !UUID.test(state)) return null;
    return state;
  }

  async getInstallUrl(
    organizationId: string,
    provider: ScmProviderName = 'github',
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string; configured?: boolean }> {
    const slug = environment.githubAppSlug.trim();
    if (provider === 'github' && slug && externalInstallationId) {
      return {
        slug,
        url: `https://github.com/apps/${encodeURIComponent(slug)}/installations/${encodeURIComponent(externalInstallationId)}`,
      };
    }
    if (provider === 'github' && slug) {
      const url = new URL(`https://github.com/apps/${encodeURIComponent(slug)}/installations/new`);
      url.searchParams.set('state', organizationId);
      return { url: url.toString(), slug };
    }
    const query = externalInstallationId
      ? `?externalInstallationId=${encodeURIComponent(externalInstallationId)}`
      : '';
    return firstValueFrom(
      this.http.get<{ url: string; slug: string; configured: boolean }>(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm/${provider}/install${query}`,
      ),
    );
  }

  async connect(
    organizationId: string,
    provider: ScmProviderName,
    externalInstallationId: string,
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return firstValueFrom(
      this.http.post<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }>(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm/${provider}`,
        { externalInstallationId },
      ),
    );
  }

  async disconnect(organizationId: string, provider: ScmProviderName): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${environment.apiBaseUrl}/organizations/${organizationId}/scm/${provider}`),
    );
  }

  async getGithubInstallUrl(
    organizationId: string,
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string }> {
    return this.getInstallUrl(organizationId, 'github', externalInstallationId);
  }

  async connectGithub(
    organizationId: string,
    externalInstallationId: string,
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return this.connect(organizationId, 'github', externalInstallationId);
  }

  async listInstallations(organizationId: string): Promise<ScmInstallation[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: ScmInstallation[] }>(
        `${environment.apiBaseUrl}/organizations/${organizationId}/scm`,
      ),
    );
    return response.items ?? [];
  }

  async disconnectGithub(organizationId: string): Promise<void> {
    return this.disconnect(organizationId, 'github');
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
