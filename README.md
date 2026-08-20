# SHOPLINE AI Toolkit for DeepSeek Harness (DSH)

> 🛍️ SHOPLINE AI Toolkit — a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) plugin that brings
> **SHOPLINE 开发者 MCP** 官方工具与 **SHOPLINE 平台知识技能** 到你的 AI 编程助手。
> 架构参照 [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit)：`Skills + Dev MCP Server + Agent Plugin`。
>
> **dsh-plugin** · SHOPLINE · MCP · AI Toolkit · DeepSeek Harness

[English](#english) · [简体中文](#简体中文)

---

## English

### What is this?

The **Shopify AI Toolkit** gives AI coding agents Shopify-aware context through three layers:
agent **skills**, a **Dev MCP server**, and per-tool **plugins**. This project brings the same
architecture to SHOPLINE developers working inside **DeepSeek Harness (dsh)**:

| Layer | What you get |
| --- | --- |
| 🧠 **Agent skills** (`skills/`) | 8 SKILL.md bundles: `shopline-onboarding-dev`, `shopline-admin-rest`, `shopline-graphql`, `shopline-oauth`, `shopline-webhook`, `shopline-sline`, `shopline-dev-mcp` (documented behavior) + `shopline-app-dev-doc-gaps` (app-dev doc-gap supplement, withdrawable once official docs cover it) — endpoint URLs, signing rules, error codes, retry policies, all grounded in [developer.shopline.com](https://developer.shopline.com/) docs and [community experience](https://community.shoplineapp.cn/) |
| 🔌 **Dev MCP bridge** | The **official** [SHOPLINE Developer MCP](https://developer.shopline.com/docs/apps/development-tool/shopline-developer-mcp) (`@shoplineos/shopline-developer-mcp`, local stdio, no auth) is wired through dsh's native MCP client — tools appear as `mcp__shopline__search_shopline_docs`, `mcp__shopline__get_admin_rest_endpoint_detail`, `mcp__shopline__get_graphql_schema`, `mcp__shopline__validate_graphql_codes`, … |
| 🎛️ **Optional community MCP** | [sline.dev](https://sline.dev/mcp) server (`@shopline/dev-mcp`) adds `mcp__sline__introspect_admin_schema`, `mcp__sline__validate_theme`, … (commented out by default) |
| 📦 **dsh bundle** | `cordis.patch.yml` + `lib/index.js`, installable with `dsh plugin --profile <name> add shopline-ai-toolkit-dsh` |

### Install

See [docs/install.md](docs/install.md). Quick start (full bundle):

```bash
dsh plugin --profile web add shopline-ai-toolkit-dsh
# add "shopline-ai-toolkit-dsh" to dsh.profile.bundles in ~/.dsh/profiles/web/package.json
dsh web
```

Skills-only: `cp -R skills/* ~/.dsh/skills/`

### Example

> "Search the SHOPLINE Admin REST endpoints for products, then give me the full endpoint
> detail for updating a product variant, including request parameters and a curl example."

The agent loads `shopline-admin-rest` + `shopline-dev-mcp` skills and calls
`mcp__shopline__search_admin_rest_endpoints` → `mcp__shopline__get_admin_rest_endpoint_detail`.

More prompts: [examples/prompts.md](examples/prompts.md) · Design: [docs/architecture.md](docs/architecture.md)

### Repo layout

```
├── package.json          # dsh bundle manifest (dsh.bundle.patch)
├── cordis.patch.yml      # bundle patch: mcp-shopline bridge + shopline-toolkit plugin
├── lib/index.js          # Cordis plugin: registers skills/* on ctx.skills
├── skills/               # 8 SHOPLINE agent skills (SKILL.md bundles; app-dev-doc-gaps is withdrawable)
├── mcp/mcp.shopline.json # ready-to-use MCP client configs (Cursor/Claude/DSH)
├── docs/                 # architecture.md · install.md
└── examples/prompts.md   # copy-paste prompts (EN/中文)
```

### License

MIT. Not affiliated with SHOPLINE; official docs and npm packages remain the source of truth.

---

## 简体中文

### 这是什么？

**Shopify AI Toolkit** 通过三层结构让 AI 编程助手获得 Shopify 平台上下文：agent **技能 (skills)**、
**Dev MCP 服务器**、以及各 AI 工具的**插件**。本项目把同样的架构带给在 **DeepSeek Harness (dsh)**
中开发的 SHOPLINE 开发者：

| 层 | 内容 |
| --- | --- |
| 🧠 **Agent 技能**（`skills/`） | 8 个 SKILL.md 技能：`shopline-onboarding-dev`（入门）、`shopline-admin-rest`（REST API）、`shopline-graphql`（GraphQL）、`shopline-oauth`（授权与签名）、`shopline-webhook`、`shopline-sline`（模板引擎）、`shopline-dev-mcp`（MCP 工具用法，均为官方已文档化行为）+ `shopline-app-dev-doc-gaps`（应用开发文档盲区补充，官方文档补齐后逐条撤回）。端点、签名规则、错误码、重试策略均来自 [developer.shopline.com](https://developer.shopline.com/) 官方文档与 [community.shoplineapp.cn](https://community.shoplineapp.cn/) 社区实践 |
| 🔌 **Dev MCP 桥接** | 通过 dsh 原生 MCP 客户端接入**官方** [SHOPLINE 开发者 MCP](https://developer.shopline.com/docs/apps/development-tool/shopline-developer-mcp)（`@shoplineos/shopline-developer-mcp`，本地 stdio、免鉴权）。工具以 `mcp__shopline__search_shopline_docs`、`mcp__shopline__get_admin_rest_endpoint_detail`、`mcp__shopline__get_graphql_schema`、`mcp__shopline__validate_graphql_codes` 等形式直接可用 |
| 🎛️ **可选社区 MCP** | [sline.dev](https://sline.dev/mcp) 服务器（`@shopline/dev-mcp`）提供 `mcp__sline__introspect_admin_schema`（Admin GraphQL Schema 内省）、`mcp__sline__validate_theme`（Sline 模板校验）等，默认注释、按需开启 |
| 📦 **dsh 插件包** | `cordis.patch.yml` + `lib/index.js`，一条命令安装：`dsh plugin --profile <name> add shopline-ai-toolkit-dsh` |

### 安装

详见 [docs/install.md](docs/install.md)。快速开始（完整插件）：

```bash
dsh plugin --profile web add shopline-ai-toolkit-dsh
# 在 ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles 中加入 "shopline-ai-toolkit-dsh"
dsh web
```

只想用技能：`cp -R skills/* ~/.dsh/skills/`

### 示例

> 「搜索 SHOPLINE Admin REST 端点中商品相关接口，然后给出更新商品变体的完整端点详情，
> 包括请求参数和 curl 示例。」

助手会加载 `shopline-admin-rest` 与 `shopline-dev-mcp` 技能，并依次调用
`mcp__shopline__search_admin_rest_endpoints` → `mcp__shopline__get_admin_rest_endpoint_detail`。

更多示例： [examples/prompts.md](examples/prompts.md) · 设计文档：[docs/architecture.md](docs/architecture.md)

### 仓库结构

```
├── package.json          # dsh bundle 清单（dsh.bundle.patch）
├── cordis.patch.yml      # bundle patch：mcp-shopline 桥接 + shopline-toolkit 插件
├── lib/index.js          # Cordis 插件：把 skills/* 注册到 ctx.skills
├── skills/               # 8 个 SHOPLINE 技能（SKILL.md 包；app-dev-doc-gaps 可撤回）
├── mcp/mcp.shopline.json # 开箱即用的 MCP 客户端配置（Cursor/Claude/DSH）
├── docs/                 # architecture.md · install.md
└── examples/prompts.md   # 可直接复制的提示词（中/英）
```

### 许可证

MIT。本项目与 SHOPLINE 无隶属关系；官方文档与 npm 包始终是权威依据。
