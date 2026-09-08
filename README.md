# RepoDoctor Dashboard

Angular 19 standalone application for RepoDoctor. The browser talks **only** to `repodoctor-gateway`.

## Purpose

Developer-focused UI for authentication, organizations, repositories, findings, and analysis.

## Visual system

Light green on near-black (GitHub / Linear / Vercel inspired). Tailwind CSS.

## Routes

- `/login` `/signup` `/forgot-password`
- `/dashboard`
- `/organizations` `/organizations/:organizationId` `/organizations/:organizationId/repositories`
- `/repositories/:repositoryId/{overview,findings,reviews,graph,security,dependencies,ci,docs,analysis,ai}`
- `/settings`

## Local development

```bash
npm install
npm start
```

Serves `http://127.0.0.1:43120`. Start the gateway on `43111` first.

```bash
npm run typecheck
npm test
npm run build
```

## Environment

See `.env.example` (`NG_APP_GATEWAY_URL`, `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_ANON_KEY`). Cloudflare Pages uses the same build vars. Never put a service-role key in the browser.

## Testing

- Angular unit tests (Karma/ChromeHeadless)
- Playwright e2e (`npm run e2e`) against a running gateway + dashboard

## Deployment

Cloudflare Pages. SPA fallback is `public/_redirects`.
