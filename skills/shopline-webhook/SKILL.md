---
name: shopline-webhook
description: SHOPLINE webhooks. Use when building webhook subscriptions, webhook endpoints (ack, retry, idempotency), verifying webhook signatures (X-Shopline-Hmac-Sha256), or debugging missed/duplicated events.
whenToUse: Any webhook consumer or subscription work on SHOPLINE, signature verification, retry/ack handling.
---

# SHOPLINE Webhooks

Webhooks keep your app in sync with store events (product created/updated, order events, customer events, ...). Subscribe in the Developer Center (Partner Portal) — the subscription is tied to the API version, so the version in the Developer Center must match the event definition your app consumes.

## Delivery contract

- SHOPLINE POSTs the event to your HTTPS endpoint with `Content-Type: application/json`.
- Header `Shopline-Webhook-Id` carries the message ID.
- **Ack**: return HTTP 200 to acknowledge. Anything else (timeout, non-2xx, no response within 5 s) counts as failure.
- **Retry policy**: if no successful response within 5 s, SHOPLINE retries **19 times within 48 hours** on a schedule: 0 s, 5 s, 10 s, 30 s, 45 s, 1 min, 2 min, 5 min, 12 min, 38 min, 1 h, 2 h, then 4 h intervals. After 19 consecutive failures the platform deletes the subscription and emails you.
- **Duplicates are possible** — notifications are at-least-once. Your handler MUST be idempotent: dedupe by `Shopline-Webhook-Id` (or a business key), and simply ack already-processed messages.
- Don't rely on webhooks alone for correctness: proactively query the resource (e.g. order status) as a backup, especially for critical flows.

## Signature verification

- Header: `X-Shopline-Hmac-Sha256`
- Algorithm: lowercase-hex `HMAC-SHA256(rawRequestBody, appSecret)`
- Verify with constant-time comparison (`hmac.compare_digest` / `hmac.Equal`) BEFORE processing the payload.

Python example:

```python
import hmac, hashlib

def verify_webhook(app_secret: str, body: bytes, received: str) -> bool:
    expected = hmac.new(app_secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received)
```

## Handler skeleton

```text
POST /webhooks/{topic}            # or one endpoint + topic in payload
1. read raw body (do not re-encode JSON — sign covers raw bytes)
2. verify X-Shopline-Hmac-Sha256 against appSecret
3. dedupe by Shopline-Webhook-Id (idempotent store)
4. process event (async ok)
5. return 200 as fast as possible; ack BEFORE heavy work if needed
```

## Event payloads

Each event has a documented definition (e.g. product-created, order-updated) with a full example payload. Fetch the exact event definition for the version you subscribe to — fields change between versions. Use `mcp__shopline__read_full_docs` with the event URL if you need the complete definition.

## Cautions

- Subscriptions are version-scoped: a version mismatch silently breaks delivery semantics.
- Deleting a subscription stops notifications until you re-create it.
- Keep endpoints highly available; long processing delays trigger retries and duplicate processing.

## References

- Webhook overview: https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview
- Signature verification: https://developer.shopline.com/docs/apps/api-instructions-for-use/generate-and-verify-signatures
