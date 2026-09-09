import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AnalysisRun, Finding, Repository } from './models';

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

  async listFindings(organizationId: string, repositoryId: string): Promise<Finding[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: Finding[] }>(
        `${environment.apiBaseUrl}/findings?organizationId=${encodeURIComponent(organizationId)}&repositoryId=${encodeURIComponent(repositoryId)}`,
      ),
    );
    return response.items ?? [];
  }
}
