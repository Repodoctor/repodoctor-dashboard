import { expect, test } from '@playwright/test';

test('homepage is the main landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Diagnose repositories/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Services behind the dashboard' })).toBeVisible();
  await expect(page.getByText('Unified API surface')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Products' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible();
});

test('public marketing pages render', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /Free while RepoDoctor is in alpha/ })).toBeVisible();
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: /How to use RepoDoctor/ })).toBeVisible();
});

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByText('Create account')).toBeVisible();
});

test('signup page renders', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: 'Create your workspace account' })).toBeVisible();
  await expect(page.getByText('Confirm password')).toBeVisible();
});

test('set password page renders for email links', async ({ page }) => {
  await page.goto('/set-password');
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  await expect(page.getByText('This page is for the link in your email.')).toBeVisible();
});

test('expired auth links show a centered error page', async ({ page }) => {
  await page.goto(
    '/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
  );
  await expect(page.getByRole('heading', { name: 'This link is no longer valid' })).toBeVisible();
  await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
});
