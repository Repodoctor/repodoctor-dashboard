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

export interface ApiError {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  requestId?: string;
}
