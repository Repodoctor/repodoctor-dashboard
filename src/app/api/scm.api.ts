import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type { Repository, ScmInstallation, ScmProviderName } from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class ScmApi {
  private readonly api = inject(ApiClient);

  getInstallUrl(
    workspaceId: string,
    provider: ScmProviderName,
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string; configured: boolean; label: string }> {
    return this.api.get(`/workspaces/${workspaceId}/scm/${provider}/install`, {
      externalInstallationId,
    });
  }

  connect(
    workspaceId: string,
    provider: ScmProviderName,
    input: { externalInstallationId?: string; callback?: Record<string, string | null> },
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return this.api.post(`/workspaces/${workspaceId}/scm/${provider}`, input);
  }

  disconnect(workspaceId: string, installationId: string): Promise<void> {
    return this.api.delete(`/workspaces/${workspaceId}/scm/installations/${installationId}`);
  }

  async listInstallations(workspaceId: string): Promise<ScmInstallation[]> {
    const response = await this.api.get<{ items: ScmInstallation[] }>(
      `/workspaces/${workspaceId}/scm`,
    );
    return response.items ?? [];
  }

  async listRepositories(workspaceId: string): Promise<Repository[]> {
    const response = await this.api.get<{ items: Repository[] }>('/repositories', { workspaceId });
    return response.items ?? [];
  }
}
