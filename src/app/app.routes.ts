import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup/signup').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'set-password',
    loadComponent: () => import('./pages/set-password/set-password').then((m) => m.SetPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/set-password/set-password').then((m) => m.SetPasswordPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth-callback/auth-callback').then((m) => m.AuthCallbackPage),
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/error/error').then((m) => m.ErrorPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'organizations',
        loadComponent: () => import('./pages/organizations/organizations').then((m) => m.OrganizationsPage),
      },
      {
        path: 'organizations/:organizationId',
        loadComponent: () =>
          import('./components/organization-shell/organization-shell').then((m) => m.OrganizationShellComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organization-detail/organization-detail').then((m) => m.OrganizationDetailPage),
          },
          {
            path: 'details',
            loadComponent: () =>
              import('./pages/organization-settings/organization-settings').then((m) => m.OrganizationSettingsPage),
          },
          {
            path: 'integrations',
            loadComponent: () =>
              import('./pages/organization-integrations/organization-integrations').then(
                (m) => m.OrganizationIntegrationsPage,
              ),
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./pages/organization-members/organization-members').then((m) => m.OrganizationMembersPage),
          },
          {
            path: 'permissions',
            loadComponent: () =>
              import('./pages/organization-permissions/organization-permissions').then(
                (m) => m.OrganizationPermissionsPage,
              ),
          },
          {
            path: 'repositories',
            loadComponent: () => import('./pages/repositories/repositories').then((m) => m.RepositoriesPage),
          },
          { path: 'settings', redirectTo: 'details', pathMatch: 'full' },
          { path: 'settings/integrations', redirectTo: 'integrations' },
          { path: 'settings/members', redirectTo: 'members' },
          { path: 'settings/permissions', redirectTo: 'permissions' },
        ],
      },
      {
        path: 'settings/scm/:provider/callback',
        loadComponent: () => import('./pages/scm-callback/scm-callback').then((m) => m.ScmCallbackPage),
      },
      {
        path: 'repositories/:repositoryId',
        redirectTo: 'repositories/:repositoryId/overview',
        pathMatch: 'full',
      },
      {
        path: 'repositories/:repositoryId/:section',
        loadComponent: () => import('./pages/repository/repository').then((m) => m.RepositoryPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
