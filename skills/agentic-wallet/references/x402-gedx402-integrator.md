# GEDX402 integrator worked example

End-to-end **external payer** flow for [GEDX402](https://gedx402.com) — discover paid hero SKUs, pay with USDC on Base via `awal`, no API keys. Canonical walkthrough: [Integrator quickstart](https://gedx402.com/docs/integrator-quickstart).

If the wallet is not authenticated, see `references/auth.md`. For generic x402 pay syntax, see `references/x402-pay.md`. To discover other providers, see `references/x402-search.md`.

## Prerequisites

- Authenticated wallet (`npx awal@2.12.0 status`)
- USDC on **Base** — for this three-step ladder, fund at least **~$0.70** USDC to cover worst-case prices (embed ping ~$0.0036, scrape-lite $0.05, open-answer $0.63). Check live caps on [GET /v1/models?prominence=hero](https://gedx402.com/v1/models?prominence=hero).

## Worked example: embed ping → scrape-lite → open-answer

Run in order. Each command auto-handles HTTP 402, signs USDC on Base, and retries with `payment-signature`.

### 1. Embed ping (entry probe)

```bash
npx awal@2.12.0 x402 pay https://embed.gedx402.com/v1/embed/ping -X POST -d '{"text":"ping"}'
```

### 2. Scrape Lite

```bash
npx awal@2.12.0 x402 pay https://browser.gedx402.com/v1/browser/outcome/scrape -X POST -d '{"url":"https://example.com"}'
```

### 3. Open answer

```bash
npx awal@2.12.0 x402 pay https://search.gedx402.com/v1/search/outcome/open-answer -X POST -d '{"query":"What is Cloudflare Workers AI pricing?","max_sources":3}'
```

On success, the CLI prints the route JSON (e.g. embedding vector for ping, page text for scrape, synthesized answer for open-answer). Settled responses may include `payment-response` (receipt) and `X-GED-Cache: hit` when an identical POST was served from cache (~300s; no second settle).

## MCP is operator-only

Hosted MCP at `mcp.gedx402.com` is for **operator testing only** — not the customer integration path. External integrators and agents should use **awal + shard URLs** (as above), not MCP.

## Input validation

- **URLs in `-d` JSON**: use fixed example URLs/queries in tutorials; if the user supplies values, validate URLs start with `https://` and JSON is well-formed. Single-quote `-d` payloads.
- **max-amount**: optional caps per `references/x402-pay.md` (e.g. `--max-amount 630000` before open-answer).

## Error handling

- "Not authenticated" — `references/auth.md`
- "Insufficient balance" — `references/fund.md`
- "No X402 payment requirements found" — confirm the shard URL; inspect with `npx awal@2.12.0 x402 details <url>`

## Further steps

Full six-SKU AOV ladder (web-search, cited-research-pack, rag-answer): [integrator quickstart](https://gedx402.com/docs/integrator-quickstart) and [gedx402.com/heroes](https://gedx402.com/heroes).
