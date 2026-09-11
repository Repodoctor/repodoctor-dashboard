import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public/public-shell/public-shell').then((m) => m.PublicShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/public/home/home').then((m) => m.HomePage),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/public/products/products').then((m) => m.ProductsPage),
      },
      {
        path: 'solutions',
        loadComponent: () => import('./pages/public/solutions/solutions').then((m) => m.SolutionsPage),
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pages/public/pricing/pricing').then((m) => m.PricingPage),
      },
      {
        path: 'docs',
        loadComponent: () => import('./pages/public/docs/docs').then((m) => m.DocsPage),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/signup/signup').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'set-password',
    loadComponent: () => import('./pages/auth/set-password/set-password').then((m) => m.SetPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/set-password/set-password').then((m) => m.SetPasswordPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/auth-callback/auth-callback').then((m) => m.AuthCallbackPage),
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/auth/error/error').then((m) => m.ErrorPage),
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
        loadComponent: () =>
          import('./pages/organizations/list/organizations').then((m) => m.OrganizationsPage),
      },
      {
        path: 'organizations/:organizationId',
        loadComponent: () =>
          import('./components/organization-shell/organization-shell').then((m) => m.OrganizationShellComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organizations/overview/organization-detail').then((m) => m.OrganizationDetailPage),
          },
          {
            path: 'details',
            loadComponent: () =>
              import('./pages/organizations/settings/organization-settings').then(
                (m) => m.OrganizationSettingsPage,
              ),
          },
          {
            path: 'integrations',
            loadComponent: () =>
              import('./pages/organizations/integrations/organization-integrations').then(
                (m) => m.OrganizationIntegrationsPage,
              ),
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./pages/organizations/members/organization-members').then(
                (m) => m.OrganizationMembersPage,
              ),
          },
          {
            path: 'permissions',
            loadComponent: () =>
              import('./pages/organizations/permissions/organization-permissions').then(
                (m) => m.OrganizationPermissionsPage,
              ),
          },
          { path: 'repositories', redirectTo: '', pathMatch: 'full' },
          { path: 'settings', redirectTo: 'details', pathMatch: 'full' },
          { path: 'settings/integrations', redirectTo: 'integrations' },
          { path: 'settings/members', redirectTo: 'members' },
          { path: 'settings/permissions', redirectTo: 'permissions' },
        ],
      },
      {
        path: 'repositories',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/repositories/list/repositories').then((m) => m.RepositoriesPage),
      },
      {
        path: 'code',
        loadComponent: () =>
          import('./pages/findings/findings-inbox').then((m) => m.FindingsInboxPage),
        data: { category: 'code' },
      },
      {
        path: 'secrets',
        loadComponent: () =>
          import('./pages/findings/findings-inbox').then((m) => m.FindingsInboxPage),
        data: { category: 'secrets' },
      },
      {
        path: 'supply-chain',
        loadComponent: () =>
          import('./pages/findings/findings-inbox').then((m) => m.FindingsInboxPage),
        data: { category: 'supply-chain' },
      },
      {
        path: 'settings/scm/:provider/callback',
        loadComponent: () =>
          import('./pages/account/scm-callback/scm-callback').then((m) => m.ScmCallbackPage),
      },
      {
        path: 'repositories/:repositoryId',
        redirectTo: 'repositories/:repositoryId/overview',
        pathMatch: 'full',
      },
      {
        path: 'repositories/:repositoryId/:section',
        loadComponent: () => import('./pages/repositories/detail/repository').then((m) => m.RepositoryPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/account/settings/settings').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
