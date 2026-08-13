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
