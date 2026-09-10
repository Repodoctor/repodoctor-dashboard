import { expect, test } from '@playwright/test';

test('homepage is the main landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Diagnose repositories/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Services behind the dashboard' })).toBeVisible();
  await expect(page.getByText('Unified API surface')).toBeVisible();
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
