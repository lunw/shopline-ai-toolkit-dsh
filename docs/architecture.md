# Architecture

This document explains how `shopline-ai-toolkit-dsh` is designed, and how it mirrors the
[Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) architecture.

## The reference: Shopify AI Toolkit

Shopify's AI Toolkit (GitHub: [Shopify/shopify-ai-toolkit](https://github.com/Shopify/shopify-ai-toolkit)) has three layers:

| Layer | What it is | How it helps AI agents |
| --- | --- | --- |
| **Agent skills** | Markdown skill bundles (`<name>/SKILL.md`) installed into the agent's skill roots | Teach the agent platform-specific API knowledge (Admin GraphQL, Liquid, CLI workflows...) |
| **Dev MCP server** | A local stdio MCP server (`@shopify/dev-mcp`) | Gives the agent live docs search, schema access and GraphQL/Liquid validation |
| **Plugins** | Per-tool installers (Claude Code, Codex, Cursor, VS Code...) | Bundle the above into a one-command install that auto-updates |

## This plugin: SHOPLINE AI Toolkit for DSH

SHOPLINE's platform equivalent exists already: the official
[SHOPLINE Developer MCP](https://developer.shopline.com/docs/apps/development-tool/shopline-developer-mcp)
(`@shoplineos/shopline-developer-mcp`) is a local stdio MCP server with 9 tools
(docs search, REST endpoint search/detail, GraphQL schema, GraphQL validation...), plus a
community server from [sline.dev](https://sline.dev/mcp) (`@shopline/dev-mcp`) with schema
introspection and Sline theme validation.

What was missing is the **DSH integration layer** — a dsh plugin that mirrors the Shopify
toolkit's shape:

| Shopify AI Toolkit | SHOPLINE AI Toolkit DSH | DSH mechanism |
| --- | --- | --- |
| Agent skills (`shopify-admin`, `shopify-use-shopify-cli`, ...) | `skills/` bundles (`shopline-admin-rest`, `shopline-graphql`, `shopline-oauth`, `shopline-webhook`, `shopline-sline`, `shopline-onboarding-dev`, `shopline-dev-mcp`) | `ctx.skills` registry — registered at runtime by `lib/index.js` as a bundled provider (rank 600); also installable to `~/.dsh/skills` |
| Dev MCP server (`@shopify/dev-mcp`) | Official `@shoplineos/shopline-developer-mcp` (+ optional `@shopline/dev-mcp`) | DSH's native MCP client `@deepseek-ai/dsh-mcp-client` — patch row `mcp-shopline`; tools become `mcp__shopline__*` |
| Plugins (Claude Code/Cursor/...) | A dsh bundle: `cordis.patch.yml` + `lib/index.js` + `package.json` (`dsh.bundle.patch`) | `dsh plugin --profile <name> add shopline-ai-toolkit-dsh` |

## Component diagram

```text
+---------------------------- dsh profile (Cordis tree) ----------------------------+
|                                                                                    |
|  cordis.patch.yml (bundle layer: shopline-ai-toolkit-dsh)                          |
|   ├─ [mcp-shopline]  @deepseek-ai/dsh-mcp-client ──stdio──► npx @shoplineos/       |
|   │                                                          shopline-developer-mcp|
|   │        ▲ tools registered as mcp__shopline__* (search_shopline_docs,          |
|   │        │ get_admin_rest_endpoint_detail, get_graphql_schema,                  |
|   │        │ validate_graphql_codes, ...)                                          |
|   ├─ [mcp-shopline-sline] (optional) ──stdio──► npx @shopline/dev-mcp             |
|   │        ▲ mcp__sline__* (introspect_admin_schema, validate_theme, ...)         |
|   └─ [shopline-toolkit]  lib/index.js                                              |
|            └─ ctx.skills.registerProvider('shopline-ai-toolkit')                  |
|                 └─ reads skills/*.md (SKILL.md bundles) → agent skill catalog     |
|                                                                                    |
|  Agent model sees: skill catalog entries + mcp__shopline__* / mcp__sline__* tools  |
+------------------------------------------------------------------------------------+
```

## Design decisions

1. **No credentials in the plugin.** The official SHOPLINE Dev MCP is unauthenticated and
   local (stdlib); store access tokens live in the user's environment/secret store and are
   only used when the agent calls real store APIs (via user-provided tokens in prompts or
   a store-side script). The plugin never asks for APP Key/Secret.
2. **Official server first, community second.** `@shoplineos/shopline-developer-mcp` is the
   SHOPLINE-supported server and ships enabled; the sline.dev server ships commented-out
   because it is community-maintained and adds optional Sline/Admin-schema capabilities.
3. **Skills are grounded in the official docs.** Every skill's endpoint URLs, signing rules,
   error codes, retry policies and versioning facts were written from
   developer.shopline.com documentation (see each SKILL.md's References section) and
   community experience (community.shoplineapp.cn, sline.dev).
4. **Runtime skill registration + static install both work.** The bundle registers skills
   via `ctx.skills` at runtime (zero-config when the bundle is installed); the same
   `skills/` folder can be copied to `~/.dsh/skills` or `<project>/.dsh/skills` for
   skills-only setups — the same pattern as Shopify's `npx skills add`.
5. **No new MCP protocol code.** DSH already ships `@deepseek-ai/dsh-mcp-client`; the
   toolkit only wires configuration, which keeps the plugin small, reviewable and aligned
   with the harness's own semantics (server-qualified tool names, reconnect, timeouts).

## Security notes

- The MCP servers run locally via `npx`; first invocation downloads the package from npm.
- Webhook/API secrets must never enter prompts or plugin config — see `shopline-oauth`
  for signature-based verification patterns.
- Store-scoped data access always goes through merchant-authorized tokens (OAuth scopes
  `read_*` / `write_*`); the agent should confirm scope before destructive calls.

## 实战沉淀：应用开发文档盲区补充技能（shopline-app-dev-doc-gaps）

v0.2.0 adds one deliberately different skill: **`shopline-app-dev-doc-gaps`** — a *supplement
to the official SHOPLINE documentation for APP DEVELOPMENT*, distilled from real project
debugging (Orbit PWA, a DTC PWA Enabler SHOPLINE app, verified 2026-08-20).

**Why one skill instead of many**: these entries are a *delta over the official docs* that
SHOPLINE may fix at any time. Keeping them in a single, clearly-labeled skill with a coverage
table makes withdrawal mechanical: when official docs cover an entry, delete the entry, flip
its table row to `fixed → withdrawn`, and update the README "Doc gap status" — the rest of
the toolkit (the 7 documented-behavior skills) stays untouched. This mirrors a patch layer
that can be dropped once upstream merges the fix.

**Scope — app development only (in/out boundary, mirrored in the SKILL.md itself):**

| ✅ In scope (app development) | ❌ Out of scope |
| --- | --- |
| SHOPLINE CLI local development contract (process configs, env semantics, install probe, injected assets) | Theme development (Sline/Liquid templates, theme structure) |
| OAuth callback & install contract (callback path, admin-proxy callback, per-visit install params, handle resolution) | Storefront pure-frontend issues (SDK internals, cache strategies) |
| Embedded admin integration (context routing, session handle, App Bridge wiring & auth protocol) | The SHOPLINE Developer MCP tools themselves |
| App permission point mapping (OpenAPI scope → endpoint requirements) | Generic web knowledge (cookies, CORS, HTTPS, layout) |

**Selection criteria** — an entry qualifies only if: (1) the behavior is **not documented (or
documented incorrectly)** on developer.shopline.com; (2) it was **verified in a real project**
and cost measurable debugging time; (3) it is **platform-level and app-dev-related** — never
project-internal conventions or generic web knowledge. When in doubt, exclude.

Coverage today (11 entries, all app-dev): CLI local development contract (A1–A4), OAuth
callback & install contract (B1–B4), permission point mapping (C1), App Bridge knowledge
gaps (D1–D2). Tracked in the skill's own coverage table with verification dates.
