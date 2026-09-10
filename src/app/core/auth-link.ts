export type AuthLinkKind = 'invite' | 'recovery' | 'oauth' | null;

export interface CapturedAuthLink {
  kind: AuthLinkKind;
  invite: string | null;
  hasAuthPayload: boolean;
}

export function captureAuthLinkFromLocation(
  location: Pick<Location, 'hash' | 'search' | 'pathname'> = window.location,
): CapturedAuthLink {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(location.search);
  const type = (hash.get('type') ?? query.get('type') ?? '').toLowerCase();
  const invite = query.get('invite');
  const hasAuthPayload = query.has('code') || hash.has('access_token') || hash.has('refresh_token');
  const path = location.pathname;

  let kind: AuthLinkKind = null;
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

  return { kind, invite, hasAuthPayload };
}
