import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly api = inject(ApiClient);

  async listMyRepositories(): Promise<Repository[]> {
    const response = await this.api.get<{ items: Repository[] }>('/repositories');
    return response.items ?? [];
  }

  getRepository(repositoryId: string, workspaceId?: string): Promise<Repository> {
    return this.api.get<Repository>(`/repositories/${repositoryId}`, { workspaceId });
  }

  async listAnalysis(workspaceId: string, repositoryId: string): Promise<AnalysisRun[]> {
    const response = await this.api.get<{ items: AnalysisRun[] }>('/analysis', {
      workspaceId,
      repositoryId,
    });
    return response.items ?? [];
  }

  requestAnalysis(
    repositoryId: string,
    workspaceId: string,
    input: { commitSha: string; branch: string },
  ): Promise<AnalysisRun> {
    return this.api.post<AnalysisRun>(
      `/repositories/${repositoryId}/analysis`,
      {
        type: 'FULL',
        trigger: 'MANUAL',
        commitSha: input.commitSha,
        branch: input.branch,
      },
      { workspaceId },
    );
  }

  async listFindings(workspaceId?: string, repositoryId?: string): Promise<Finding[]> {
    const response = await this.api.get<{ items: Finding[] }>('/findings', {
      workspaceId,
      repositoryId,
      pageSize: 100,
    });
    return response.items ?? [];
  }

  async listRepositoryAccess(repositoryId: string, workspaceId?: string): Promise<RepositoryAccessGrant[]> {
    const response = await this.api.get<{ items: RepositoryAccessGrant[] }>(
      `/repositories/${repositoryId}/access`,
      { workspaceId },
    );
    return response.items ?? [];
  }

  updateRepositoryAccess(
    repositoryId: string,
    userId: string,
    permission: RepositoryAccessGrant['permission'],
    workspaceId?: string,
  ): Promise<RepositoryAccessGrant> {
    return this.api.put<RepositoryAccessGrant>(
      `/repositories/${repositoryId}/access/${userId}`,
      { permission },
      { workspaceId },
    );
  }

  resetRepositoryAccess(repositoryId: string, userId: string, workspaceId?: string): Promise<void> {
    return this.api.delete(`/repositories/${repositoryId}/access/${userId}`, { workspaceId });
  }
}
