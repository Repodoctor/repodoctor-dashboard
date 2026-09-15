import { Injectable, inject } from '@angular/core';
import { ScmApi } from '../api/scm.api';
import type { Repository, ScmInstallation, ScmProviderName } from '../interfaces/api';

const PENDING_ORG_KEY = 'repodoctor.pendingScmWorkspaceId';
const SCM_POPUP_CHANNEL = 'repodoctor-scm';
const SCM_POPUP_STORAGE = 'repodoctor.scmPopup';
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

  notifyPopupConnected(workspaceId: string): void {
    const payload = { type: 'connected', workspaceId, at: Date.now() };
    try {
      const channel = new BroadcastChannel(SCM_POPUP_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    } catch {
      // Safari private mode may lack BroadcastChannel.
    }
    localStorage.setItem(SCM_POPUP_STORAGE, JSON.stringify(payload));
  }

  waitForPopupConnected(timeoutMs = 10 * 60_000): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let channel: BroadcastChannel | undefined;
      const finish = (workspaceId: string) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.removeEventListener('storage', onStorage);
        channel?.close();
        resolve(workspaceId);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'connected' && typeof event.data.workspaceId === 'string') {
          finish(event.data.workspaceId);
        }
      };
      const onStorage = (event: StorageEvent) => {
        if (event.key !== SCM_POPUP_STORAGE || !event.newValue) return;
        try {
          const data = JSON.parse(event.newValue) as { type?: string; workspaceId?: string };
          if (data.type === 'connected' && data.workspaceId) finish(data.workspaceId);
        } catch {
          // Ignore malformed storage writes.
        }
      };
      try {
        channel = new BroadcastChannel(SCM_POPUP_CHANNEL);
        channel.addEventListener('message', onMessage);
      } catch {
        // localStorage fallback only.
      }
      window.addEventListener('storage', onStorage);
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        window.removeEventListener('storage', onStorage);
        channel?.close();
        reject(new Error('Timed out waiting for GitHub install'));
      }, timeoutMs);
    });
  }
}
