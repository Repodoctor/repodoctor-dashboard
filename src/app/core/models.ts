export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: string;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  signupUrl?: string;
  expiresAt: string;
  createdAt: string;
}

export interface OrganizationInvitePreview {
  organizationName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  expiresAt: string;
  expired: boolean;
}

export type AddMemberResponse =
  | { status: 'added'; member: OrganizationMember }
  | { status: 'invited'; invite: OrganizationInvite };

export interface ScmInstallation {
  id: string;
  organizationId: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';
  externalInstallationId: string;
  accountLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  id: string;
  organizationId: string;
  scmProvider: 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';
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
