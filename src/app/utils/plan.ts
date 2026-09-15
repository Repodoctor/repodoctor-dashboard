/** Mirrors @repodoctor/contracts FREE_PLAN. Dashboard does not import the contracts package. */
export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  maxOwnedWorkspaces: 2,
  maxRepositoriesPerWorkspace: 20,
  maxMembersPerWorkspace: 5,
  maxPendingInvitesPerWorkspace: 10,
  maxScmInstallationsPerWorkspace: 3,
  maxManualAnalysisRunsPerRepositoryPerDay: 10,
} as const;
