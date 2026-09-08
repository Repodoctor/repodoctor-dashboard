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
          import('./pages/organization-detail.page').then((m) => m.OrganizationDetailPage),
      },
      {
        path: 'organizations/:organizationId/repositories',
        loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage),
        data: { title: 'Repositories', detail: 'Connect a GitHub App in a later phase to ingest repositories.' },
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
