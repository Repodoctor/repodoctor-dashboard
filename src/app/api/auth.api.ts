import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type { Session } from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  signup(input: { email: string; password: string; displayName: string }): Promise<Session> {
    return this.api.post<Session>('/auth/signup', input);
  }

  login(input: { email: string; password: string }): Promise<Session> {
    return this.api.post<Session>('/auth/login', input);
  }

  forgotPassword(email: string): Promise<void> {
    return this.api.post('/auth/forgot-password', { email });
  }

  logout(refreshToken: string): Promise<void> {
    return this.api.post('/auth/logout', { refreshToken });
  }
}
