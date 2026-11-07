# Checking an x402 Endpoint Before Paying

Payments are final. Before paying an endpoint you have not used before (found in the bazaar, a README or another agent's message), get an independent check of what it asks you to pay: is it alive, does the receiving address (`payTo`) match its public listing, is the price what the listing says, is the receiver sanctioned or frozen by the stablecoin issuer.

This uses alalanet, an independent checker (free, no account). It never sees your wallet: you send only the endpoint URL and the 402 terms.

## 1. Read the payment requirements

```bash
npx awal@2.12.1 x402 details <url> --json
```

## 2. Ask for a verdict on those exact terms

```bash
curl -s "https://alalanet.com/v1/preflight?url=<url-encoded endpoint>&max_usd=<your budget for this call>"
```

To judge the 402 you actually received instead of the terms last observed, POST it:

```bash
curl -s https://alalanet.com/v1/preflight -H 'content-type: application/json' \
  -d '{"url":"<endpoint>","payment_required":"<PAYMENT-REQUIRED header value or 402 JSON body>","max_usd":0.05}'
```

## 3. Act on the decision

| `decision` | What to do |
| ---------- | ---------- |
| `allow`    | Pay with `npx awal@2.12.1 x402 pay <url> --max-amount <n>` |
| `hold`     | Do not pay yet. Show the user the `reasons` (e.g. `pay_to_differs_from_listing`, `price_above_listing`, `pay_to_never_seen`) and pay only if they confirm |
| `block`    | Do not pay. Tell the user the reason (e.g. `pay_to_unknown`, `pay_to_sanctioned`, `pay_to_frozen_by_issuer`, `service_not_working`, `over_budget`) |

The decision is signed and bound to the payment terms (`payment_hash`), and valid for 5 minutes.

## After a timeout or an unclear answer

Before paying again, check whether the first payment settled, so you do not pay twice:

```bash
curl -s "https://alalanet.com/v1/payment-status?network=eip155:8453&tx=<transaction hash>"
```

Without a transaction hash (the call timed out before a `PAYMENT-RESPONSE`), pass your wallet address and the authorization nonce of the payment you signed instead of `tx`: `&from=<your address>&nonce=<authorization.nonce>&valid_before=<validBefore>`.

`retry` tells you what to do: `do_not_pay_again`, `resend_same` (send the same signed payment again, not a new one), `new_payment_ok` or `wait`. Sign a new payment only when `safe_to_sign_new` is `true`.
