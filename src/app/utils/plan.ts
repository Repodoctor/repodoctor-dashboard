/** Mirrors @repodoctor/contracts FREE_PLAN. Dashboard does not import the contracts package. */
export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  maxOwnedOrganizations: 2,
  maxRepositoriesPerOrganization: 20,
  maxMembersPerOrganization: 5,
  maxPendingInvitesPerOrganization: 10,
  maxScmInstallationsPerOrganization: 1,
  maxManualAnalysisRunsPerRepositoryPerDay: 10,
} as const;
