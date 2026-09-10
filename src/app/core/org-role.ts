export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export function isOrgAdmin(role: OrganizationRole | string | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
