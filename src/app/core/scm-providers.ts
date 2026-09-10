import type { ScmInstallation } from './models';

export type ScmProviderName = ScmInstallation['provider'];

export interface ScmProviderOption {
  id: ScmProviderName;
  label: string;
  description: string;
}

export const SCM_PROVIDERS: ScmProviderOption[] = [
  { id: 'github', label: 'GitHub', description: 'GitHub App for organizations and user accounts' },
  { id: 'gitlab', label: 'GitLab', description: 'GitLab.com or self-managed' },
  { id: 'bitbucket', label: 'Bitbucket Cloud', description: 'Atlassian Bitbucket workspaces' },
  { id: 'azure_devops', label: 'Azure DevOps', description: 'Azure Repos organizations' },
];

export function scmProviderLabel(provider: ScmProviderName): string {
  return SCM_PROVIDERS.find((item) => item.id === provider)?.label ?? provider;
}
