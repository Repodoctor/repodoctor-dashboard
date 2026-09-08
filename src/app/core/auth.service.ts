import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Organization, Session, User } from './models';

const ACCESS_KEY = 'repodoctor.accessToken';
const REFRESH_KEY = 'repodoctor.refreshToken';
const USER_KEY = 'repodoctor.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(this.readUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  accessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  }

  async signup(input: { email: string; password: string; displayName: string }): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<Session>(`${environment.apiBaseUrl}/auth/signup`, input),
    );
    this.persist(session);
  }

  async login(input: { email: string; password: string }): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<Session>(`${environment.apiBaseUrl}/auth/login`, input),
    );
    this.persist(session);
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/auth/forgot-password`, { email }),
    );
  }

  async loadProfile(): Promise<void> {
    if (!this.accessToken()) return;
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

  logout(): void {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      this.http.post(`${environment.apiBaseUrl}/auth/logout`, { refreshToken }).subscribe();
    }
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/login');
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
