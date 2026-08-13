---
name: shopline-oauth
description: SHOPLINE app authorization and request signing. Use when implementing OAuth 2.0 authorization (public/custom apps), exchanging codes for access tokens, refreshing tokens, signing GET/POST requests with HMAC-SHA256, or verifying SHOPLINE webhook/callback signatures.
whenToUse: Writing auth code for a SHOPLINE app, debugging 401/403 or signature failures, implementing token refresh, verifying install/callback requests.
---

# SHOPLINE App Authorization & Request Signing

Two separate things are often confused: (1) OAuth for obtaining store access tokens (public/custom apps), and (2) HMAC-SHA256 request signing required on OAuth HTTP calls and webhook callbacks. Private apps skip OAuth entirely — the token is copied from the SHOPLINE Admin.

## OAuth 2.0 authorization code flow (public & custom apps)

**Step 1 — install request.** When a merchant installs the app, SHOPLINE GETs your `App URL` with query params `handle` (store handle), `timestamp` (ms), `sign` (signature), plus `lang` if embedded. Verify the signature first (see below).

**Step 2 — authorize.** Redirect the merchant (or give them the URL):

```text
GET https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey={appKey}&responseType=code&scope={scope}&redirectUri={redirectUri}
```

- `scope`: comma-separated permission points, e.g. `read_products,read_orders`
- `redirectUri`: must exactly match a callback URL configured in the Partner Portal (URL-encoded)

**Step 3 — callback.** SHOPLINE redirects to your redirect URI:

```text
GET https://{redirectUri}?appkey={appkey}&code={code}&customField={customField}&handle={handle}&timestamp={timestamp}&sign={sign}
```

The `code` is an OAuth authorization code, **valid 10 minutes**. Verify `sign` before using it.

**Step 4 — exchange code for token:**

```http
POST https://{handle}.myshopline.com/admin/oauth/token/create
Content-type: application/json
appkey: {appkey}
timestamp: {timestamp}
sign: {sign}

{"code":{code}}
```

Response: `{"code":200,"i18nCode":"SUCCESS","data":{"accessToken":"...","expireTime":"...","scope":"..."}}`. The access token is valid **10 hours**.

**Step 5 — refresh before expiry:**

```http
POST https://{handle}.myshopline.com/admin/oauth/token/refresh
Content-type: application/json
appkey: {appkey}
timestamp: {timestamp}
sign: {sign}
```

(no body). After refresh, the old token stays valid for 5 minutes, then dies.

## Request signing (HMAC-SHA256)

Key = your **App Secret**. Output = lowercase hex.

**POST requests** (OAuth token calls, etc.):
`source = requestBody + timestamp` (string concat, timestamp in milliseconds) → `sign = hmacSha256(source, appSecret)`. Send `sign` and `timestamp` in headers (plus `appkey`).

**GET requests** (install/callback verification):
1. Take all query params except `sign`.
2. URL-encode keys and values; sort params alphabetically by key.
3. Build `k1=v1&k2=v2` (no leading `?`, no trailing `&`).
4. `sign = hmacSha256(source, appSecret)`; compare with the received `sign`.
5. Also sanity-check `timestamp` freshness (e.g. within 10 minutes) to prevent replay.

**Webhook callbacks**: header `X-Shopline-Hmac-Sha256` = lowercase hex `hmacSha256(rawRequestBody, appSecret)`. Compare with constant-time equality. See `shopline-webhook`.

Python:

```python
import hmac, hashlib, time, json

def sign_post(app_secret: str, body: bytes, ts: int) -> str:
    return hmac.new(app_secret.encode(), body + str(ts).encode(), hashlib.sha256).hexdigest()

def sign_get(app_secret: str, params: dict) -> str:
    source = "&".join(f"{k}={params[k]}" for k in sorted(params) if k != "sign")
    return hmac.new(app_secret.encode(), source.encode(), hashlib.sha256).hexdigest()

ts = int(time.time() * 1000)
body = json.dumps({"code": code}).encode()
sign = sign_post(APP_SECRET, body, ts)  # headers: appkey, timestamp=ts, sign
```

## Token usage

- Admin REST: `Authorization: Bearer {accessToken}`
- Admin GraphQL: `Authorization: Bearer {accessToken}`
- Storefront API: storefront customer tokens — see the Storefront API docs (different flow, `shopline-graphql` skill notes the endpoint).

## Error codes to know

`OAUTH_CODE_INVALID` (code expired/reused), `REQUEST_FREQUENTLY` (rate-limited — back off, do NOT retry in a loop), `STORE_INFORMATION_ERROR`, `REQUEST_NOT_IN_APP_IP_WHITELIST` (check Partner Portal IP whitelist), `TOKEN_CREATE_EXCEPTION`, `APP_AUDIT_NOT_PASS` (refresh fails when app not approved).

## References

- App authorization: https://developer.shopline.com/docs/apps/api-instructions-for-use/app-authorization
- Signatures: https://developer.shopline.com/docs/apps/api-instructions-for-use/generate-and-verify-signatures
