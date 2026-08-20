---
name: shopline-app-dev-doc-gaps
description: SHOPLINE APP-DEVELOPMENT documentation gaps — undocumented platform behaviors verified in real app projects (CLI dev contract, OAuth callback & install contract, embedded admin, permission point mapping, App Bridge). Use when the official docs do not explain an app-dev failure or behavior. Withdrawable: once official docs cover an entry, delete it from this skill.
whenToUse: Local SHOPLINE CLI app development, OAuth callback failures, embedded admin integration, app permission-scope errors, App Bridge wiring — app-development scenarios where developer.shopline.com has no answer.
---

# SHOPLINE App-Dev Doc Gaps（应用开发文档盲区补充）

This skill records SHOPLINE **app-development** platform behaviors that were **not documented
(or were documented incorrectly) on developer.shopline.com** and cost real debugging time in a
production-bound app project (Orbit PWA, a DTC PWA Enabler SHOPLINE app, verified 2026-08-20).
It is a *supplement to the official docs* for app development only — check the official docs
first, and **withdraw each entry as soon as the official docs cover it**.

## Scope & boundaries（适用范围与边界）

This skill covers ONLY app-development doc gaps:

| ✅ In scope (app development) | ❌ Out of scope |
| --- | --- |
| SHOPLINE CLI local development contract (process configs, env semantics, install probe, injected assets) | Theme development (Sline/Liquid templates, theme structure) |
| OAuth callback & install contract (callback path, admin-proxy callback, per-visit install params, handle resolution) | Storefront pure-frontend issues (SDK internals, cache strategies) |
| Embedded admin integration (context routing, session handle, App Bridge wiring & auth protocol) | The SHOPLINE Developer MCP tools themselves |
| App permission point mapping (OpenAPI scope → endpoint requirements) | Generic web knowledge (cookies, CORS, HTTPS, layout) |

Boundary rules:
- A pitfall stays ONLY if it is platform-level and app-dev-related; project-internal
  conventions and generic web knowledge are deliberately excluded.
- If a future gap belongs to theme dev or storefront, create a separate
  `shopline-theme-doc-gaps`-style skill instead of extending this one.
- When in doubt, exclude: this skill must stay a small, mechanical delta over the docs.

## Withdrawal policy (撤回策略)

- Every entry has a **verified date** and a row in the coverage table.
- When official documentation starts covering an entry, **delete that entry** from this
  skill and flip its table row to `fixed → withdrawn`.
- Do not merge this knowledge into the other `shopline-*` skills: those mirror documented
  behavior; this one is the removable delta.
- Track withdrawals in the repo README ("Doc gap status") so reviewers can audit.

## Doc coverage status (updated 2026-08-20)

| # | Gap | Verified | Official docs |
| --- | --- | --- | --- |
| A1 | CLI requires both backend AND frontend process configs; frontend must reverse-proxy to the backend port | 2026-08-20 | gap |
| A2 | CLI env semantics: backend reads `BACKEND_PORT`; `PORT` is the frontend port | 2026-08-20 | gap |
| A3 | CLI install sends an UNSIGNED webhook probe that only accepts 2xx | 2026-08-20 | gap |
| A4 | Injected script tag keeps the old tunnel host after CLI restart; CLI may hand back an http:// app URL | 2026-08-20 | gap |
| B1 | Callback path convention `/api/auth/callback` (CLI registers exactly this) | 2026-08-20 | gap |
| B2 | Callback may arrive via the Admin proxy (`proxyDomain`): answer JSON in embedded context, 302 only top-level; OAuth codes are single-use | 2026-08-20 | gap |
| B3 | Embedded apps reload the app root WITH install params on every visit; route by context (authorized / embedded / top-level); the authorize page refuses to be framed | 2026-08-20 | gap |
| B4 | The iframe URL often has NO `handle` — resolve it from the session (cookie JWT / App Bridge token payload) | 2026-08-20 | gap |
| C1 | `GET /themes.json` needs the `read_content` permission point, NOT `read_themes` (which only covers theme file/asset endpoints) | 2026-08-20 | gap |
| D1 | App Bridge browser wiring: UMD build `dist/next.umd.js`, `window.shopline` global, `shared.getSessionToken(app)` | 2026-08-20 | gap |
| D2 | App Bridge auth protocol: 403 + `X-SHOPLINE-API-Request-Failure-Reauthorize`, exit-iframe bounce, SessionToken = JWT HS256 signed with **Base64(appSecret)** | 2026-08-20 | gap |

## A. CLI local development contract (CLI 本地开发契约)

### A1. Both process configs are mandatory; frontend must reverse-proxy to the backend

- **Symptom**: `shopline app dev` crashes with `Cannot read properties of undefined (reading 'dev')`; or with a static-file frontend, every API route 404s.
- **Root cause (doc gap)**: the CLI runs TWO processes (backend + frontend) and tunnels to the **frontend port**; the architecture is tunnel → frontend → backend. Missing `web/shopline.web.toml` (frontend) breaks `setupDevProcesses`.
- **Fix**: keep both `app/shopline.web.toml` (backend process) and `web/shopline.web.toml` (frontend process) present; the frontend process must be a reverse proxy to the backend port (never a static file server).
- **Verified**: 2026-08-20.

### A2. Env semantics: read `BACKEND_PORT`, not `PORT`

- **Symptom**: the backend listens on the wrong port; calls from the tunnel fail or hit the frontend.
- **Root cause (doc gap)**: the CLI injects `BACKEND_PORT` (the tunnel target) into the backend process, while `PORT` is the **frontend** port.
- **Fix**: in backend code/config read `BACKEND_PORT` first and fall back to `PORT` only if absent.
- **Verified**: 2026-08-20.

### A3. The CLI install probe is unsigned — answer 200, keep verifying real webhooks

- **Symptom**: during install the CLI's probe to your webhook endpoint returns 401 and the CLI reports failure, or you drop real events because you started accepting everything.
- **Root cause (doc gap)**: the CLI POSTs an *unsigned* probe to the webhook path during app install and only accepts 2xx. Official docs describe signed platform webhooks only.
- **Fix**: return 200 (skip) for unsigned requests while still HMAC-verifying signed platform webhooks (header `X-Shopline-Hmac-Sha256`).
- **Verified**: 2026-08-20.

### A4. Injected storefront assets keep the OLD tunnel host; CLI can hand back http://

- **Symptom**: after every CLI restart the storefront console shows `GET https://<dead-tunnel>/sdk/orbit.js ... ERR_NAME_NOT_RESOLVED` (SDK never runs), or the https storefront blocks the manifest/icons with a mixed-content error.
- **Root cause (doc gap)**: quick-tunnel URLs rotate on every restart but already-injected script tags keep the old host; on some runs the CLI passes an `http://` `SHOPLINE_APP_URL` while the tunnel is https, so generated asset URLs come back http and are blocked.
- **Fix**: update the script tag `src` whenever it differs from the current app URL (re-run on re-auth and on "Enable / re-inject"); normalize any `*.trycloudflare.com` host to https; have the SDK upgrade http asset links to https as a fallback; after each CLI restart, re-authorize or hit Enable / re-inject, then hard-refresh the storefront.
- **Verified**: 2026-08-20.

## B. OAuth callback & install contract (OAuth 回调与安装契约)

### B1. Callback path must be `/api/auth/callback`

- **Symptom**: OAuth flow breaks or "redirect_uri not allowed" even though the Portal callback list looks right.
- **Root cause (doc gap)**: the CLI registers exactly `{appUrl}/api/auth/callback` in the Partner Portal (its `authPathPrefix` default); deviating from this path desyncs the Portal entry.
- **Fix**: keep the callback route at `/api/auth/callback` (build it as `{SHOPLINE_APP_URL}/api/auth/callback`); when using a custom tunnel, set the Portal callback URL to the same path.
- **Verified**: 2026-08-20.

### B2. Callback may arrive through the Admin proxy; codes are single-use

- **Symptom**: after authorizing, the app page is blank or the callback response is not parsed; re-opening an old callback URL fails.
- **Root cause (doc gap)**: the callback can be proxied by the SHOPLINE Admin (`https://{store}/admin/apps/{app}/api/auth/callback?...&proxyDomain=...`); in that embedded context the caller expects a **JSON** response (its frontend parses it), while only plain top-level navigations should get a 302. OAuth codes are single-use — the same code never works twice.
- **Fix**: detect the proxy/embedded context (e.g. `proxyDomain` param or admin referer) and return JSON; 302 only for top-level navigations; never replay callback URLs from browser history while debugging.
- **Verified**: 2026-08-20.

### B3. Embedded apps load the root WITH install params on every visit — route by context

- **Symptom**: the embedded app iframe shows a blank "refused to connect" page.
- **Root cause (doc gap)**: the SHOPLINE Admin points its iframe at `{appUrl}?appkey&handle&lang&timestamp&sign` on **every visit**; an unconditional redirect to the authorize page fails because the authorize page refuses to be framed.
- **Fix**: the root route must route by context — authorized session → admin SPA; embedded (has `lang` or admin referer) → `/exit-iframe` (break out of the iframe, then authorize); plain top-level GET → authorize page directly. Plain root GETs without params should serve the SPA (it self-checks).
- **Verified**: 2026-08-20.

### B4. The iframe URL often has NO `handle` — resolve it from the session

- **Symptom**: the SPA always shows the "Connect" screen and "Authorize store" fails with "Missing store handle".
- **Root cause (doc gap)**: the embedded iframe URL does not reliably carry `handle`; requiring it as a query param breaks embedded auth.
- **Fix**: resolve the handle server-side from the session (cookie JWT or the App Bridge Bearer token payload) in `/api/auth/status`; the frontend `authorize()` should use the backend-resolved handle.
- **Verified**: 2026-08-20.

## C. Permission point mapping (权限点映射)

### C1. `read_content` is required for `GET /themes.json`, not `read_themes`

- **Symptom**: `GET /admin/openapi/{v}/themes.json` returns a permission error although `read_themes` was granted.
- **Root cause (doc gap)**: `read_themes` only covers theme file/asset endpoints; theme **inventory** (`/themes.json`) needs the `read_content` permission point.
- **Fix**: request both points (`read_themes,read_content`); remember that adding a scope requires the merchant to re-authorize (SHOPLINE re-prompts).
- **Verified**: 2026-08-20.

## D. App Bridge knowledge gaps (App Bridge 盲区)

### D1. Browser wiring: UMD build, `window.shopline`, `shared.getSessionToken(app)`

- **Symptom**: `window.shopline` is undefined; `getSessionToken` is not a function.
- **Root cause (doc gap)**: the official `@shoplineos/app-bridge` package exposes a UMD build at `dist/next.umd.js` (vendor it as `web/vendor/appbridge.js`); after `init(appKey)` (or the `<meta name="shopline-app-key">` auto-init) the SDK lives on `window.shopline` = { app, oauth, session, shared, ... }; the session token comes from `shared.getSessionToken(app)`.
- **Fix**: load the UMD build, init with the app key (meta tag or `init`), then call `window.shopline.shared.getSessionToken(app)`; send it as `Authorization: Bearer <token>`.
- **Verified**: 2026-08-20.

### D2. Auth protocol: 403 + reauthorize header, exit-iframe bounce, Base64(appSecret) JWT

- **Symptom**: embedded API calls fail with 403; the UI does not recover; verifying the SessionToken signature with the raw app secret fails.
- **Root cause (doc gap)**: unauthenticated Bearer requests get 403 with an `X-SHOPLINE-API-Request-Failure-Reauthorize` header; embedded requests bounce through `/exit-iframe` (a page that sets `top.location`); the SessionToken is a JWT signed HS256 with the **Base64(appSecret)** as the signing key — not the raw secret.
- **Fix**: on 403 + reauthorize header, bounce through `/exit-iframe`; verify JWTs with `Base64(appSecret)`; keep `/exit-iframe` implemented and reachable.
- **Verified**: 2026-08-20.

## References

- Official docs to re-check before trusting this skill: https://developer.shopline.com/ (App authorization, SHOPLINE CLI, App Bridge, Permission Point List)
- Source project: Orbit PWA (DTC PWA Enabler) — docs/LOCAL_DEBUG.md, verified 2026-08-20
- Feedback path: https://github.com/lunw/shopline-ai-toolkit-dsh/issues (report an entry as covered by official docs → it gets withdrawn here)
