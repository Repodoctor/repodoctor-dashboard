import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'settings/scm/:provider/callback',
    loadComponent: () =>
      import('./pages/account/scm-callback/scm-callback').then((m) => m.ScmCallbackPage),
  },
  {
    // Public routes
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
        redirectTo: '/',
        pathMatch: 'full',
      },
      {
        path: 'docs',
        loadComponent: () => import('./pages/public/docs/docs').then((m) => m.DocsPage),
      },
    ],
  },
  {
    // Auth routes
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.LoginPage),
  },
  {
    // Auth routes
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/signup/signup').then((m) => m.SignupPage),
  },
  {
    // Auth routes
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    // Auth routes
    path: 'set-password',
    loadComponent: () => import('./pages/auth/set-password/set-password').then((m) => m.SetPasswordPage),
  },
  {
    // Auth routes
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/set-password/set-password').then((m) => m.SetPasswordPage),
  },
  {
    // Auth routes
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/auth-callback/auth-callback').then((m) => m.AuthCallbackPage),
  },
  {
    // Auth routes
    path: 'error',
    loadComponent: () => import('./pages/auth/error/error').then((m) => m.ErrorPage),
  },
  {
    // Protected routes
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        // Dashboard routes
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        // Workspaces routes
        path: 'workspaces',
        loadComponent: () =>
          import('./pages/workspaces/list/workspaces').then((m) => m.WorkspacesPage),
      },
      {
        // Workspace routes
        path: 'workspaces/:workspaceId',
        loadComponent: () =>
          import('./components/workspace-shell/workspace-shell').then((m) => m.WorkspaceShellComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/workspaces/overview/workspace-detail').then((m) => m.WorkspaceDetailPage),
          },
          {
            path: 'details',
            loadComponent: () =>
              import('./pages/workspaces/settings/workspace-settings').then(
                (m) => m.WorkspaceSettingsPage,
              ),
          },
          {
            path: 'integrations',
            loadComponent: () =>
              import('./pages/workspaces/integrations/workspace-integrations').then(
                (m) => m.WorkspaceIntegrationsPage,
              ),
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./pages/workspaces/members/workspace-members').then(
                (m) => m.WorkspaceMembersPage,
              ),
          },
          {
            path: 'permissions',
            loadComponent: () =>
              import('./pages/workspaces/permissions/workspace-permissions').then(
                (m) => m.WorkspacePermissionsPage,
              ),
          },
        ],
      },
      {
        // Repositories routes
        path: 'repositories',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/repositories/list/repositories').then((m) => m.RepositoriesPage),
      },
      {
        // Findings routes
        path: 'code',
        loadComponent: () =>
          import('./pages/findings/findings-inbox').then((m) => m.FindingsInboxPage),
        data: { category: 'code' },
      },
      {
        // Secrets routes
        path: 'secrets',
        loadComponent: () =>
          import('./pages/findings/findings-inbox').then((m) => m.FindingsInboxPage),
        data: { category: 'secrets' },
      },
      {
        // Supply chain routes
        path: 'supply-chain',
        loadComponent: () =>
          import('./pages/findings/findings-inbox').then((m) => m.FindingsInboxPage),
        data: { category: 'supply-chain' },
      },
      {
        // Repository routes
        path: 'repositories/:repositoryId',
        redirectTo: 'repositories/:repositoryId/overview',
        pathMatch: 'full',
      },
      {
        // Repository detail routes
        path: 'repositories/:repositoryId/:section',
        loadComponent: () => import('./pages/repositories/detail/repository').then((m) => m.RepositoryPage),
      },
      {
        // Settings routes
        path: 'settings',
        loadComponent: () => import('./pages/account/settings/settings').then((m) => m.SettingsPage),
      },
    ],
  },
  // Catch-all route
  { path: '**', redirectTo: '' },
];
