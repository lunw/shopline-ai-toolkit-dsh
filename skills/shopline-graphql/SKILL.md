---
name: shopline-graphql
description: SHOPLINE Admin GraphQL and Storefront GraphQL APIs. Use when designing or generating GraphQL queries/mutations for SHOPLINE (Admin or Storefront), working with global IDs (gid://shopline/...), or validating GraphQL code against the SHOPLINE schema.
whenToUse: Writing SHOPLINE GraphQL operations, schema lookups, fixing "maximum query depth" or hallucinated-field errors, Storefront customer queries.
---

# SHOPLINE GraphQL APIs (Admin + Storefront)

SHOPLINE exposes two GraphQL surfaces. Both use quarterly versions (`vYYYYMMDD`) and return HTTP 200 with `errors` embedded for most business failures.

## Endpoints

| Surface | Endpoint |
| --- | --- |
| Admin GraphQL | `POST https://{handle}.myshopline.com/admin/graph/{version}/graphql.json` |
| Storefront GraphQL | `POST https://{handle}.myshopline.com/storefront/graph/{version}/graphql.json` |

Headers: `Content-Type: application/json`, `Authorization: Bearer {accessToken}` (Admin). Storefront calls use storefront customer access tokens — see the Storefront API docs; the schema is browsable in the docs Explorer (`/graphql/storefront`).

## Global IDs

GraphQL objects are addressed by global IDs:

```text
gid://shopline/{object_name}/{id}
```

e.g. `gid://shopline/Customer/1`. Query an object's global ID first, then reuse it in mutations and follow-up queries. Never fabricate IDs — always fetch them.

## Query limits (Admin)

- **Cost-point rate limiting**: every request costs points; complex queries cost more. HTTP 429 `Too many request` means you exceeded the budget — simplify the query or wait.
- **Max field nesting: 13 levels**. A deeper query returns HTTP 200 with `"message": "maximum query depth exceeded 14 > 13"` (`extensions.classification: ExecutionAborted`).
- Keep selections minimal: only the fields you actually need (also cheaper).

## Errors

Common business codes inside `errors[].extensions.code` (HTTP still 200):

| Code | Meaning |
| --- | --- |
| `REQUEST_LIMIT_EXCEEDED` | rate limited — retry later |
| `PARAM_ILLEGAL` | wrong parameter type/format |
| `DATA_NOT_EXIST` | the object does not exist |
| `REMOTE_ERROR` / `SYSTEM_ERROR` / `INNER_FAIL` | platform-side failures — retry |
| `TOO_MANY_REQUESTS` | wait minutes |
| `ACCESS_TOKEN_INVALID` / `ACCESS_TOKEN_IS_EXPIRED` | token problems — refresh (see `shopline-oauth`) |
| HTTP 402 | `Store has been frozen or closed` |

## Generating & validating operations

1. **Introspect first**: use `mcp__shopline__get_graphql_schema` (official Dev MCP) to fetch the exact Query/Mutation/Type definitions instead of guessing fields. For Admin schema, `mcp__sline__introspect_admin_schema` (community server, if enabled) also works.
2. **Validate before shipping**: run `mcp__shopline__validate_graphql_codes` on the generated query — it detects syntax errors, deprecated fields and hallucinated fields against the schema.
3. Naming convention: queries by resource, e.g. `query Product($id: ID!) { product(id: $id) { id title } }` — follow the exact camelCase field names from the schema; SHOPLINE schemas use camelCase like Shopify.

## Pagination & bulk

- GraphQL list fields paginate via connection-style arguments (check the schema — typically `first`/`after` or `page`/`pageSize`).
- For heavy data jobs prefer the documented bulk query/mutation task APIs instead of paging in a loop.

## References

- Admin GraphQL schema docs: https://developer.shopline.com/docs/admin-graph-ql-api/schema-documentation
- Storefront API schema docs: https://developer.shopline.com/docs/storefront-api/schema-documentation
- Admin GraphQL overview (limits/errors): https://developer.shopline.com/docs/apps/api-instructions-for-use/graph-ql-admin-api/overview
