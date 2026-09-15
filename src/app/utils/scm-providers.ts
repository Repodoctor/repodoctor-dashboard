import type { ScmInstallation, ScmProviderName } from '../interfaces/api';

export type { ScmProviderName };

export interface ScmProviderOption {
  id: ScmProviderName;
  label: string;
  description: string;
  available: boolean;
}

export const SCM_PROVIDERS: ScmProviderOption[] = [
  { id: 'github', label: 'GitHub', description: 'GitHub App for workspaces and user accounts', available: true },
  { id: 'gitlab', label: 'GitLab', description: 'Coming soon', available: false },
  { id: 'bitbucket', label: 'Bitbucket Cloud', description: 'Coming soon', available: false },
  { id: 'azure_devops', label: 'Azure DevOps', description: 'Coming soon', available: false },
];

export function scmProviderLabel(provider: ScmProviderName): string {
  return SCM_PROVIDERS.find((item) => item.id === provider)?.label ?? provider;
}
