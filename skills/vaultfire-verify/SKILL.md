---
name: vaultfire-verify
description: Verify a counterparty agent's onchain trust status BEFORE making an x402 payment or signing a settlement. Use when you want to "check if an agent is real", "verify trust", "is this address registered", "trust check before paying", "screen an x402 endpoint", or "validate a counterparty". Reads the Vaultfire ERC-8004 Identity Registry on Base, returns an active/inactive verdict in <2s, and complements `pay-for-service` and `x402` skills.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx awal@latest status*)", "Bash(cast call *)", "Bash(curl *)"]
---

# Vaultfire Trust Verification

Trust-check any counterparty agent before sending x402 payments. One read call to the Vaultfire ERC-8004 Identity Registry tells you whether the agent address is **REGISTERED + ACTIVE** or **UNREGISTERED / BURNED**.

This is a **decision-support skill** — it returns a yes/no signal you can use to gate payments. It does not send transactions and costs zero gas.

## Why This Exists

x402 is permissionless — any URL can return `402 Payment Required` and request stablecoin. Without a trust check, your agent will pay any address that asks. This skill adds a **30-line guardrail** that:

1. Resolves the receiving address from the x402 challenge
2. Asks the on-chain registry: "is this address active?"
3. Lets you short-circuit and refuse to pay if the answer is `false`

**Privacy-first**: the lookup is a public read against a public registry. No KYC, no identity dox — just *"is this agent registered with stake-backed reputation?"*

## Prerequisites

1. Your wallet authenticated: `npx awal@latest status`
2. The counterparty's payment receiver address (from the x402 challenge `accepts[].payTo` field)
3. Internet access to a Base RPC (default `https://base.publicnode.com` — no API key needed)

## Contract Details

| Network | Identity Registry |
|---|---|
| **Base mainnet** | `0xa7BD20bf5De63df949cA5Be2F20835978eCba81A` |

**The function:**
```solidity
function isAgentActive(address agent) external view returns (bool);
```

⚠️ **IMPORTANT**: Do NOT call `getReputation(address)` — it reverts on this registry. Reputation scoring is derived off-chain by the Vaultfire SDK from on-chain events. For the simple "is this agent legit?" gate, `isAgentActive` is the only call you need.

## Step 1: Confirm Your Wallet

```bash
npx awal@latest status
```

You should see a Base mainnet address.

## Step 2: Trust-Check the Counterparty

You have two ways. Pick whichever your environment has installed.

### Option A — `cast` (Foundry)

```bash
COUNTERPARTY=0xfA15Ee28939B222B0448261A22156070f0A7813C   # the address you'd be paying

cast call 0xa7BD20bf5De63df949cA5Be2F20835978eCba81A \
  "isAgentActive(address)(bool)" \
  $COUNTERPARTY \
  --rpc-url https://base.publicnode.com
```

**Output:**
- `true`  → registered + active → **safe to pay**
- `false` → unregistered or burned → **refuse / require user confirmation**

### Option B — `curl` (no Foundry needed)

```bash
COUNTERPARTY=0xfA15Ee28939B222B0448261A22156070f0A7813C
PAD=$(printf '%064s' "${COUNTERPARTY#0x}" | tr ' ' '0')

curl -s https://base.publicnode.com \
  -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"0xa7BD20bf5De63df949cA5Be2F20835978eCba81A\",\"data\":\"0x554c4f4b${PAD}\"},\"latest\"]}"
```

**Output:**
- `"result":"0x0000...0001"` → active
- `"result":"0x0000...0000"` → inactive / unregistered

The selector `0x554c4f4b` is `keccak256("isAgentActive(address)")[0:4]`.

## Step 3: Gate Your Payment

Pseudocode for an agent that already uses `pay-for-service`:

```
1. Receive 402 challenge from server
2. Parse accepts[0].payTo  → COUNTERPARTY
3. Call vaultfire-verify on COUNTERPARTY
4. If true  → proceed to pay-for-service
5. If false → either:
     a) refuse outright, OR
     b) ask the human/agent operator for explicit override
```

## Live Examples (verified Base mainnet)

| Address | Description | Expected |
|---|---|---|
| `0xfA15Ee28939B222B0448261A22156070f0A7813C` | Registered Vaultfire agent | `true` |
| `0x000000000000000000000000000000000000dEaD` | Burn address | `false` |

You can run the curl/cast above on either address right now and see the registry respond.

## Cost & Latency

| Item | Value |
|---|---|
| Gas | **0** (read-only `eth_call`) |
| Wall-clock | ~200–600 ms (PublicNode Base) |
| RPC requests | 1 per check |
| Registered agents on Base | Live via `cast call 0xa7BD20bf5De63df949cA5Be2F20835978eCba81A "getTotalAgents()(uint256)" --rpc-url https://base.publicnode.com` |

## SDK Alternative — Richer Trust Score

If you want more than yes/no — for example a 0–100 reputation score, tier (silver/gold/platinum), and automatic short-circuit middleware that wraps `fetch()` and inserts the check before any 402 settlement — install:

```bash
npm install @vaultfire/x402-guard
```

Drop-in usage with any x402 SDK:

```js
import { wrapFetch } from '@vaultfire/x402-guard';

const guardedFetch = wrapFetch(fetch, {
  chain: 'base',
  minScore: 50,            // optional, default 0
  allowUnregistered: false // refuse anything not in the registry
});

// Use guardedFetch wherever your x402 SDK takes a fetch function
```

The guard performs the same `isAgentActive` check this skill describes, plus reputation scoring derived from on-chain history. Source + tests: [`Ghostkey316/vaultfire-x402-guard`](https://github.com/Ghostkey316/vaultfire-x402-guard).

## How This Composes With Other Skills

| Before this skill | After this skill |
|---|---|
| `pay-for-service` pays anyone who returns 402 | `pay-for-service` **only after** `vaultfire-verify` returns `true` |
| `x402` accepts every endpoint | `x402` filtered through a trust gate |
| Agent risks paying a phishing endpoint | Agent refuses unregistered counterparties |

Place this check **between** receiving the 402 challenge and submitting the payment authorization. It is the cheapest defense-in-depth step in the entire x402 flow.

## Mission

Vaultfire is **trust infrastructure**, not surveillance. There is no KYC layer here. The registry tells you *"this agent has staked reputation"* — nothing about their real-world identity. Your privacy and theirs is preserved.

> *Morals over metrics. Privacy over surveillance. Freedom over control.*

## Links

- 🛡️ [Vaultfire Identity Registry on BaseScan](https://basescan.org/address/0xa7BD20bf5De63df949cA5Be2F20835978eCba81A)
- 📦 [`@vaultfire/x402-guard` on npm](https://www.npmjs.com/package/@vaultfire/x402-guard)
- 💻 [vaultfire-x402-guard source](https://github.com/Ghostkey316/vaultfire-x402-guard)
- 🌐 [theloopbreaker.com](https://theloopbreaker.com)
