# Checkila ↔ Luhive payment contract

This is the contract Luhive already implements. Build Checkila to this document.
Do not invent extra fields, auth schemes, or a return URL. Luhive rejects
anything that does not match.

Luhive never talks to Epoint. Checkila creates the Epoint payment, hosts the
checkout page, and tells Luhive only after a successful payment.

```
User on Luhive                Checkila                         Epoint
  |-- POST /integrations/luhive/payments -->|                    |
  |<- 201 { paymentId, paymentUrl } ---------|                    |
  |                                           |                    |
  (browser goes to paymentUrl)                |-- checkout ------->|
  |                                           |<- webhook + page --|
  |                                           |                    |
  |<- POST /v1/payments/confirm --------------|                    |
  |-- 200 ------------------------------------>|                    |
```

There are two directions. Section 1 is what Luhive calls. Section 2 is what
Checkila calls. Both are required.

---

## Rules that must not change

1. `userId` is a Luhive registration id (UUID). Store it and send it back
   unchanged. It is not a Checkila user id and not an Epoint id.
2. Money is AZN. Luhive sends `amount` as a JSON number in major units
   (manat), for example `25` or `12.5`. Echo that same number on the callback.
   Do not send a string, and do not re-round it.
3. `paymentId` from the create response is what the callback must send as
   `checkilaRequestId`. They are the same value.
4. Call Luhive only after Epoint confirms success. Never call on failure,
   cancel, or timeout.
5. The callback is idempotent. Sending the same successful payment twice must
   be safe. Luhive answers `200` the second time.
6. Treat any `2xx` as delivered. Do not parse Luhive's response body.
7. Retry only on network failure, timeout, or `5xx`. A `4xx` is permanent:
   stop retrying and alert a human.
8. Do not put card data, the API keys, or the full payment URL into logs.

---

## 1. Luhive → Checkila: create a payment

Luhive calls this when a person starts a paid registration.

```
POST https://back.checkila.com/integrations/luhive/payments
Content-Type: application/json
x-api-key: <CHECKILA_API_KEY>
```

`CHECKILA_API_KEY` is a secret Checkila issues to Luhive. Luhive stores it in
its deployment environment. It is not committed to git. If a key was ever sent
in a document or chat, rotate it before go-live.

### Request

| Field | Type | Required | Rules |
|---|---|---|---|
| `userId` | string | yes | Luhive registration UUID. Store it. Echo it later. |
| `amount` | number | yes | AZN, greater than 0, at most 2 decimal places. Example: `25` or `12.5`. |
| `description` | string | no | Event title, already trimmed to 255 characters. Show it on the Epoint page. |

```json
{
  "userId": "22222222-2222-4222-8222-222222222222",
  "amount": 25,
  "description": "Paid Event test"
}
```

Luhive waits **8 seconds** and does not retry. Respond well inside that.
There is no `currency` field and no return URL. Do not require either.

### Success — `201 Created`

| Field | Type | Rules |
|---|---|---|
| `paymentId` | string | Checkila's id for this payment. 1–128 characters. Stable. This exact string comes back as `checkilaRequestId`. |
| `paymentUrl` | string | Absolute `https` URL. Luhive sends the browser here. |

```json
{
  "paymentId": "8f14e45f-ceea-467e-b9a1-abcdef123456",
  "paymentUrl": "https://checkila.com/luhive/pay/8f14e45f-ceea-467e-b9a1-abcdef123456"
}
```

`paymentUrl` must be `https`. `http` is rejected and the user is not sent there.

One Luhive registration creates at most one Checkila payment under normal use.
If Luhive calls again with the same `userId` because the first response was
lost, either:

- return the **same** `paymentId` and a still-valid `paymentUrl` (`201`), or
- return `409` with `{ "error": "payment already exists", "paymentId": "...", "paymentUrl": "..." }`.

Do not create a second Epoint charge for the same `userId` while the first one
is unpaid or already paid.

### Errors

JSON body `{ "error": "<short message>" }`.

| Status | When |
|---|---|
| 400 | Missing `userId`, or `amount` missing, not a number, or not greater than 0. |
| 401 | Missing or wrong `x-api-key`. |
| 409 | A payment for this `userId` already exists. Include `paymentId` and `paymentUrl` if you have them. |
| 500 | Epoint or an unexpected failure. Luhive will ask the user to try again. |

### Checkout page

After paying, Epoint returns the browser to a **Checkila** page, not to Luhive.
That page should say whether the payment succeeded, and should include a link
back to the event. Luhive cannot pass a return URL today, so hardcode or store
nothing from Luhive except `userId`. A generic "You can close this page. Your
ticket will arrive by email." is acceptable for the pilot.

The payment link should stay valid for at least 24 hours. If it expires, say so
on the page. Luhive keeps showing the same link until it is paid.

---

## 2. Checkila → Luhive: report a successful payment

Call this once Epoint's webhook says the payment succeeded. Do not call it from
the browser redirect. The redirect can be forged; the webhook cannot.

```
POST https://api.luhive.com/v1/payments/confirm
Content-Type: application/json
x-api-key: <LUHIVE_OUTBOUND_API_KEY>
```

Set `LUHIVE_APPROVAL_URL` to `https://api.luhive.com/v1/payments/confirm`.

`LUHIVE_OUTBOUND_API_KEY` is a secret **Luhive** generates and gives to
Checkila. Send it on every callback in the `x-api-key` header. It is required.
A missing or wrong key gets `401` and must not be retried as if the payment
were rejected. Fix the key.

For local testing Luhive may give a different URL (for example
`http://localhost:8787/v1/payments/confirm`) and a different key. Production
and local keys are not interchangeable.

### Request

| Field | Type | Required | Rules |
|---|---|---|---|
| `userId` | string | yes | The same registration UUID Luhive sent in section 1. Must be a UUID. |
| `status` | string | yes | Always `"success"`. Any other value is `400`. |
| `amount` | number | yes | The amount Luhive sent, as a JSON number, not a string. `25` and `25.0` are the same. `24.99` is rejected. |
| `checkilaRequestId` | string | yes | The `paymentId` returned in section 1. 1–128 characters. |
| `transactionId` | string or null | no | Epoint's transaction id, or `null` if Epoint did not provide one. 1–128 characters when present. |

```json
{
  "userId": "22222222-2222-4222-8222-222222222222",
  "status": "success",
  "amount": 25,
  "checkilaRequestId": "8f14e45f-ceea-467e-b9a1-abcdef123456",
  "transactionId": "epoint-txn-abc123"
}
```

Send only these fields. Do not send card numbers, payer email, or Epoint
signatures.

### How Luhive decides

In order:

1. Bad JSON, missing field, `status` other than `"success"`, `userId` not a UUID, `amount` not a positive number, empty `checkilaRequestId` → `400`. Permanent.
2. Unknown key → `401`. Permanent until the key is fixed.
3. Key valid but not allowed to confirm payments → `403`. Permanent.
4. No registration with that `userId` → `404`. Permanent. Do not invent a new id.
5. `amount` is not the amount Luhive stored → `422` with code `amount_mismatch`. The registration stays unpaid.
6. `checkilaRequestId` is not the `paymentId` for that registration → `422` with code `reference_mismatch`.
7. Payment recorded → `200`.
8. The same payment was already recorded → `200` again. This is success, not an error.
9. Luhive cannot accept it (already refunded, or this `transactionId` belongs to a different registration) → `409`. Permanent. Alert a human.
10. Luhive is down → `500` or a timeout. Retry.

Luhive compares money in qəpik: `amount` must equal the original manat value to
the qəpik. `25` matches `25.00`. `25.005` does not match `25`.

### Response

Any `2xx` means delivered. The body looks like this, but Checkila must ignore it:

```json
{ "ok": true, "data": { "registration_id": "22222222-2222-4222-8222-222222222222", "status": "paid" } }
```

Errors look like:

```json
{ "ok": false, "error": { "code": "amount_mismatch" } }
```

`error.code` is one of: `invalid_payload`, `unauthorized`, `forbidden`,
`insufficient_scope`, `not_found`, `wrong_community`, `amount_mismatch`,
`reference_mismatch`, `conflict`, `internal_error`.

### Retries

| Result | What to do |
|---|---|
| `2xx` | Mark the callback delivered. Stop. |
| Network error, timeout, `408`, `429`, `5xx` | Retry with backoff. Suggested: 5 tries over about 15 minutes (for example 30s, 2m, 5m, 10m). |
| `4xx` other than `408` and `429` | Stop. Store the status and body. Alert a person. Do not keep charging or re-calling. |

Use the same body on every retry. Luhive deduplicates.

Timeout waiting for Luhive: **10 seconds**.

---

## 3. What Luhive does after `200`

Not Checkila's job, listed so the agent does not also try to do it:

- Marks the registration approved.
- Sends the attendee and the organiser an email.
- Shows the ticket on the Luhive event page.

Checkila does not send those emails and does not approve anything itself.

---

## 4. Configuration

| Variable | Who sets it | Value |
|---|---|---|
| `CHECKILA_API_KEY` | Checkila gives the secret to Luhive | Sent by Luhive as `x-api-key` on section 1. |
| `LUHIVE_APPROVAL_URL` | Luhive | `https://api.luhive.com/v1/payments/confirm` |
| `LUHIVE_OUTBOUND_API_KEY` | Luhive gives the secret to Checkila | Sent by Checkila as `x-api-key` on section 2. Required. |

Store both secrets in the server environment. Never in the mobile app, the
checkout page, or a git repo.

---

## 5. Acceptance tests

Implement these before saying it is done.

Create:

1. Valid body and key → `201`, `paymentId` and `https` `paymentUrl`, one Epoint payment.
2. Same `userId` again while unpaid → same `paymentId`, no second charge.
3. Missing `x-api-key` → `401`.
4. `amount: 0`, `amount: -1`, `amount: "25"` → `400`.
5. Missing `userId` → `400`.

Callback (against a Luhive URL and key Luhive provides):

6. After a real or sandbox Epoint success, one POST with the stored `userId`, the original `amount`, `checkilaRequestId` equal to `paymentId`, and `transactionId`.
7. Luhive `200` → callback marked delivered, not sent again.
8. Luhive `200` on a deliberate second send of the same body → still delivered, no error state.
9. Failed or abandoned Epoint payment → no call to Luhive.
10. Luhive timeout or `500` → retried, then delivered once Luhive returns `200`.
11. Luhive `422` → not retried, visible to an operator.
12. Browser return to the Checkila page does not, by itself, call Luhive.

---

## 6. Out of scope for this pilot

- Refunds. Luhive will ask a person at Checkila when a refund is needed.
- Partial payments, multiple tickets in one payment, or currencies other than AZN.
- A status-lookup API. Useful later, not required to launch.
