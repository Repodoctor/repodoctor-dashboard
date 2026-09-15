import type { WorkspaceRole } from '../interfaces/api';

export type { WorkspaceRole };

export function isOrgAdmin(role: WorkspaceRole | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
