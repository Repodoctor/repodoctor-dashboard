import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { createClient, type Session as SupabaseSession, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import type { Organization, Session, User } from './models';

const ACCESS_KEY = 'repodoctor.accessToken';
const REFRESH_KEY = 'repodoctor.refreshToken';
const USER_KEY = 'repodoctor.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabaseConfigured = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
  private readonly supabase: SupabaseClient | null = this.supabaseConfigured
    ? createClient(environment.supabaseUrl, environment.supabaseAnonKey)
    : null;

  private readonly userSignal = signal<User | null>(this.supabaseConfigured ? null : this.readUser());
  private readyResolve!: () => void;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    void this.hydrate();
    if (this.supabase) {
      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.applySupabaseSession(session);
      });
    }
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async getAccessToken(): Promise<string | null> {
    if (this.supabase) {
      const { data } = await this.supabase.auth.getSession();
      return data.session?.access_token ?? null;
    }
    return sessionStorage.getItem(ACCESS_KEY);
  }

  async signup(input: { email: string; password: string; displayName: string }): Promise<void> {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { display_name: input.displayName } },
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error('Check your email to confirm your account before signing in.');
      }
      this.applySupabaseSession(data.session);
      return;
    }
    const session = await firstValueFrom(
      this.http.post<Session>(`${environment.apiBaseUrl}/auth/signup`, input),
    );
    this.persist(session);
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
    const session = await firstValueFrom(
      this.http.post<Session>(`${environment.apiBaseUrl}/auth/login`, input),
    );
    this.persist(session);
  }

  async forgotPassword(email: string): Promise<void> {
    if (this.supabase) {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return;
    }
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/auth/forgot-password`, { email }));
  }

  async loadProfile(): Promise<void> {
    if (!(await this.getAccessToken())) return;
    const user = await firstValueFrom(this.http.get<User>(`${environment.apiBaseUrl}/users/me`));
    this.userSignal.set(user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async listOrganizations(): Promise<Organization[]> {
    const response = await firstValueFrom(
      this.http.get<{ items: Organization[] }>(`${environment.apiBaseUrl}/organizations`),
    );
    return response.items;
  }

  async createOrganization(input: { name: string; slug?: string }): Promise<Organization> {
    return firstValueFrom(
      this.http.post<Organization>(`${environment.apiBaseUrl}/organizations`, input),
    );
  }

  async getOrganization(id: string): Promise<Organization> {
    return firstValueFrom(this.http.get<Organization>(`${environment.apiBaseUrl}/organizations/${id}`));
  }

  async logout(): Promise<void> {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    } else {
      const refreshToken = sessionStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        this.http.post(`${environment.apiBaseUrl}/auth/logout`, { refreshToken }).subscribe();
      }
    }
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/login');
  }

  private async hydrate(): Promise<void> {
    try {
      if (this.supabase) {
        const { data } = await this.supabase.auth.getSession();
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
    const user: User = {
      id: supabaseUser.id,
      email,
      displayName,
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
