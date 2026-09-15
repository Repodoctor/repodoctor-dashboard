import {
  captureAuthLinkFromLocation,
  hasPasswordSetupLink,
  passwordSetupDestination,
} from './auth-link';

describe('password setup links', () => {
  it('treats recovery and invite payloads as setup links', () => {
    const recovery = captureAuthLinkFromLocation({
      pathname: '/reset-password',
      search: '',
      hash: '#access_token=abc&type=recovery',
    });
    expect(hasPasswordSetupLink(recovery)).toBeTrue();

    const code = captureAuthLinkFromLocation({
      pathname: '/set-password',
      search: '?code=pkce-code',
      hash: '',
    });
    expect(hasPasswordSetupLink(code)).toBeTrue();
  });

  it('does not treat a bare password page as a setup link', () => {
    const empty = captureAuthLinkFromLocation({
      pathname: '/set-password',
      search: '',
      hash: '',
    });
    expect(hasPasswordSetupLink(empty)).toBeFalse();

    const typeOnly = captureAuthLinkFromLocation({
      pathname: '/reset-password',
      search: '?type=recovery',
      hash: '',
    });
    expect(hasPasswordSetupLink(typeOnly)).toBeFalse();
  });

  it('sends missing links home and signed-in users to the dashboard', () => {
    expect(
      passwordSetupDestination({
        hasSetupLink: false,
        pendingPassword: false,
        authenticated: false,
      }),
    ).toBe('/');
    expect(
      passwordSetupDestination({
        hasSetupLink: false,
        pendingPassword: true,
        authenticated: false,
      }),
    ).toBe('/');
    expect(
      passwordSetupDestination({
        hasSetupLink: false,
        pendingPassword: false,
        authenticated: true,
      }),
    ).toBe('/dashboard');
  });

  it('keeps invite and recovery flows on the password page', () => {
    expect(
      passwordSetupDestination({
        hasSetupLink: true,
        pendingPassword: false,
        authenticated: false,
      }),
    ).toBeNull();
    expect(
      passwordSetupDestination({
        hasSetupLink: false,
        pendingPassword: true,
        authenticated: true,
      }),
    ).toBeNull();
  });
});
