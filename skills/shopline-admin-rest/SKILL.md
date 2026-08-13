---
name: shopline-admin-rest
description: SHOPLINE Admin REST API. Use when writing or explaining REST queries/mutations against SHOPLINE store data (products, orders, customers, inventory, prices, bundles, articles...), building endpoint URLs, paginating, handling errors or rate limits.
whenToUse: Any store-data REST call on myshopline.com domains, or helping a developer pick/format a REST endpoint.
---

# SHOPLINE Admin REST API

The Admin REST API is the standard data interface for apps to read and manage store data. Always check the current endpoint definition with the official MCP tool `mcp__shopline__search_admin_rest_endpoints` / `mcp__shopline__get_admin_rest_endpoint_detail` (see `shopline-dev-mcp`) — the docs are the source of truth for parameters and examples.

## URL format

```text
https://{handle}.myshopline.com/admin/openapi/{version}/{endpoint}.json
```

- `handle`: store handle, e.g. `open001` from `open001.myshopline.com` — never hardcode a full domain in reusable code.
- `version`: `vYYYYMMDD` (e.g. `v20260601`). 8 versions live concurrently; stable versions last ~12 months.
- `endpoint`: resource path, e.g. `products/products.json`, `orders/orders.json`.

Example — list products:

```bash
curl --location 'https://open001.myshopline.com/admin/openapi/v20260601/products/products.json' \
  --header 'Authorization: Bearer {accessToken}'
```

## Auth

`Authorization: Bearer {accessToken}` — token from OAuth (10 h validity, see `shopline-oauth`) or a private-app token from the Admin (3 years).

## Common endpoint patterns

| Resource | Examples |
| --- | --- |
| Products | `products/products.json` (list/get/update/delete), variants under `products/{product_id}/variants.json` |
| Orders | `orders/orders.json`, `orders/{order_id}.json` |
| Customers | `customers/customers.json` |
| Inventory | `inventory/...json` (inventory items, levels) |
| Bundles/combos, articles, collections, prices, gift cards | resource-specific paths under `/admin/openapi/{version}/` |

Use `mcp__shopline__search_admin_rest_endpoints` to find the exact path and `mcp__shopline__get_admin_rest_endpoint_detail` for full parameter/response definitions and examples.

## Pagination

SHOPLINE REST list endpoints paginate with page-based params (`page`, `page_size` or `limit` — check the endpoint detail) or cursor-based ones, depending on the resource. Always read the endpoint definition; responses include the requested window plus often `total`/`page_count` metadata. Do not assume infinite scrolling works — some endpoints cap results per page.

## Errors & rate limits

- HTTP 401: token invalid/expired → refresh token (OAuth) or reissue (private app).
- HTTP 429: too many requests → back off and retry with exponential delay; respect the cost-point budget for GraphQL (see `shopline-graphql`).
- HTTP 402: `Store has been frozen or closed` — store-level issue, not your request.
- Business errors usually return HTTP 200 with an error payload — always parse the body, not just the status code.
- Bulk operations exist for heavy jobs (bulk query tasks) — check the docs before writing chatty loops.

## Best practices

1. Prefer the MCP endpoint search/lookup tools over memory when unsure of parameters.
2. Pin the API version; test upgrades in a developer store.
3. Read the response envelope (`{ "code": ..., "data": ..., "message": ... }`) — SHOPLINE wraps many responses.
4. Handle idempotency: destructive updates should be retried safely (idempotency keys are not universal — check the endpoint).
5. Never log or store access tokens in plain text; keep them in environment variables/secrets.

## References

- REST Admin API overview: https://developer.shopline.com/docs/apps/api-instructions-for-use/rest-admin-api/overview
- API versioning: https://developer.shopline.com/docs/apps/api-instructions-for-use/api-versioning-guide
