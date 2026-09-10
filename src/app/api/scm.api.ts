import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type { Repository, ScmInstallation, ScmProviderName } from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class ScmApi {
  private readonly api = inject(ApiClient);

  getInstallUrl(
    organizationId: string,
    provider: ScmProviderName,
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string; configured: boolean; label: string }> {
    return this.api.get(`/organizations/${organizationId}/scm/${provider}/install`, {
      externalInstallationId,
    });
  }

  connect(
    organizationId: string,
    provider: ScmProviderName,
    input: { externalInstallationId?: string; callback?: Record<string, string | null> },
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return this.api.post(`/organizations/${organizationId}/scm/${provider}`, input);
  }

  disconnect(organizationId: string, installationId: string): Promise<void> {
    return this.api.delete(`/organizations/${organizationId}/scm/installations/${installationId}`);
  }

  async listInstallations(organizationId: string): Promise<ScmInstallation[]> {
    const response = await this.api.get<{ items: ScmInstallation[] }>(
      `/organizations/${organizationId}/scm`,
    );
    return response.items ?? [];
  }

  async listRepositories(organizationId: string): Promise<Repository[]> {
    const response = await this.api.get<{ items: Repository[] }>('/repositories', { organizationId });
    return response.items ?? [];
  }
}
