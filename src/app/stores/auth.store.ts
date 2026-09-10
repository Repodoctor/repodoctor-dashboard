import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi } from '../api/auth.api';
import { UsersApi } from '../api/users.api';
import {
  createClient,
  type AuthChangeEvent,
  type Session as SupabaseSession,
  type SupabaseClient,
  type User as SupabaseUser,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { captureAuthLinkFromLocation, authErrorMessage, type CapturedAuthLink } from '../utils/auth-link';
import type { Session, User } from '../interfaces/api';

const ACCESS_KEY = 'repodoctor.accessToken';
const REFRESH_KEY = 'repodoctor.refreshToken';
const USER_KEY = 'repodoctor.user';
const PENDING_PASSWORD_KEY = 'repodoctor.pendingPassword';
const PENDING_INVITE_KEY = 'repodoctor.pendingInvite';

type PendingPassword = 'invite' | 'recovery';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly supabaseConfigured = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
  private supabase: SupabaseClient | null = null;
  private capturedLink: CapturedAuthLink = {
    kind: null,
    invite: null,
    hasAuthPayload: false,
    error: null,
    errorCode: null,
    errorDescription: null,
  };

  private readonly userSignal = signal<User | null>(this.supabaseConfigured ? null : this.readUser());
  private readyResolve!: () => void;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly avatarUrl = computed(() => this.userSignal()?.avatarUrl);
  readonly pendingPassword = signal<PendingPassword | null>(readStoredPendingPassword());

  constructor(
    private readonly authApi: AuthApi,
    private readonly usersApi: UsersApi,
    private readonly router: Router,
  ) {
    this.captureAuthLink();
    window.addEventListener('hashchange', () => {
      this.capturedLink = captureAuthLinkFromLocation();
      this.redirectAuthError();
    });
    if (this.supabaseConfigured) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.handleAuthEvent(event, session);
      });
    }
    void this.hydrate();
  }

  passwordSetupUrl(): string {
    return '/set-password';
  }

  consumeAuthUrlError(): boolean {
    this.capturedLink = captureAuthLinkFromLocation();
    return this.redirectAuthError();
  }

  clearPendingPassword(): void {
    this.pendingPassword.set(null);
    sessionStorage.removeItem(PENDING_PASSWORD_KEY);
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async waitForSession(timeoutMs = 4000): Promise<boolean> {
    await this.whenReady();
    if (this.isAuthenticated()) return true;
    if (!this.supabase) return false;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await this.supabase.auth.getSession();
      if (data.session) {
        this.applyPendingPassword(data.session);
        this.applySupabaseSession(data.session);
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return this.isAuthenticated();
  }

  async getAccessToken(): Promise<string | null> {
    const cached = sessionStorage.getItem(ACCESS_KEY);
    if (cached) return cached;
    if (this.supabase) {
      const { data } = await this.supabase.auth.getSession();
      if (data.session?.access_token) {
        sessionStorage.setItem(ACCESS_KEY, data.session.access_token);
        if (data.session.refresh_token) {
          sessionStorage.setItem(REFRESH_KEY, data.session.refresh_token);
        }
        return data.session.access_token;
      }
    }
    return null;
  }

  async signup(input: { email: string; password: string; displayName: string }, options?: { keepSession?: boolean }): Promise<void> {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { display_name: input.displayName } },
      });
      if (error) throw error;
      if (data.session && options?.keepSession) {
        this.applySupabaseSession(data.session);
        return;
      }
      if (data.session) {
        await this.supabase.auth.signOut();
      }
      this.userSignal.set(null);
      return;
    }
    await this.authApi.signup(input);
  }

  async signInWithGithub(options?: { invite?: string; next?: string }): Promise<void> {
    if (!this.supabase) {
      throw new Error('GitHub sign-in requires Supabase Auth.');
    }
    const params = new URLSearchParams();
    if (options?.invite) {
      sessionStorage.setItem(PENDING_INVITE_KEY, options.invite);
      params.set('invite', options.invite);
    }
    if (options?.next) params.set('next', options.next);
    const query = params.toString();
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${query ? `?${query}` : ''}`,
      },
    });
    if (error) throw error;
  }

  pendingInviteToken(): string | null {
    return sessionStorage.getItem(PENDING_INVITE_KEY);
  }

  clearPendingInvite(): void {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  }

  async login(input: { email: string; password: string }): Promise<void> {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw error;
      this.applySupabaseSession(data.session);
      return;
    }
    const session = await this.authApi.login(input);
    this.persist(session);
  }

  async forgotPassword(email: string): Promise<void> {
    if (this.supabase) {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      });
      if (error) throw error;
      return;
    }
    await this.authApi.forgotPassword(email);
  }

  async setPassword(password: string, displayName?: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Password updates require Supabase Auth.');
    }
    const { error } = await this.supabase.auth.updateUser({
      password,
      data: {
        password_set: true,
        ...(displayName?.trim() ? { display_name: displayName.trim() } : {}),
      },
    });
    if (error) throw error;
    this.clearPendingPassword();
    await this.loadProfile();
  }

  async changePassword(currentPassword: string, nextPassword: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Password updates require Supabase Auth.');
    }
    const email = this.user()?.email;
    if (!email) {
      throw new Error('Not signed in');
    }
    const { error: currentError } = await this.supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (currentError) throw currentError;
    const { error } = await this.supabase.auth.updateUser({
      password: nextPassword,
      current_password: currentPassword,
    });
    if (error) throw error;
  }

  async loadProfile(): Promise<void> {
    if (!(await this.getAccessToken())) return;
    const user = await this.usersApi.me();
    const merged: User = { ...user, avatarUrl: user.avatarUrl ?? this.userSignal()?.avatarUrl };
    this.userSignal.set(merged);
    sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  async updateProfile(displayName: string): Promise<User> {
    const user = await this.usersApi.updateMe(displayName);
    const merged: User = { ...user, avatarUrl: user.avatarUrl ?? this.userSignal()?.avatarUrl };
    this.userSignal.set(merged);
    sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
    return merged;
  }

  async deleteAccount(): Promise<{ deletedOrganizationIds: string[] }> {
    const token = await this.getAccessToken();
    const result = await this.usersApi.deleteMe();
    if (this.supabase && token && environment.supabaseUrl && environment.supabaseAnonKey) {
      await fetch(`${environment.supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: environment.supabaseAnonKey,
        },
      });
    }
    await this.logout();
    return result;
  }

  async logout(): Promise<void> {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    } else {
      const refreshToken = sessionStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        void this.authApi.logout(refreshToken);
      }
    }
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(PENDING_PASSWORD_KEY);
    sessionStorage.removeItem(PENDING_INVITE_KEY);
    this.pendingPassword.set(null);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/login');
  }

  private captureAuthLink(): void {
    this.capturedLink = captureAuthLinkFromLocation();
    if (this.redirectAuthError()) return;
    if (this.capturedLink.invite) {
      sessionStorage.setItem(PENDING_INVITE_KEY, this.capturedLink.invite);
    }
    if (this.capturedLink.kind === 'invite') {
      this.setPendingPassword('invite');
    } else if (this.capturedLink.kind === 'recovery') {
      this.setPendingPassword('recovery');
    }
  }

  private redirectAuthError(): boolean {
    const message = authErrorMessage(this.capturedLink);
    if (!message) return false;
    this.clearPendingPassword();
    void this.router.navigate(['/error'], {
      queryParams: {
        message,
        ...(this.capturedLink.errorCode ? { code: this.capturedLink.errorCode } : {}),
      },
      replaceUrl: true,
    });
    return true;
  }

  private handleAuthEvent(event: AuthChangeEvent, session: SupabaseSession | null): void {
    if (event === 'PASSWORD_RECOVERY') {
      this.setPendingPassword('recovery');
    } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      this.applyPendingPassword(session);
    }
    this.applySupabaseSession(session);
  }

  private applyPendingPassword(session: SupabaseSession): void {
    const kind = this.passwordSetupKind(session);
    if (kind) {
      this.setPendingPassword(kind);
      return;
    }
    if (this.shouldClearPending(session)) {
      this.clearPendingPassword();
    }
  }

  private passwordSetupKind(session: SupabaseSession): PendingPassword | null {
    const user = session.user;
    if (this.capturedLink.kind === 'oauth' || hasGithubIdentity(user)) {
      return null;
    }
    if (user.user_metadata?.['password_set'] === true) {
      return null;
    }
    if (this.capturedLink.kind === 'recovery') {
      return 'recovery';
    }
    if (this.capturedLink.kind === 'invite') {
      return 'invite';
    }
    if (this.pendingPassword() === 'recovery') {
      return 'recovery';
    }
    if (user.invited_at) {
      return 'invite';
    }
    return null;
  }

  private shouldClearPending(session: SupabaseSession): boolean {
    if (hasGithubIdentity(session.user) || this.capturedLink.kind === 'oauth') {
      return true;
    }
    if (session.user.user_metadata?.['password_set'] === true) {
      return true;
    }
    if (this.capturedLink.kind === 'invite' || this.capturedLink.kind === 'recovery') {
      return false;
    }
    return !session.user.invited_at;
  }

  private setPendingPassword(kind: PendingPassword): void {
    this.pendingPassword.set(kind);
    sessionStorage.setItem(PENDING_PASSWORD_KEY, kind);
  }

  private async hydrate(): Promise<void> {
    try {
      if (this.supabase) {
        const { data } = await this.supabase.auth.getSession();
        if (data.session) {
          this.applyPendingPassword(data.session);
        }
        this.applySupabaseSession(data.session);
      }
    } finally {
      this.readyResolve();
    }
  }

  private applySupabaseSession(session: SupabaseSession | null): void {
    const supabaseUser = session?.user;
    if (!supabaseUser || !session) {
      this.userSignal.set(null);
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(USER_KEY);
      return;
    }
    const email = supabaseUser.email ?? '';
    const displayName =
      (supabaseUser.user_metadata?.['display_name'] as string | undefined) ??
      (supabaseUser.user_metadata?.['full_name'] as string | undefined) ??
      email;
    const avatarUrl =
      (supabaseUser.user_metadata?.['avatar_url'] as string | undefined) ??
      (supabaseUser.user_metadata?.['picture'] as string | undefined);
    const user: User = {
      id: supabaseUser.id,
      email,
      displayName,
      avatarUrl,
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at ?? supabaseUser.created_at,
    };
    sessionStorage.setItem(ACCESS_KEY, session.access_token);
    sessionStorage.setItem(REFRESH_KEY, session.refresh_token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  private persist(session: Session): void {
    sessionStorage.setItem(ACCESS_KEY, session.accessToken);
    sessionStorage.setItem(REFRESH_KEY, session.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.userSignal.set(session.user);
  }

  private readUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

function readStoredPendingPassword(): PendingPassword | null {
  const value = sessionStorage.getItem(PENDING_PASSWORD_KEY);
  return value === 'invite' || value === 'recovery' ? value : null;
}

function hasGithubIdentity(user: SupabaseUser): boolean {
  const provider = user.app_metadata?.['provider'];
  const providers = user.app_metadata?.['providers'];
  if (provider === 'github') return true;
  if (Array.isArray(providers) && providers.includes('github')) return true;
  return user.identities?.some((identity) => identity.provider === 'github') ?? false;
}
