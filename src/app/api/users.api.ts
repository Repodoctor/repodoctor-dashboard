import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import type { User } from '../interfaces/api';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly api = inject(ApiClient);

  me(): Promise<User> {
    return this.api.get<User>('/users/me');
  }

  updateMe(displayName: string): Promise<User> {
    return this.api.patch<User>('/users/me', { displayName });
  }

  deleteMe(): Promise<{ deletedOrganizationIds: string[] }> {
    return this.api.delete<{ deletedOrganizationIds: string[] }>('/users/me');
  }
}
