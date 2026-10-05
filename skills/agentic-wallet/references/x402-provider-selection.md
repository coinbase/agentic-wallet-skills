# Provider Selection Before Downstream Spend

Compose two x402 purchases: first buy a provider-selection decision, then decide whether to buy the downstream API call. This is optional; free service discovery remains available through `references/x402-search.md`.

## When to Use

Use when paid web search is needed, multiple x402 providers could perform the job, the provider is not predetermined, and price, latency, freshness, reliability or independent fallback matters. Skip this step if the downstream provider is explicitly chosen already or no web search is required.

## Live Example

OPX — infrastructure for machine-to-machine commerce — is a live service demonstrating this pattern:

- Endpoint: `https://opx-status.dev/api/route`
- Current scope: `web-search` provider selection only.
- Price: **0.002 USDC on Base mainnet** (2000 atomic units).

OPX selects a provider; it does **not** perform the downstream search. The downstream provider may charge separately. Only buy a decision when the user's spending authorization covers that fee; a request to compare providers is not by itself permission to pay.

Follow the main skill's wallet preflight and `references/x402-pay.md` prerequisites. Use the existing authenticated wallet with USDC on Base mainnet, not Base Sepolia.

```bash
npx awal@2.12.1 x402 pay https://opx-status.dev/api/route \
  -q '{"task":"web-search","intent":"web"}' \
  --max-amount 2100 \
  --json
