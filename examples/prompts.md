# Example prompts

Once the plugin is installed, try these (中英文均可):

## Explore the platform

- "List the SHOPLINE developer MCP tools and what each one does."
- "What's the difference between the Admin REST API, Admin GraphQL and Storefront API? When should I use each?" — the agent should load `shopline-onboarding-dev` / `shopline-dev-mcp` and search the docs.
- "搜索 SHOPLINE 文档，帮我了解商品 API 有哪些版本和限流规则。"

## REST development

- "Search the SHOPLINE Admin REST endpoints for products, then give me the full endpoint detail for updating a product variant, including request parameters and a curl example."
- "帮我查一下 SHOPLINE 订单 API 的分页参数，写一个 Python 脚本拉取最近 30 天的订单（分页处理）。"

## GraphQL development

- "Get the Storefront GraphQL schema for the Product type, then write a query that fetches product title, price and images. Validate the query with validate_graphql_codes before showing it."
- "用 Admin GraphQL 查询 gid://shopline/Product/{id} 的库存信息，注意 13 层嵌套限制和成本点限流。"

## OAuth & signing

- "Write the OAuth 2.0 authorization flow for a SHOPLINE custom app (Node.js): authorize URL, code exchange, token refresh, and HMAC-SHA256 request signing."
- "帮我写 webhook 签名校验代码（X-Shopline-Hmac-Sha256），并给出幂等处理的建议。"

## Webhooks

- "Design a webhook subscription for product-created events: endpoint skeleton, ack behavior, retry policy handling, and idempotency by Shopline-Webhook-Id."
- "Webhook 一直收不到事件怎么办？列出常见原因和排查步骤。"

## Sline / themes

- "Validate this Sline template and fix the errors: <paste template>"
- "Explain how Sline templates differ from Liquid and give me the folder structure of an Online Store 3.0 theme."

## Migration

- "I'm migrating a Shopify app to SHOPLINE. Map my Shopify REST endpoints to SHOPLINE Admin REST equivalents and highlight the auth differences."
- "从 Shopify 迁移到 SHOPLINE：对比两边的 Webhook 与 GraphQL 全局 ID 机制。"

## 文档盲区排错（shopline-app-dev-doc-gaps 技能场景）

- 「我跑 `shopline app dev` 崩了，报 `Cannot read properties of undefined (reading 'dev')`，怎么排查？」——检查双进程配置（backend + frontend 反向代理）
- 「CLI 每次重启后，店铺前台加载 /sdk/orbit.js 报 ERR_NAME_NOT_RESOLVED，SDK 不生效。」——script tag 仍指向死隧道，需要重新授权或 Enable / re-inject
- 「我申请了 read_themes 权限，但 GET /themes.json 还是报权限错误，为什么？」——该端点需要 read_content 权限点
- 「OAuth 授权完成后页面空白，回调没生效。」——回调可能经 Admin 代理进入（proxyDomain），嵌入上下文必须回 JSON 而不是 302
- 「App Bridge 集成后 window.shopline 是 undefined，怎么接线？」——UMD 构建 dist/next.umd.js + init(appKey) 后才有全局对象
- 「本地 CLI 开发时后端应该监听哪个端口？」——读 BACKEND_PORT（隧道目标），PORT 是前端端口
