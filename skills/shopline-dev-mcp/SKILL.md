---
name: shopline-dev-mcp
description: Using the SHOPLINE Developer MCP tools exposed by this toolkit (mcp__shopline__* and optional mcp__sline__*). Use when searching SHOPLINE docs, looking up REST endpoint definitions, fetching GraphQL schema, validating GraphQL code, or validating Sline themes.
whenToUse: Any SHOPLINE API question where the MCP tools are available; prefer them over guessing endpoint/parameter details from memory.
---

# SHOPLINE Developer MCP Tools (via DSH)

The DSH plugin `shopline-ai-toolkit-dsh` bridges the **official SHOPLINE Developer MCP server** (`@shoplineos/shopline-developer-mcp`) through DSH's native MCP client. All its tools are available as native tools named `mcp__shopline__<tool>`. The server runs locally (stdio), requires **no authentication**, and needs Node.js >= 18.

## Tool map (official server)

| DSH tool name | What it does | Use when |
| --- | --- | --- |
| `mcp__shopline__shopline_readme` | README: dependencies & best practices of the MCP tools | Starting any SHOPLINE MCP session |
| `mcp__shopline__search_shopline_docs` | Search SHOPLINE developer docs | Broad questions ("how do webhooks work?", "product API") |
| `mcp__shopline__read_full_docs` | Full doc content by URL | You have a doc URL and need the complete text |
| `mcp__shopline__search_admin_rest_endpoints` | Search Admin REST endpoints | Finding the right REST path/resource |
| `mcp__shopline__get_rest_api_definition` | Full OpenAPI definition of a REST endpoint | Writing code against a REST endpoint |
| `mcp__shopline__get_admin_rest_endpoint_detail` | Detail: request params, response params, examples | Building a correct request/response contract |
| `mcp__shopline__get_graphql_schema` | Storefront GraphQL schema: Query/Mutation/Type | Schema lookups for Storefront GraphQL |
| `mcp__shopline__validate_graphql_codes` | Validate GraphQL code against the schema (syntax, deprecated, hallucinated fields) | Before shipping any generated GraphQL |
| `mcp__shopline__shopline_mcp_feedback` | Send feedback to SHOPLINE | Reporting doc/API issues |

## Optional community server (sline.dev)

If enabled in `cordis.patch.yml` (row `mcp-shopline-sline`), the sline.dev MCP server adds `mcp__sline__*` tools:

| DSH tool name | What it does |
| --- | --- |
| `mcp__sline__learn_shopline_api` | Up-to-date API guidance + conversation context |
| `mcp__sline__search_docs_chunks` | Search sline.dev docs (chunked, may lack context) |
| `mcp__sline__fetch_full_docs` | Complete doc for an exact sline.dev path |
| `mcp__sline__introspect_admin_schema` | Introspect the Admin GraphQL schema (types, fields, queries, mutations) |
| `mcp__sline__validate_theme` | Validate Sline templates/theme files |

## Workflow guidance

1. **Always start** with `mcp__shopline__shopline_readme` when a session touches SHOPLINE.
2. Search first (`search_shopline_docs`), then `read_full_docs` for the winning URL — search snippets alone are not enough for API details.
3. For REST: `search_admin_rest_endpoints` → `get_admin_rest_endpoint_detail` (params + examples) — never guess parameter names.
4. For GraphQL: fetch the schema (`get_graphql_schema` / `introspect_admin_schema`) and ALWAYS run `validate_graphql_codes` before presenting generated queries.
5. Combine with the skill guidance: `shopline-oauth` (signing), `shopline-admin-rest`, `shopline-graphql`, `shopline-webhook`.
6. Tool failures: the server runs locally via npx — first call may take a while to download the package; be patient and retry once. If a tool is missing, the server may be mid-reconnect — retry shortly after.

## References

- Official MCP docs: https://developer.shopline.com/docs/apps/development-tool/shopline-developer-mcp
- npm: https://www.npmjs.com/package/@shoplineos/shopline-developer-mcp
- sline.dev MCP: https://sline.dev/mcp
