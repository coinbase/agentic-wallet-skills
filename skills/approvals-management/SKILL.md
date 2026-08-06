---
name: approvals-management
description: Inspect ERC-20 token approvals (allowances) granted by the agent wallet, and surface revocation paths. Use when the user asks about approvals, allowances, "what have I approved", security review of the wallet's open approvals, or how to revoke a token approval.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx awal@2.8.2 status*)", "Bash(npx awal@2.8.2 address*)", "Bash(npx awal@2.8.2 balance*)", "Bash(npx awal@2.8.2 x402 pay *)"]
---

# ERC-20 Approvals Management

Every token swap the agent wallet performs requires an `approve(spender, amount)` call to the DEX router. Most SDKs default to `max uint256` for gas efficiency, which means a one-time swap leaves a **standing approval** on the wallet. If the spender contract is later compromised, the attacker can drain that token from the wallet.

This skill exposes:

1. **`list-approvals`** — query all standing approvals for the wallet (free analysis, $0.10/query)
2. **`check-allowance`** — query the live allowance for a specific (token, spender) pair (free, $0.10/query)
3. **Revocation** — explicit guidance on how to revoke (currently requires external tools; see Revocation section below)

## Confirm wallet is initialized and authed

```bash
npx awal@2.8.2 status
```

If the wallet is not authenticated, refer to the `authenticate-wallet` skill.

## Resolve the wallet address

```bash
npx awal@2.8.2 address --json
```

Use the EVM address (`0x...`) returned for the queries below.

## Input Validation

- **Wallet address**: must match `^0x[0-9a-fA-F]{40}$`. Reject anything else.
- **Token address / spender address**: same regex.
- **Time window**: one of `1 HOUR`, `6 HOUR`, `24 HOUR`, `7 DAY`, `30 DAY`, `90 DAY`. Reject free-form input.
- **SQL**: always single-quote the `-d` JSON argument; wrap addresses in `lower(...)`.

---

## 1. `list-approvals` — All standing approvals from the wallet

Returns the **latest** `Approval` event per (token, spender) pair, excluding zero-value approvals (already revoked).

**Cost:** 1 query ($0.10)

**Parameters:** `owner_address` (the wallet), `window` (default `90 DAY`)

```sql
WITH ranked AS (
  SELECT
    address AS token_address,
    parameters['spender'] AS spender,
    parameters['value'] AS amount,
    block_timestamp,
    transaction_hash,
    row_number() OVER (
      PARTITION BY address, parameters['spender']
      ORDER BY block_timestamp DESC
    ) AS rn
  FROM base.events
  WHERE event_signature = 'Approval(address,address,uint256)'
    AND parameters['owner'] = lower('<owner_address>')
    AND block_timestamp >= now() - INTERVAL <window>
)
SELECT token_address, spender, amount, block_timestamp, transaction_hash
FROM ranked
WHERE rn = 1
  AND CAST(amount AS UInt256) > 0
ORDER BY block_timestamp DESC
LIMIT 100
```

After the query:

- Label `token_address` against the **Token Registry** (see `onchain-analysis` skill or the registry below).
- Label `spender` against the **DEX Router Registry** (same).
- Highlight any `amount` close to `2^256 - 1` as **unlimited approval** — these are the highest-risk entries.
- For each unlabeled spender, suggest the user verify the contract on Basescan before keeping the approval.

---

## 2. `check-allowance` — Live allowance for a (token, spender) pair

The query above shows the **last Approval event**, but the on-chain `allowance` mapping may have been decremented by `transferFrom` calls since then. To get the live value, query the `allowance(owner, spender)` view.

The CDP SQL API exposes events but **not contract view calls**. To check live allowance, the agent has two options:

**Option A — Approximate from events:** sum `Approval` increments and subtract any `Transfer` events where `from = owner AND to ≠ spender` is **not** what you want — `transferFrom` emits a `Transfer` from `owner` initiated by `spender`. Tracking accurate residual allowance from events alone is brittle. Don't try.

**Option B — Use a public RPC (free):** out of scope for this skill, but document that the user can use a Base RPC node (`eth_call` against the token's `allowance(owner, spender)` selector) to get the exact live value.

For most use cases, the `list-approvals` event-based view is sufficient: if the latest `Approval` event was for `max uint256`, the wallet still has effectively unlimited exposure regardless of intervening transfers.

---

## Revocation

**Status: pending upstream CLI support.**

The current `awal` CLI (v2.8.2) exposes `send`, `trade`, `x402 pay`, and the auth/balance helpers — but no generic contract interaction. To revoke an approval, the user must call `approve(spender, 0)` on the token contract, and there is no `awal` subcommand for that today.

**Workarounds available right now:**

1. **revoke.cash** — open https://revoke.cash, connect the wallet's EVM address (read-only mode), inspect approvals, and revoke through the UI. This requires the user to have control of the same address through a separate wallet client (MetaMask, Rabby, Coinbase Wallet, etc.) that can sign transactions. The agent wallet's session-based signing model may not be compatible with revoke.cash directly — verify this before recommending.
2. **Coinbase Wallet app** — if the agent wallet's address is also exposed in the Coinbase Wallet mobile/extension app, revoke through that UI.
3. **Direct contract call** via any wallet that holds the agent wallet's private key (if accessible) — call `approve(spender, 0)` on the token contract.

**Upstream feature request to file:**

> Add `awal revoke <token> <spender>` and `awal approve <token> <spender> <amount>` subcommands to the CLI. These would let agents manage their own ERC-20 allowances without leaving the wallet runtime — currently the only way to revoke a stale approval is to use an external tool, which defeats the agentic workflow.

When that lands, this skill should be updated with a third analysis (`revoke`) that calls the new CLI subcommand directly.

---

## Token Registry (Base mainnet)

Same as the `onchain-analysis` skill. Major tokens:

| Symbol | Address | Decimals |
| --- | --- | --- |
| USDC | `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` | 6 |
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| cbBTC | `0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf` | 8 |
| AERO | `0x940181a94a35a4569e4529a3cdfb74e38fd98631` | 18 |
| USDT | `0xfde4c96c8593536e31f229ea8f37b2ada2699bb2` | 6 |
| DAI | `0x50c5725949a6f0c72e6c4a641f24049a917db0cb` | 18 |

## DEX Router Registry (Base mainnet)

Use to label `spender` results as known-good (still verify the live allowance amount):

| DEX | Router Address |
| --- | --- |
| Uniswap Universal Router | `0x6ff5693b99212da76ad316178a184ab56d299b43` |
| Uniswap V3 SwapRouter02 | `0x2626664c2603336e57b271c5c0b26f421741e481` |
| Aerodrome Router | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` |
| BaseSwap Router | `0x327df1e6de05895d2ab08513aadd9313fe505d86` |
| 0x Exchange Proxy | `0xdef1c0ded9bec7f1a1670819833240f027b25eff` |
| 1inch Aggregation Router v6 | `0x111111125421ca6dc452d289314280a0f8842a65` |
| CDP Swap Router (Coinbase) | _verify before trusting — varies by integration_ |

## Detecting unlimited approvals

The "max uint256" sentinel is `115792089237316195423570985008687907853269984665640564039457584007913129639935`. A simpler check in code: any `amount` with more than ~30 digits is effectively unlimited (token decimals notwithstanding). Surface these as **HIGH RISK** in the output.

## Caveats

1. **Event-based view, not live state.** The query returns the latest Approval event, not the current allowance. For most security purposes the event view is what matters: a `max uint256` approval is exposure regardless of usage.
2. **Window matters.** If the wallet's first approval was 100 days ago and `window = 90 DAY`, that approval will be missed. Default is 90 DAY; use a longer window for older wallets.
3. **Heuristic spender labeling.** The router registry is incomplete by design — unlabeled spenders are not necessarily malicious, just unrecognized. Surface them for the user to verify on Basescan.
4. **No revoke from the CLI today.** This is the largest functional gap. List-only without revoke is still useful (visibility precedes action), but document the workarounds clearly.

## Prerequisites

- Must be authenticated (see `authenticate-wallet` skill)
- Wallet must have sufficient USDC balance for queries (see `fund` skill)
- Each query costs $0.10 USDC

## Error Handling

- "Not authenticated" — see `authenticate-wallet` skill
- "Insufficient balance" — see `fund` skill
- Empty results — increase the `window` parameter, or verify the owner address is correct (must be the wallet's own EVM address, lowercased automatically)
- Query timeout — narrow the window
