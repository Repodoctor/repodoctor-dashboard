export interface AppNavLink {
  path: string;
  label: string;
  icon: string;
}

export const APP_NAV_GROUPS: { label: string; links: readonly AppNavLink[] }[] = [
  {
    label: 'Workspace',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { path: '/organizations', label: 'Organizations', icon: 'groups' },
    ],
  },
  {
    label: 'Account',
    links: [{ path: '/settings', label: 'Settings', icon: 'settings' }],
  },
];

export const APP_NAV_LINKS: readonly AppNavLink[] = APP_NAV_GROUPS.flatMap((group) => group.links);
