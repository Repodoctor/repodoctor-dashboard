export type AuthLinkKind = 'invite' | 'recovery' | 'oauth' | null;

export interface CapturedAuthLink {
  kind: AuthLinkKind;
  invite: string | null;
  hasAuthPayload: boolean;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

export function captureAuthLinkFromLocation(
  location: Pick<Location, 'hash' | 'search' | 'pathname'> = window.location,
): CapturedAuthLink {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  const type = (hash.get('type') ?? query.get('type') ?? '').toLowerCase();
  const invite = query.get('invite');
  const hasAuthPayload =
    query.has('code') ||
    query.has('token_hash') ||
    hash.has('access_token') ||
    hash.has('refresh_token');
  const path = location.pathname;
  const error = hash.get('error') ?? query.get('error');
  const errorCode = hash.get('error_code') ?? query.get('error_code');
  const errorDescription = hash.get('error_description') ?? query.get('error_description');

  let kind: AuthLinkKind = null;
  if (!error) {
    if (type === 'recovery') {
      kind = 'recovery';
    } else if (type === 'invite') {
      kind = 'invite';
    } else if (hasAuthPayload && invite) {
      kind = 'invite';
    } else if (path.startsWith('/auth/callback') && hasAuthPayload) {
      kind = 'oauth';
    } else if (hasAuthPayload && (path.startsWith('/reset-password') || path.startsWith('/set-password'))) {
      kind = 'recovery';
    }
  }

  return {
    kind,
    invite,
    hasAuthPayload,
    error,
    errorCode,
    errorDescription,
  };
}

export function authErrorMessage(link: CapturedAuthLink): string | null {
  if (!link.error && !link.errorDescription) return null;
  return link.errorDescription?.trim() || 'This email link is invalid or has expired.';
}

export function hasPasswordSetupLink(link: CapturedAuthLink): boolean {
  return link.hasAuthPayload;
}

export type PasswordSetupDestination = '/' | '/dashboard' | null;

export function passwordSetupDestination(input: {
  hasSetupLink: boolean;
  pendingPassword: boolean;
  authenticated: boolean;
}): PasswordSetupDestination {
  if (input.hasSetupLink) return null;
  if (input.pendingPassword && input.authenticated) return null;
  if (input.authenticated) return '/dashboard';
  return '/';
}
