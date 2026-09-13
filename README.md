# RepoDoctor Dashboard

Angular frontend for RepoDoctor. The browser authenticates with **Supabase Auth** and talks to **repodoctor-gateway** for product APIs. Internal microservices are not exposed to the browser.

Version: `0.1.0-alpha.1` (alpha).

## Purpose

Public marketing pages plus a developer dashboard for authentication, organizations, repositories, findings, and analysis.

## Visual system

Near-black panels with pulse green (`#3ee0b2`), in the spirit of GitHub and Supabase. Tailwind CSS. Mobile-first: the signed-in sidenav is hidden below `lg`; account navigation stays in the avatar menu. Tables stack as cards on small screens and sort/search/paginate on desktop.

## Page groups

- `src/app/pages/public/` — home, Products, Solutions, Pricing, Docs
- `src/app/pages/auth/` — login, signup, password, callback, error
- `src/app/pages/organizations/` — list, overview, details, integrations, members, permissions
- `src/app/pages/repositories/` — all-repos list plus repository detail
- `src/app/pages/findings/` — Code, Secrets, and Supply chain inboxes
- `src/app/pages/account/` — profile settings and SCM callback
- `src/app/pages/dashboard/` — signed-in home

## Routes

- `/` `/products` `/solutions` `/pricing` `/docs`
- `/login` `/signup` `/forgot-password`
- `/dashboard`
- `/organizations` `/organizations/:organizationId` (tabs: overview, details, integrations, members, permissions — permissions is OWNER/ADMIN only)
- `/repositories` `/repositories/:repositoryId/{overview,findings,analysis,settings}`
- `/code` `/secrets` `/supply-chain`
- `/settings`

## Free plan (alpha)

Only Free is available. Paid checkout (Stripe) is not implemented yet.

- 2 organizations you own
- 20 repositories per organization
- 5 members per organization
- 10 pending invites
- 1 GitHub App installation per organization
- 10 manual scans per repository per day

Repository permission `NONE` hides a repo from MEMBER and VIEWER. OWNER/ADMIN still see it.

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

`workers/security-headers.js` runs first: HTTP → HTTPS 301, plus HSTS, CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`. CSP allows Angular’s stylesheet `onload="this.media='all'"` via `'unsafe-hashes'` (not `'unsafe-inline'`). `public/robots.txt` blocks AI training crawlers. Also enable **Always Use HTTPS** and the **Cloudflare WAF** on the zone; those are dashboard settings, not app code.
