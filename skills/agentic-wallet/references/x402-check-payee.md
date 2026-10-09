# Check the Payee Before Paying

Before paying an x402 endpoint the agent has not paid before, confirm that the wallet in its payment requirements has settled for that seller. Uses Paddock's free `check_payee`. No wallet or sign-in needed.

## When to use

Before `x402 pay` (see `references/x402-pay.md`) on any endpoint you have not paid before, or when its payment terms changed.

## Input Validation

- URL: must match `^https://[^\s;|&$`'"]+$`
- payTo (EVM): `^0x[0-9a-fA-F]{40}$`; payTo (Solana): `^[1-9A-HJ-NP-Za-km-z]{32,44}$`
- network: `^[a-z0-9:-]+$`

Reject anything else.

## Step 1: Read the payment requirements

```bash
node -e "fetch(process.argv[1]).then(async r=>{const h=r.headers.get('payment-required');const d=h?JSON.parse(Buffer.from(h,'base64').toString()):await r.json();console.log(JSON.stringify(d.accepts.map(a=>({network:a.network,payTo:a.payTo,asset:a.asset,amount:a.amount??a.maxAmountRequired}))))})" '<url>'
```

Pick the entry for the network you will pay on.

## Step 2: Check the payee

```bash
curl -s -G 'https://paddock.finance/api/mcp/check-payee' --data-urlencode 'url=<url>' --data-urlencode 'pay_to=<payTo>' --data-urlencode 'network=<network>' --data-urlencode 'amount_atomic=<amount>'
```

## Step 3: Act on the verdict

| `verdict` | Action |
| --- | --- |
| `fail` | Do not pay. The wallet is recorded as settling for a different seller. Show the user `reasons` and `full_check`. |
| `warn` | You may pay. Tell the user what `reasons` says first. |
| `pass` or `unknown` | Pay as normal with `x402 pay`. |
| Error, timeout or HTTP 402 | Pay as normal. The check is advisory. |

Free: 25 checks a day without a key. TypeScript projects can add the same check to the x402 client with `@paddock-finance/x402-guard`.
