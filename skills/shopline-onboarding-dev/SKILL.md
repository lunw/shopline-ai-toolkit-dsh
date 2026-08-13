---
name: shopline-onboarding-dev
description: Get started building on SHOPLINE. Use when a developer asks to build a SHOPLINE app, choose an app type, set up a developer account, scaffold a project, or get started developing for the SHOPLINE platform. NOT for merchants managing stores.
whenToUse: Choosing an app type, understanding developer account setup, deciding which API surface fits a task, or first-time SHOPLINE development.
---

# SHOPLINE Developer Onboarding

SHOPLINE (商线科技) is an e-commerce SaaS platform popular in Southeast Asia, Taiwan, Hong Kong and Greater China. Apps are built against the OpenAPI and distributed through the Partner Portal (https://developer.myshopline.com/).

## When you need store data, pick the API surface first

| Need | Surface | Endpoint shape (store domain: `https://{handle}.myshopline.com`) |
| --- | --- | --- |
| Store management CRUD (products, orders, customers, inventory) | Admin REST API | `POST/GET/DELETE /admin/openapi/{version}/{endpoint}.json` |
| Complex store queries, batched writes | Admin GraphQL API | `POST /admin/graph/{version}/graphql.json` |
| Storefront data (customer-facing catalog, cart) | Storefront API | `POST /storefront/graph/{version}/graphql.json` |
| Real-time store events | Webhooks | HTTPS callback POSTs (see `shopline-webhook`) |
| Browser-only / in-theme data | Ajax API | unversioned |
| App/theme UI scripting | Handlebars / Sline | theme templates |

All versioned APIs use quarterly versions `vYYYYMMDD` (e.g. `v20260601`). SHOPLINE maintains 8 concurrent versions in a rolling window; stable versions are supported for ~12 months. Always pin the version you develop against and migrate before deprecation.

## App types (choose before anything else)

1. **Public app** — sold via the SHOPLINE App Store; must pass app review. OAuth 2.0 authorization.
2. **Custom app** — built in the Developer Center (Partner Portal) for one merchant's stores; no review needed. OAuth 2.0 authorization.
3. **Private app** — created by the merchant in the SHOPLINE Admin (`Apps > Develop Apps > API certificate`); no OAuth, long-lived token (3 years), token pasted straight from the Admin.

For OAuth details and request signing see the `shopline-oauth` skill.

## Developer workflow

1. Register on the Partner Portal (https://developer.myshopline.com/), create a developer store for testing.
2. Create the app (public/custom) in the Developer Center to obtain **APP Key** and **APP Secret** (a.k.a. App Key / App Secret / appKey / appSecret).
3. Implement OAuth (see `shopline-oauth`), request the permission points (scopes) your app needs, e.g. `read_products,write_products,read_orders`. Keep the scope list minimal — broad scopes hurt App Store review.
4. Develop against a pinned API version; use the official SHOPLINE Developer MCP tools (`shopline-dev-mcp` skill) to look up endpoints, parameter definitions and GraphQL schema instead of guessing.
5. Test with the developer store, then submit for review (public apps only; 1–2 business days, payments apps 3–5).

## Key reference links

- Overview: https://developer.shopline.com/docs/apps/overview
- Creating an app: https://developer.shopline.com/docs/apps/application-management/creating-an-app
- API versioning guide: https://developer.shopline.com/docs/apps/api-instructions-for-use/api-versioning-guide
- SHOPLINE Developer MCP: https://developer.shopline.com/docs/apps/development-tool/shopline-developer-mcp
- Community (Chinese): https://community.shoplineapp.cn/

## Common gotchas

- Do not hardcode the store domain — it is `{handle}.myshopline.com` and the handle comes from the OAuth install/callback request.
- Access tokens from OAuth expire in **10 hours**; refresh before expiry (see `shopline-oauth`). Private-app tokens last 3 years but still expire.
- The platform rate-limits token creation/refresh endpoints — never hammer them.
- Requests must be signed with HMAC-SHA256 (see `shopline-oauth`); unsigned requests fail.
- App review requires a working install flow, minimal scope, and correct webhook ack handling.
