# IHLink DataSub API integration guide

## Activate integration access

Request the API package from your DataSub account and provide your business and website details. IHLink must approve the request. An ordinary customer or reseller account does not automatically receive API access. After approval, open Developer API, generate a Sandbox key, and copy its secret immediately. Keys are shown once. Create a separate Live key only when your server integration is ready. You can revoke either key from the dashboard. At most five active keys are permitted.

Keep keys and callback signing secrets on your server. Never embed them in website JavaScript, an APK, a public repository, screenshots or customer messages. Rotate credentials by generating a replacement, updating your server and then revoking the old key.

Base URL: `https://lnqsroyiybutkfngbyge.supabase.co/functions/v1/datasub-api`

Every request requires `x-ihlink-api-key: YOUR_SECRET`. POST requests use `Content-Type: application/json`. Amounts are Nigerian naira, not kobo. API prices may differ from ordinary customer prices.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Verify your key and its sandbox or live mode |
| GET | `/products` | List currently available services and stable IHLink plan IDs |
| GET | `/quote?product_code=PLAN_ID&amount=1000` | Confirm the total charge before an amount-based purchase |
| GET | `/wallet` | Read your DataSub wallet balance |
| POST | `/purchase` | Submit one purchase with a unique merchant reference |
| GET | `/transactions?reference=ORDER-1001` | Retrieve your own transaction and wallet refund status |

`GET /products?service=DATA` filters the catalogue. Supported catalogue service codes are `DATA`, `AIRTIME`, `CABLE`, `ELECTRICITY` and `EXAM`; a service is available only when returned by the live catalogue. Network names and plan IDs must come from that response. Do not use an upstream provider's plan ID. Product names and prices may change; retrieve the latest quote and catalogue rather than hard-coding them.

Product fields: `plan_id`, `service`, `network`, `type`, `name`, `validity`, `price`. `GET /quote` returns `product_code`, `service_amount`, `fee`, total `amount` and `currency`. Airtime and electricity require a valid positive face-value `amount`; pass the quote's total as `expected_charge`. Other services use their configured plan price.

## Submit a purchase

```bash
curl 'https://lnqsroyiybutkfngbyge.supabase.co/functions/v1/datasub-api/purchase' \
  -H 'x-ihlink-api-key: YOUR_SERVER_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"product_code":"PLAN_FROM_PRODUCTS","recipient":"08031234567","reference":"ORDER-1001"}'
```

| Field | Requirement |
|---|---|
| `product_code` | Required stable IHLink plan ID from `/products` |
| `recipient` | Required phone number, smart-card number, meter number or delivery identifier for that service |
| `reference` | Required unique reference containing 8–100 letters, digits, hyphens, underscores or colons |
| `amount` | Required for airtime/electricity amount-based services; face value in NGN |
| `expected_charge` | Required for amount-based services; quote's total amount including any fee |
| `meter_type` | Required for electricity: `PREPAID` or `POSTPAID` |
| `quantity` | Exam services accept one PIN per transaction |
| `ported` | Optional boolean for a ported phone number |

Use an 11-digit Nigerian phone number beginning `07`, `08` or `09` for data and airtime. Electricity and cable account verification must be completed before taking the customer's money. This API currently has no customer-name verification endpoint; use the product account verification flow in DataSub or arrange that verification with IHLink before offering those services in your integration. Exam PIN and electricity-token delivery require confirmation of the returned service details; do not treat the catalogue alone as proof of a delivery-token interface.

The live API reserves money from your DataSub wallet. It does not collect money from your website customer. You manage that customer's payment separately. Your wallet needs enough funds for the total charge. Failed fulfilment returns the reserved wallet amount through the guarded refund process. BillStack merchant bank settlement is separate from an API purchase or wallet refund.

## Interpret outcomes and avoid duplicates

`201` means fulfilment returned successful. `202` means pending; retain the reference and query `/transactions`, or await a signed callback. Never submit a second reference just because an HTTP request timed out. Repeat the same reference and same order to retrieve its existing outcome. A different order using that reference returns `409`. An immediate failed purchase may return `502` with `data.status: failed`; check `refund_status` from `/transactions` before reporting the wallet refund as completed.

The initial purchase response and later lookup both use `successful`, `pending` or `failed`. Responses contain a `data` object on success; rejected requests contain `error` and `message`. Each account is limited to 60 API requests per minute across its keys. `429` means retry in the next minute. Other errors: `400` invalid request, `401` missing/invalid/revoked/expired key, `403` inactive or unapproved account, `404` unknown endpoint or transaction. A network or server error is not evidence that the transaction failed. Query by reference before retrying.

Sandbox `/purchase` returns `status: simulated`, makes no provider request and does not deduct wallet funds. It does not create a real transaction, refund or callback. Other read endpoints show your real catalogue and account balance; sandbox is not a separate funded wallet. A simulated response is not a live delivery test.

## Configure signed callbacks

In API Dashboard → Purchase callbacks, enter your public HTTPS endpoint and save it. Copy the new signing secret immediately. Saving again rotates the secret; update your server. Disable callback stops pending delivery attempts. Your delivery history shows pending, delivered and failed attempts. Callback URLs cannot target private networks, credentials in URLs or redirects.

Events are `transaction.success` and `transaction.failed`. Terminal events are queued when a real API transaction reaches its final state, including after reconciliation. Successful events do not include provider credentials or another customer's records. Each event has a stable `id`, `event`, `created_at` and `data` containing `reference`, `status`, `product_code`, `recipient`, `amount`, `currency` and optional `refund_status`.

Headers: `x-ihlink-event-id`, `x-ihlink-timestamp` (Unix seconds), `x-ihlink-signature` (lowercase hexadecimal HMAC-SHA256). Verify the signature over the exact text `timestamp + "." + raw_request_body` using your signing secret. Parse JSON only after verification. Reject timestamps more than five minutes from your server time, compare signatures in constant time, and process each event ID once. Persist the outcome before returning HTTP `200` or `204`.

```javascript
// Node.js example: rawBody must be the original request bytes as UTF-8 text.
import {createHmac, timingSafeEqual} from 'node:crypto';
function validCallback(rawBody, timestamp, received, secret) {
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now()/1000-Number(timestamp))>300) return false;
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  const expected=createHmac('sha256',secret).update(timestamp+'.'+rawBody).digest();
  return timingSafeEqual(expected,Buffer.from(received,'hex'));
}
```

Delivery is at least once. Return a 2xx response within eight seconds. Callback delivery starts on the next minute's queue run; unsuccessful deliveries retry with increasing delays up to eight attempts. The transaction remains successful or failed even if your callback endpoint is offline. Use `/transactions` as a fallback. Revoked API approval stops callback dispatch. A failed callback is not a failed data purchase.

## Launch checklist for an API customer

Confirm approval; test sandbox authentication and request formatting; host a signature-verifying HTTPS callback; store keys securely; fund your wallet; perform a small authorised live purchase; confirm its recipient received the service; check transaction lookup and callback history; test your own duplicate handling and revoked-key rejection. Hide any unavailable services automatically by refreshing `/products`. Contact IHLink through WhatsApp 0814 667 6278 with the merchant reference and time, never your secret key.
