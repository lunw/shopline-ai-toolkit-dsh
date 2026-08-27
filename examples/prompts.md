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

## 计费订阅与上架配置（E/F 组场景）

- 「订阅支付成功，但商家后台一直提示试用/未激活，怎么排查？」——检查 appsubscription 事件名（paid / create / expiration，不是 activated/expired）、订阅版本对齐、X-Shopline-Shop-Id 数字 ID 的解析链
- 「其他 webhook 正常，但计费事件收不到？」——X-Shopline-Shop-Id 是数字店铺 ID 不是 handle，检查 platformShopId/domain 反推与「静默 200 无日志」的吞事件问题；再核对 POST /webhooks.json 的 api_version 与开发者中心一致
- 「我在开发者中心配了功能点，但新的订阅事件 featureKeyList 还是 ['default']？」——featureKeyList 是订阅时的快照，需改套餐/重新订阅才会带新配置
- 「应用要上架并走 SHOPLINE 官方订阅，套餐应该怎么配？」——付费模式配置多个版本套餐后：每个套餐版本要关联功能点；还要配置订阅组（订阅组会展示在应用市场的 listing 中）
