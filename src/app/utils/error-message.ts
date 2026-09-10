import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '../interfaces/api';

export function isHttpError(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiError | undefined;
    if (body?.message) return body.message;
    if (error.status === 0) return 'Cannot reach the RepoDoctor gateway.';
    return error.statusText || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
