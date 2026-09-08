# RepoDoctor Dashboard

Angular frontend for RepoDoctor. The browser authenticates with **Supabase Auth** and talks to **repodoctor-gateway** for product APIs. Internal microservices are not exposed to the browser.


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

See `.env.example` (`NG_APP_GATEWAY_URL`, `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_ANON_KEY`). Cloudflare builds use the same vars. Never put a service-role key in the browser.

## Testing

- Angular unit tests (Karma/ChromeHeadless)
- Playwright e2e (`npm run e2e`) against a running gateway + dashboard

## Deployment

Cloudflare Workers static assets (`wrangler.jsonc`). SPA fallback is `assets.not_found_handling = "single-page-application"` — do not use `/* /index.html 200` in `_redirects`; Wrangler rejects that rule as an infinite loop.
