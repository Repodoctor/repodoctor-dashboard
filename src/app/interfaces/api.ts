export interface User {
  id: string;
  email: string;
  displayName: string;
  /** GitHub (or future upload) photo. Optional until Settings upload exists. */
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: OrganizationRole;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  createdAt: string;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  signupUrl?: string;
  expiresAt: string;
  createdAt: string;
}

export interface OrganizationInvitePreview {
  organizationName: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
  expired: boolean;
}

export type AddMemberResponse =
  | { status: 'added'; member: OrganizationMember }
  | { status: 'invited'; invite: OrganizationInvite };

export type ScmProviderName = 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';

export interface ScmInstallation {
  id: string;
  organizationId: string;
  provider: ScmProviderName;
  externalInstallationId: string;
  accountLogin: string;
  createdAt: string;
  updatedAt: string;
}

export type RepositoryPermission = 'NONE' | 'VIEW' | 'ANALYZE' | 'MANAGE' | 'ADMIN';

export interface Repository {
  id: string;
  organizationId: string;
  scmProvider: ScmProviderName;
  scmRepositoryId: string;
  installationId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  url: string;
  lastAnalyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
  permission?: RepositoryPermission;
}

export interface RepositoryAccessGrant {
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  permission: RepositoryPermission;
  source: 'role' | 'override';
}

export interface AnalysisRun {
  id: string;
  repositoryId: string;
  organizationId: string;
  type: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  commitSha: string;
  branch: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  trigger: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  organizationId: string;
  repositoryId: string;
  analysisRunId: string;
  source: string;
  ruleId: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  filePath: string | null;
  lineNumber: number | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  requestId?: string;
}

export interface ApiList<T> {
  items: T[];
}
