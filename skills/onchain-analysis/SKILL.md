---
name: onchain-analysis
description: Run pre-built aggregated analyses over Base onchain data via the CDP SQL API. Use when you or your user want named, opinionated stats (top tokens, top DEXs, wallet profile, whale transfers, etc.) instead of writing raw SQL.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx awal@2.8.2 status*)", "Bash(npx awal@2.8.2 balance*)", "Bash(npx awal@2.8.2 x402 pay *)"]
---

# Onchain Analysis (Aggregated Stats) on Base

Pre-built analyses that wrap the CDP SQL API with sensible queries, label registries, and post-processing. Each analysis costs **$0.10 USDC per query**, and some bundle 2–3 queries — the per-analysis cost is documented below.

For raw SQL access, use the `query-onchain-data` skill. This skill is the higher-level companion to it.

## Confirm wallet is initialized and authed

```bash
npx awal@2.8.2 status
```

If the wallet is not authenticated, refer to the `authenticate-wallet` skill.

## How to invoke an analysis

Each analysis is a named template. Substitute the user's parameters into the SQL, then execute:

```bash
npx awal@2.8.2 x402 pay https://x402.cdp.coinbase.com/platform/v2/data/query/run \
  -X POST -d '{"sql": "<TEMPLATED_QUERY>"}' --json
```

**IMPORTANT**: Always single-quote the `-d` JSON string to prevent bash variable expansion. All addresses must be wrapped in `lower()` before comparison.

## Input Validation

- **Addresses**: Must match `^0x[0-9a-fA-F]{40}$`. Reject anything else.
- **Time windows**: Must be one of `1 HOUR`, `6 HOUR`, `24 HOUR`, `7 DAY`, `30 DAY`. Reject free-form input.
- **Numeric thresholds / limits**: Must be a positive integer. Reject negative values, scientific notation, and any shell metacharacters.
- **Token / DEX names**: Must resolve via the registries in this file. If the user provides an unknown name, ask before substituting an address.

## Available Analyses

Each section below is a template. Pick the one that matches the user's question, fill in parameters, and run.

---

### 1. `top-tokens` — Top tokens by transfer activity

Ranks ERC-20 tokens by Transfer event count over a window. Strong proxy for activity; not USD volume (see Caveats).

**Cost:** 1 query ($0.10)

**Parameters:** `window` (default `24 HOUR`), `limit` (default `10`)

```sql
SELECT address AS token_address, count(*) AS transfer_count
FROM base.events
WHERE event_signature = 'Transfer(address,address,uint256)'
  AND block_timestamp >= now() - INTERVAL <window>
GROUP BY address
ORDER BY transfer_count DESC
LIMIT <limit>
```

After the query, label addresses against the **Token Registry** below before showing results.

---

### 2. `top-dexs` — DEX market share by swap count

Counts Swap events grouped by `transaction_to` (the router that initiated the swap). Combine with the **DEX Router Registry** to label.

**Cost:** 1 query ($0.10)

**Parameters:** `window` (default `24 HOUR`), `limit` (default `20`)

```sql
SELECT transaction_to AS router, count(*) AS swap_count
FROM base.events
WHERE event_signature IN (
  'Swap(address,uint256,uint256,uint256,uint256,address)',
  'Swap(address,address,int256,int256,uint160,uint128,int24)'
)
AND block_timestamp >= now() - INTERVAL <window>
GROUP BY transaction_to
ORDER BY swap_count DESC
LIMIT <limit>
```

Note: `transaction_to` is **not indexed** — the query relies on `event_signature` + `block_timestamp` to bound the scan. Keep the window ≤ 24 HOUR for fast results.

---

### 3. `top-pools` — Top liquidity pools by swap count

Pool-level activity ranking, regardless of DEX.

**Cost:** 1 query ($0.10)

**Parameters:** `window` (default `24 HOUR`), `limit` (default `10`)

```sql
SELECT address AS pool_address, count(*) AS swap_count
FROM base.events
WHERE event_signature IN (
  'Swap(address,uint256,uint256,uint256,uint256,address)',
  'Swap(address,address,int256,int256,uint160,uint128,int24)'
)
AND block_timestamp >= now() - INTERVAL <window>
GROUP BY address
ORDER BY swap_count DESC
LIMIT <limit>
```

---

### 4. `wallet-profile` — Activity profile for a single address

Multi-query analysis: returns transaction counts, total gas spent, and top counterparties for a wallet.

**Cost:** 2 queries ($0.20)

**Parameters:** `address` (required), `window` (default `30 DAY`)

**Query A — tx summary:**
```sql
SELECT
  count(*) AS tx_count,
  sum(gas) AS total_gas,
  sum(CAST(value AS UInt256)) AS total_value_wei
FROM base.transactions
WHERE from_address = lower('<address>')
  AND timestamp >= now() - INTERVAL <window>
```

**Query B — top counterparties:**
```sql
SELECT to_address, count(*) AS tx_count
FROM base.transactions
WHERE from_address = lower('<address>')
  AND timestamp >= now() - INTERVAL <window>
GROUP BY to_address
ORDER BY tx_count DESC
LIMIT 10
```

---

### 5. `whale-transfers` — Large transfers of a specific token

Identifies transfers above a threshold for a given token contract. Useful for spotting accumulation / distribution.

**Cost:** 1 query ($0.10)

**Parameters:** `token_address` (required), `min_atomic` (required, atomic units), `window` (default `24 HOUR`), `limit` (default `20`)

```sql
SELECT
  block_timestamp,
  transaction_hash,
  parameters['from'] AS sender,
  parameters['to'] AS recipient,
  parameters['value'] AS amount
FROM base.events
WHERE event_signature = 'Transfer(address,address,uint256)'
  AND address = lower('<token_address>')
  AND block_timestamp >= now() - INTERVAL <window>
  AND CAST(parameters['value'] AS UInt256) >= <min_atomic>
ORDER BY block_timestamp DESC
LIMIT <limit>
```

Threshold examples: USDC has 6 decimals, so `1000000000` = $1,000. WETH has 18 decimals, so `10000000000000000000` = 10 ETH.

---

### 6. `contract-activity` — Event breakdown for a contract

Shows which event types fire most often on a contract over a window. Useful for understanding what a contract is being used for.

**Cost:** 1 query ($0.10)

**Parameters:** `contract_address` (required), `window` (default `24 HOUR`), `limit` (default `20`)

```sql
SELECT event_signature, count(*) AS cnt
FROM base.events
WHERE address = lower('<contract_address>')
  AND block_timestamp >= now() - INTERVAL <window>
GROUP BY event_signature
ORDER BY cnt DESC
LIMIT <limit>
```

---

## Token Registry (Base mainnet)

Use these to label `address` results. If a token isn't here, return the address as-is.

| Symbol | Address | Decimals |
| --- | --- | --- |
| USDC | `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` | 6 |
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| cbBTC | `0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf` | 8 |
| AERO | `0x940181a94a35a4569e4529a3cdfb74e38fd98631` | 18 |
| USDT | `0xfde4c96c8593536e31f229ea8f37b2ada2699bb2` | 6 |
| DAI | `0x50c5725949a6f0c72e6c4a641f24049a917db0cb` | 18 |
| USDbC | `0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca` | 6 |

## DEX Router Registry (Base mainnet)

Use these to label `transaction_to` results in `top-dexs`. If a router isn't here, return the address as-is.

| DEX | Router Address |
| --- | --- |
| Uniswap Universal Router | `0x6ff5693b99212da76ad316178a184ab56d299b43` |
| Uniswap V3 SwapRouter02 | `0x2626664c2603336e57b271c5c0b26f421741e481` |
| Aerodrome Router | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` |
| BaseSwap Router | `0x327df1e6de05895d2ab08513aadd9313fe505d86` |
| 0x Exchange Proxy | `0xdef1c0ded9bec7f1a1670819833240f027b25eff` |
| 1inch Aggregation Router v6 | `0x111111125421ca6dc452d289314280a0f8842a65` |

> Registry maintenance: addresses change rarely but are not authoritative. If a result row's `swap_count` is large but the router is unlabeled, verify the address on Basescan and consider opening a PR to add it.

## Caveats

1. **Transfer count ≠ USD volume.** A token with many small transfers ranks higher than one with few large transfers. To get true USD volume you need (a) decoded `value`, (b) decimals, (c) USD price at swap time — only (a) is in the query result; (b) is in the registry above; (c) requires an external price feed.
2. **Pool→DEX attribution via `transaction_to` is a heuristic.** Direct pool calls bypassing routers (rare but possible) won't be attributed.
3. **`transaction_to` is not indexed.** Queries that group on it must combine with indexed filters (`event_signature` + `block_timestamp`) and a tight time window.
4. **Schema-only data.** No prices, no off-chain context. Pair with a price API (e.g. via `pay-for-service`) for USD-denominated outputs.

## Prerequisites

- Must be authenticated (see `authenticate-wallet` skill)
- Wallet must have sufficient USDC balance (see `fund` skill)
- Each query costs $0.10 USDC; multi-query analyses cost $0.10 × number of queries

## Error Handling

- "Not authenticated" — see `authenticate-wallet` skill
- "Insufficient balance" — see `fund` skill
- Query timeout — narrow the window or add an indexed filter
- Empty results — verify the address with `lower()`, expand the window, or sanity-check the event signature
