---
name: shopline-app-dev-doc-gaps
description: SHOPLINE APP-DEVELOPMENT documentation gaps — undocumented platform behaviors verified in real app projects (CLI dev contract, OAuth callback & install contract, embedded admin, permission point mapping, App Bridge, billing/subscription webhooks, app-store billing config). Use when the official docs do not explain an app-dev failure or behavior. Withdrawable: once official docs cover an entry, delete it from this skill.
whenToUse: Local SHOPLINE CLI app development, OAuth callback failures, embedded admin integration, app permission-scope errors, App Bridge wiring, billing/subscription webhook failures, app-store paid-plan config — app-development scenarios where developer.shopline.com has no answer.
---

# SHOPLINE App-Dev Doc Gaps（应用开发文档盲区补充）

This skill records SHOPLINE **app-development** platform behaviors that were **not documented
(or were documented incorrectly) on developer.shopline.com** and cost real debugging time in a
production-bound app project (Orbit PWA, a DTC PWA Enabler SHOPLINE app; verified across three debugging rounds, 2026-08-20 → 2026-08-22, including production install, billing and hardening).
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

## Doc coverage status (updated 2026-08-22)

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
| B5 | OAuth callback MUST answer fast (< 2 s); heavy provisioning must be fire-and-forget; gate install shortcuts on `oauthCompletedAt` | 2026-08-22 | gap |
| D3 | Cross-store session cookie isolation: embedded iframes for multiple stores share one origin/cookie jar; cookies must be per-store and handle-bound | 2026-08-22 | gap |
| E1 | Billing webhook event ids: `appsubscription/paid`, `appsubscription/create`, `appsubscription/expiration` (NOT activated/expired); subscriptions are version-scoped | 2026-08-22 | gap |
| E2 | `X-Shopline-Shop-Id` is a NUMERIC store id, not the handle; resolve via platformShopId / `X-Shopline-Shop-Domain` | 2026-08-22 | gap |
| E3 | `featureKeyList` is a snapshot taken at subscription time; Developer Center feature-key config does not retroactively update existing subscriptions | 2026-08-22 | gap |
| F1 | App-store billing config: associate feature points with each paid plan and configure the subscription group (shown in the marketplace listing) | 2026-08-22 | gap |

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

### B5. OAuth callback MUST answer fast (< 2 s); provisioning must be fire-and-forget

- **Symptom**: the merchant's store shows "应用尚未安装" / cannot pin / app missing from the list even though your side logged `store provisioned`; or a previously-failed install stays "not installed" forever.
- **Root cause (doc gap)**: the platform expects the OAuth callback to answer quickly (~2 s). Running store-info fetch + all webhook subscriptions + script-tag injection synchronously took ~20 s, the platform timed out and never confirmed the install. The "already installed + valid token → /admin" shortcut is only valid AFTER a confirmed callback; for stores whose install never completed it traps them permanently.
- **Fix**: the callback only exchanges the code, persists the store record, sets the session cookie and redirects; store info / webhooks / script tag run fire-and-forget afterwards. Gate the install shortcut on an `oauthCompletedAt` field (set when the callback really answered) — a store without it must run the authorization flow again on every install request.
- **Verified**: 2026-08-22.

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

### D3. Cross-store session cookie isolation (security)

- **Symptom**: two SHOPLINE store admins embed the app under the SAME origin (one app domain) and share one cookie jar — store A's admin UI shows store B's subscription/plan after B authorized last.
- **Root cause (doc gap)**: embedded apps serve many stores from one origin; a single shared session cookie is overwritten by whichever store authorized last. The leak can be MASKED when App Bridge never initializes (empty `shopline-app-key` meta / no `window.shopline.init` call), because the shared cookie silently covers for it — after cookie isolation the app may suddenly show 401s until two-phase auth is restored.
- **Fix**: (a) scope the cookie per store (`orbit_session_<handle>`), (b) bind every request to its expected handle (query → Referer host) and accept only that store's cookie, (c) refuse a Bearer token naming a different handle, (d) resolve identity to the real store key (numeric `platformShopId`). Add a reauth-loop guard: a second 401 shows the authorize screen instead of bouncing forever.
- **Verified**: 2026-08-22.

## E. Billing & subscription webhooks (计费与订阅 webhook)

### E1. Official appsubscription event ids are NOT what they look like

- **Symptom**: a successful purchase never activates the plan — the admin keeps prompting for a trial; subscribing to what sounds right returns 422 "There are no available versions for subscription for the current event" and the subscription silently never fires.
- **Root cause (doc gap)**: the real billing events are `appsubscription/paid` (payment finalized: 200 ok / 300 canceled / 400 failed), **`appsubscription/create`** (plan activated — carries `subPackage.featureKeyList` / `endAt` / `autoRenewStatus`), and **`appsubscription/expiration`** (plan expired). Guessed names like `activated`/`expired` do not exist and 422. Subscriptions are also version-scoped: the `api_version` used when creating webhook subscriptions must match the version configured in the Developer Center, otherwise delivery breaks or subscription fails silently.
- **Fix**: confirm the exact event id from the docs page table (Event Identification column) instead of guessing; keep `config.apiVersion` and the Portal version in sync.
- **Verified**: 2026-08-22.

### E2. X-Shopline-Shop-Id is a NUMERIC store id, not the handle

- **Symptom**: billing/webhook events are dropped (200 "no store") and the admin keeps showing the trial prompt after a successful subscription; no error anywhere.
- **Root cause (doc gap)**: the `X-Shopline-Shop-Id` header carries the numeric store id (e.g. `1726388605926`) while store records are keyed by handle (`ultimate`). Looking up by shop id misses; a receiver that answers 200 without a log line silently swallows every event.
- **Fix**: resolve in order — direct key → scan shopId/handle/`platformShopId` → derive the handle from `X-Shopline-Shop-Domain` (`ultimate.myshopline.com`). Persist the numeric id as `platformShopId` on first contact; all downstream writes use the real record key; never answer a miss without a log line.
- **Verified**: 2026-08-22.

### E3. featureKeyList is a snapshot taken at subscription time

- **Symptom**: you configure feature keys in the Developer Center but the next `appsubscription/create` event still carries `["default"]`; entitlements fall back to the default plan.
- **Root cause (doc gap)**: configuring feature keys does NOT retroactively update an existing subscription — the list is a snapshot taken when the subscription was created. Only a plan change / re-subscribe produces a new create event carrying the configured keys (`plan_pro`, `journeys_5`, ...). Unconfigured plans yield `["default"]` and `planKey` stays null.
- **Fix**: treat `featureKeyList` as entitlement data delivered per subscription event; force a plan change / re-subscribe (or new subscription) after changing feature-key config; never assume current Developer Center config reflects existing subscriptions.
- **Verified**: 2026-08-22.

## F. App-store listing & billing config (上架与付费套餐配置)

### F1. Paid plans need feature points AND a subscription group

- **Symptom / context**: when the app's paid plans are billed through SHOPLINE's official subscription, merchants cannot subscribe correctly and the plans do not surface properly in the marketplace listing.
- **Root cause (doc gap)**: after configuring multiple plan versions in the paid-mode config (付费模式), two extra steps are easy to miss: (1) each plan version must have its **feature points (功能点)** associated — otherwise entitlement data (`featureKeyList`) stays empty/`default`; (2) you must configure a **subscription group (订阅组)** — the subscription group is what gets displayed in the app marketplace (应用市场) listing.
- **Fix**: in the Partner Portal paid-mode configuration: configure all plan versions → associate the relevant feature points with each version → create/select the subscription group so the plans are listed in the marketplace. Verify with a test purchase that the create event carries the configured `featureKeyList` (see E3).
- **Verified**: 2026-08-22 (community/Portal config practice).

## References

- Official docs to re-check before trusting this skill: https://developer.shopline.com/ (App authorization, SHOPLINE CLI, App Bridge, Permission Point List)
- Source project: Orbit PWA (DTC PWA Enabler) — docs/LOCAL_DEBUG.md, verified 2026-08-20
- Feedback path: https://github.com/lunw/shopline-ai-toolkit-dsh/issues (report an entry as covered by official docs → it gets withdrawn here)
