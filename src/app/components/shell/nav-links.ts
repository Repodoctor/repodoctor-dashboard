export interface AppNavLink {
  path: string;
  label: string;
  icon: string;
}

export const APP_PRIMARY_NAV: readonly AppNavLink[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/workspaces', label: 'Workspaces', icon: 'groups' },
  { path: '/repositories', label: 'Repositories', icon: 'folder' },
  { path: '/code', label: 'Code', icon: 'code' },
  { path: '/secrets', label: 'Secrets', icon: 'key' },
  { path: '/supply-chain', label: 'Supply Chain', icon: 'account_tree' },
];

export const APP_ACCOUNT_NAV: readonly AppNavLink[] = [
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export const APP_NAV_LINKS: readonly AppNavLink[] = [...APP_PRIMARY_NAV, ...APP_ACCOUNT_NAV];
