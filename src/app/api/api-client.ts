import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Shared gateway client. Every dashboard HTTP call goes through {@link request}
 * so the base URL, query serialization, and HttpClient usage stay in one place.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly rootUrl = environment.apiBaseUrl.replace(/\/$/, '');

  get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>('POST', path, { body, params });
  }

  put<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>('PUT', path, { body, params });
  }

  patch<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>('PATCH', path, { body, params });
  }

  delete<T = void>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>('DELETE', path, { params });
  }

  request<T>(method: HttpMethod, path: string, options?: { body?: unknown; params?: QueryParams }): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const body = options?.body;
    switch (method) {
      case 'GET':
        return firstValueFrom(this.http.get<T>(url));
      case 'POST':
        return firstValueFrom(this.http.post<T>(url, body ?? null));
      case 'PUT':
        return firstValueFrom(this.http.put<T>(url, body ?? null));
      case 'PATCH':
        return firstValueFrom(this.http.patch<T>(url, body ?? null));
      case 'DELETE':
        return firstValueFrom(this.http.delete<T>(url));
    }
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.rootUrl}${normalized}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}
