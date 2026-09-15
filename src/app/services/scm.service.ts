import { Injectable, inject } from '@angular/core';
import { ScmApi } from '../api/scm.api';
import type { Repository, ScmInstallation, ScmProviderName } from '../interfaces/api';

const PENDING_ORG_KEY = 'repodoctor.pendingScmWorkspaceId';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class ScmService {
  private readonly api = inject(ScmApi);

  rememberWorkspace(workspaceId: string): void {
    sessionStorage.setItem(PENDING_ORG_KEY, workspaceId);
    localStorage.setItem(PENDING_ORG_KEY, workspaceId);
  }

  readPendingWorkspace(): string | null {
    return sessionStorage.getItem(PENDING_ORG_KEY) ?? localStorage.getItem(PENDING_ORG_KEY);
  }

  clearPendingWorkspace(): void {
    sessionStorage.removeItem(PENDING_ORG_KEY);
    localStorage.removeItem(PENDING_ORG_KEY);
  }

  workspaceIdFromState(state: string | null): string | null {
    if (!state || !UUID.test(state)) return null;
    return state;
  }

  getInstallUrl(
    workspaceId: string,
    provider: ScmProviderName,
    externalInstallationId?: string,
  ): Promise<{ url: string; slug: string; configured: boolean; label: string }> {
    return this.api.getInstallUrl(workspaceId, provider, externalInstallationId);
  }

  connect(
    workspaceId: string,
    provider: ScmProviderName,
    input: { externalInstallationId?: string; callback?: Record<string, string | null> },
  ): Promise<{ installation: ScmInstallation; repositories: Array<{ fullName: string }> }> {
    return this.api.connect(workspaceId, provider, input);
  }

  disconnect(workspaceId: string, installationId: string): Promise<void> {
    return this.api.disconnect(workspaceId, installationId);
  }

  listInstallations(workspaceId: string): Promise<ScmInstallation[]> {
    return this.api.listInstallations(workspaceId);
  }

  listRepositories(workspaceId: string): Promise<Repository[]> {
    return this.api.listRepositories(workspaceId);
  }
}
