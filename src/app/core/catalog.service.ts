import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AnalysisRun, Finding, Repository, RepositoryAccessGrant } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  async listMyRepositories(): Promise<Repository[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: Repository[] }>(`${environment.apiBaseUrl}/repositories`),
    );
    return response.items ?? [];
  }

  async getRepository(repositoryId: string, organizationId?: string): Promise<Repository> {
    const params = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    return firstValueFrom(this.http.get<Repository>(`${environment.apiBaseUrl}/repositories/${repositoryId}${params}`));
  }

  async listAnalysis(organizationId: string, repositoryId: string): Promise<AnalysisRun[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: AnalysisRun[] }>(
        `${environment.apiBaseUrl}/analysis?organizationId=${encodeURIComponent(organizationId)}&repositoryId=${encodeURIComponent(repositoryId)}`,
      ),
    );
    return response.items ?? [];
  }

  async requestAnalysis(repositoryId: string, organizationId: string, input: { commitSha: string; branch: string }): Promise<AnalysisRun> {
    return firstValueFrom(
      this.http.post<AnalysisRun>(
        `${environment.apiBaseUrl}/repositories/${repositoryId}/analysis?organizationId=${encodeURIComponent(organizationId)}`,
        {
          type: 'FULL',
          trigger: 'MANUAL',
          commitSha: input.commitSha,
          branch: input.branch,
        },
      ),
    );
  }

  async listFindings(organizationId?: string, repositoryId?: string): Promise<Finding[]> {
    const params = new URLSearchParams();
    if (organizationId) params.set('organizationId', organizationId);
    if (repositoryId) params.set('repositoryId', repositoryId);
    params.set('pageSize', '100');
    const query = params.toString();
    const response = await firstValueFrom(
      this.http.get<{ items: Finding[] }>(`${environment.apiBaseUrl}/findings${query ? `?${query}` : ''}`),
    );
    return response.items ?? [];
  }

  async listRepositoryAccess(repositoryId: string, organizationId?: string): Promise<RepositoryAccessGrant[]> {
    const params = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    const response = await firstValueFrom(
      this.http.get<{ items: RepositoryAccessGrant[] }>(
        `${environment.apiBaseUrl}/repositories/${repositoryId}/access${params}`,
      ),
    );
    return response.items ?? [];
  }

  async updateRepositoryAccess(
    repositoryId: string,
    userId: string,
    permission: RepositoryAccessGrant['permission'],
    organizationId?: string,
  ): Promise<RepositoryAccessGrant> {
    const params = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    return firstValueFrom(
      this.http.put<RepositoryAccessGrant>(
        `${environment.apiBaseUrl}/repositories/${repositoryId}/access/${userId}${params}`,
        { permission },
      ),
    );
  }

  async resetRepositoryAccess(repositoryId: string, userId: string, organizationId?: string): Promise<void> {
    const params = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    await firstValueFrom(
      this.http.delete(`${environment.apiBaseUrl}/repositories/${repositoryId}/access/${userId}${params}`),
    );
  }
}
