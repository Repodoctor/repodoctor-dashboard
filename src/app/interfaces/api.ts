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

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  signupUrl?: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceInvitePreview {
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  expired: boolean;
}

export type AddMemberResponse =
  | { status: 'added'; member: WorkspaceMember }
  | { status: 'invited'; invite: WorkspaceInvite };

export type ScmProviderName = 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';

export interface ScmInstallation {
  id: string;
  workspaceId: string;
  provider: ScmProviderName;
  externalInstallationId: string;
  accountLogin: string;
  createdAt: string;
  updatedAt: string;
}

export type RepositoryPermission = 'NONE' | 'VIEW' | 'ANALYZE' | 'MANAGE' | 'ADMIN';

export interface Repository {
  id: string;
  workspaceId: string;
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
  workspaceName?: string;
  permission?: RepositoryPermission;
}

export interface RepositoryAccessGrant {
  userId: string;
  email: string;
  displayName: string;
  role: WorkspaceRole;
  permission: RepositoryPermission;
  source: 'role' | 'override';
}

export interface AnalysisRun {
  id: string;
  repositoryId: string;
  workspaceId: string;
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
  workspaceId: string;
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
