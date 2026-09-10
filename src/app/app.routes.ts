import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'set-password',
    loadComponent: () => import('./pages/set-password.page').then((m) => m.SetPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/set-password.page').then((m) => m.SetPasswordPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth-callback.page').then((m) => m.AuthCallbackPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'organizations',
        loadComponent: () => import('./pages/organizations.page').then((m) => m.OrganizationsPage),
      },
      {
        path: 'organizations/:organizationId',
        loadComponent: () =>
          import('./layout/organization-shell.component').then((m) => m.OrganizationShellComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organization-detail.page').then((m) => m.OrganizationDetailPage),
          },
          {
            path: 'details',
            loadComponent: () =>
              import('./pages/organization-settings.page').then((m) => m.OrganizationSettingsPage),
          },
          {
            path: 'integrations',
            loadComponent: () =>
              import('./pages/organization-integrations.page').then((m) => m.OrganizationIntegrationsPage),
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./pages/organization-members.page').then((m) => m.OrganizationMembersPage),
          },
          {
            path: 'permissions',
            loadComponent: () =>
              import('./pages/organization-permissions.page').then((m) => m.OrganizationPermissionsPage),
          },
          {
            path: 'repositories',
            loadComponent: () => import('./pages/repositories.page').then((m) => m.RepositoriesPage),
          },
          { path: 'settings', redirectTo: 'details', pathMatch: 'full' },
          { path: 'settings/integrations', redirectTo: 'integrations' },
          { path: 'settings/members', redirectTo: 'members' },
          { path: 'settings/permissions', redirectTo: 'permissions' },
        ],
      },
      {
        path: 'settings/scm/:provider/callback',
        loadComponent: () =>
          import('./pages/scm-callback.page').then((m) => m.ScmCallbackPage),
      },
      {
        path: 'repositories/:repositoryId',
        redirectTo: 'repositories/:repositoryId/overview',
        pathMatch: 'full',
      },
      {
        path: 'repositories/:repositoryId/:section',
        loadComponent: () => import('./pages/repository.page').then((m) => m.RepositoryPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
