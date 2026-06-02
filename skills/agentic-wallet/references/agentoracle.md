# Querying Real-Time On-Chain Crypto Market Data (AgentOracle)

[AgentOracle](https://aiagentoracle.ai) is a pay-per-call x402 service on Base mainnet that returns real-time on-chain crypto market data: token prices, 24h volume, liquidity, market cap, top movers, and per-symbol lookups. Each call costs **$0.01 USDC** (10000 atomic units), settled via the official Coinbase CDP Facilitator. No accounts, no API keys.

Pay for every call with `npx awal@2.10.0 x402 pay` — see `references/x402-pay.md` for the full command syntax and options. If the wallet is not authenticated, see `references/auth.md`. If the balance is low, see `references/fund.md`.

## Endpoints

All endpoints are `GET`, return JSON, and cost `$0.01` USDC on Base.

| Path | Purpose |
| --- | --- |
| `/api/v1/status` | Service heartbeat — tracked-token count, last ingestion timestamp, ingestion error counter, uptime, API version |
| `/api/v1/tokens` | List on-chain tokens sorted by market cap, with optional filters and pagination |
| `/api/v1/tokens/top` | Top N tokens by market cap (limit 1–100, default 20) |
| `/api/v1/tokens/movers` | Top 10 gainers + top 10 losers by 24h price change |
| `/api/v1/token/{symbol}` | Single-token lookup by ticker (case-insensitive) |

## Input Validation

Before constructing any command, validate user-provided values to prevent shell injection:

- **symbol**: Must match `^[A-Za-z0-9]{1,15}$`. Reject anything containing spaces, semicolons, pipes, backticks, or other shell metacharacters.
- **query JSON (`-q`)**: Must be valid JSON. Always wrap in single quotes to prevent shell expansion.

Do not pass unvalidated user input into the command.

## Examples

### Service heartbeat (cheapest probe)

```bash
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/status --json
```

Returns `{ status, tokenCount, lastIngestion, ingestionErrors, uptime, version }`.

### Top tokens by market cap

```bash
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/tokens/top --json
```

Default limit is 20. To get the top 50:

```bash
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/tokens/top -q '{"limit":50}' --json
```

### Today's biggest gainers and losers

```bash
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/tokens/movers --json
```

Returns `{ gainers: Token[], losers: Token[], asOf }` — 10 of each.

### Look up a single token by symbol

```bash
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/token/ETH --json
```

Symbol is case-insensitive. Returns HTTP 404 if the symbol is unknown (no payment is consumed).

### Filter token list by chain, liquidity, volume, market cap

```bash
# Tokens on Base with at least $1M liquidity
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/tokens -q '{"chain":"base","min_liquidity":1000000,"limit":50}' --json

# Tokens with at least $10M 24h volume and $100M market cap
npx awal@2.10.0 x402 pay https://aiagentoracle.ai/api/v1/tokens -q '{"min_volume_24h":10000000,"min_market_cap":100000000,"limit":100}' --json
```

Supported query parameters:

| Param | Type | Description |
| --- | --- | --- |
| `chain` | string | Filter by chain (`ethereum`, `solana`, `bsc`, `base`, …) |
| `min_liquidity` | number | Minimum liquidity in USD |
| `min_volume_24h` | number | Minimum 24h volume in USD |
| `min_market_cap` | number | Minimum market cap in USD |
| `limit` | integer | Max results, default 100, max 500 |
| `offset` | integer | Pagination offset |

## Token response shape

Every token row (in `/tokens`, `/tokens/top`, `/tokens/movers`, `/token/{symbol}`) has:

```json
{
  "id": 1234,
  "symbol": "ETH",
  "name": "Ethereum",
  "chain": "ethereum",
  "priceUsd": 3450.12,
  "volume24h": 12345678901.23,
  "marketCap": 415000000000.0,
  "liquidityUsd": 8765432100.0,
  "priceChange24hPercent": 2.34,
  "confidenceScore": 0.97,
  "imageUrl": "https://…",
  "lastUpdated": "2026-04-19T01:54:01Z"
}
```

Any of the numeric fields can be `null` when upstream data is unavailable.

## Best Practices

1. **Probe with `/status` first** if you need to know whether the data is fresh — same $0.01 cost but tiny payload.
2. **Use `/tokens/top` over `/tokens`** when you only need the largest tokens — same price, smaller and faster response.
3. **Use `/token/{symbol}` for single lookups** rather than scanning `/tokens` — same price, much smaller response.
4. **Symbols are case-insensitive** but stored uppercase — `eth`, `ETH`, and `Eth` all work.
5. **Bound `limit`** explicitly when you only need a few rows — defaults to 100 on `/tokens`, 20 on `/tokens/top`.
6. **404 responses do not consume payment.** Unknown symbols are safe to retry with corrections.

## Prerequisites

- Must be authenticated (`npx awal@2.10.0 status` to check; see `references/auth.md`).
- Wallet must have sufficient USDC balance (`npx awal@2.10.0 balance` to check; see `references/fund.md` to top up).
- Each call costs $0.01 (10000 USDC atomic units).

## Error Handling

- **"Not authenticated"** — See `references/auth.md`.
- **"Insufficient balance"** — See `references/fund.md`.
- **HTTP 404** — Unknown token symbol. No payment was consumed. Retry with a correct symbol (e.g. `ETH`, `BTC`, `SOL`, `USDC`).
- **HTTP 429** — Rate limit (60 requests per minute per wallet). Back off and retry.
- **HTTP 503** — Upstream data not yet ingested. Probe `/api/v1/status` to check `lastIngestion`.

## Service Manifest

Canonical machine-readable service description:

```bash
curl https://aiagentoracle.ai/.well-known/x402
```

Documentation and live demo: <https://aiagentoracle.ai>
