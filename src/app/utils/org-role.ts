import type { OrganizationRole } from '../interfaces/api';

export type { OrganizationRole };

export function isOrgAdmin(role: OrganizationRole | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
