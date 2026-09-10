import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { lastValueFrom, from } from 'rxjs';
import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  circuitBreaker,
  handleWhen,
  retry,
  wrap,
} from 'cockatiel';
import { environment } from '../../environments/environment';

const RETRY_STATUS = new Set([0, 408, 429, 502, 503, 504]);
const IDEMPOTENT = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']);

function isGatewayRequest(url: string): boolean {
  const gateway = environment.gatewayUrl.replace(/\/$/, '');
  const apiBase = environment.apiBaseUrl.replace(/\/$/, '');
  return url.startsWith(gateway) || url.startsWith(apiBase);
}

function isRetryable(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return RETRY_STATUS.has(error.status);
  }
  return true;
}

const policy = wrap(
  circuitBreaker(handleWhen(isRetryable), {
    halfOpenAfter: 10_000,
    breaker: new ConsecutiveBreaker(5),
  }),
  retry(handleWhen(isRetryable), {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({ initialDelay: 200, maxDelay: 2000 }),
  }),
);

/**
 * Cockatiel retry + circuit breaker for idempotent gateway calls.
 * POST connect/signup/login are skipped so retries cannot duplicate accounts.
 */
export const resilienceInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isGatewayRequest(req.url) || !IDEMPOTENT.has(req.method.toUpperCase())) {
    return next(req);
  }
  return from(policy.execute(() => lastValueFrom(next(req))));
};
