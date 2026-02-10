---
name: trade
description: Swap/trade tokens on Base network (e.g., USDC to ETH). Use when the user wants to trade, swap, or exchange tokens.
user-invocable: true
disable-model-invocation: false
---

# Trading Tokens

Use the `npx awal@latest trade` command to swap tokens on Base network via the CDP Swap API. You must be authenticated to trade. Check if you're authenticated with `npx awal@latest status`, and see `authenticate-wallet` skill if you are not authenticated.

## Command Syntax

```bash
npx awal@latest trade <amount> <from> <to> [options]
```

## Arguments

| Argument | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `amount` | Amount to swap (see Amount Formats below)                              |
| `from`   | Source token: alias (usdc, eth, weth) or contract address (0x...)      |
| `to`     | Destination token: alias (usdc, eth, weth) or contract address (0x...) |

## Amount Formats

The amount can be specified in multiple formats:

| Format        | Example                | Description                            |
| ------------- | ---------------------- | -------------------------------------- |
| Dollar prefix | `$1.00`, `$0.50`       | USD notation (decimals based on token) |
| Decimal       | `1.0`, `0.50`, `0.001` | Human-readable with decimal point      |
| Whole number  | `5`, `100`             | Interpreted as whole tokens            |
| Atomic units  | `500000`               | Large integers treated as atomic units |

**Auto-detection**: Large integers without a decimal point are treated as atomic units. For example, `500000` for USDC (6 decimals) = $0.50.

**Decimals**: For known tokens (usdc=6, eth=18, weth=18), decimals are automatic. For arbitrary contract addresses, decimals are read from the token contract.

## Options

| Option               | Description                                   |
| -------------------- | --------------------------------------------- |
| `-c, --chain <name>` | Blockchain network (default: base)            |
| `-s, --slippage <n>` | Slippage tolerance in basis points (100 = 1%) |
| `--json`             | Output result as JSON                         |

## Token Aliases

| Alias | Token | Decimals | Address                                    |
| ----- | ----- | -------- | ------------------------------------------ |
| usdc  | USDC  | 6        | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |
| eth   | ETH   | 18       | 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE |
| weth  | WETH  | 18       | 0x4200000000000000000000000000000000000006 |

## Examples

```bash
# Swap $1 USDC for ETH (dollar prefix)
awal trade $1 usdc eth

# Swap 0.50 USDC for ETH (decimal format)
awal trade 0.50 usdc eth

# Swap 500000 atomic units of USDC for ETH
awal trade 500000 usdc eth

# Swap 0.01 ETH for USDC
awal trade 0.01 eth usdc

# Swap with custom slippage (2%)
awal trade $5 usdc eth --slippage 200

# Swap using contract addresses (decimals read from chain)
awal trade 100 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 0x4200000000000000000000000000000000000006

# Get JSON output
awal trade $1 usdc eth --json
```

## Prerequisites

- Must be authenticated (`awal status` to check)
- Wallet must have sufficient balance of the source token

## Error Handling

Common errors:

- "Not authenticated" - Run `awal auth login <email>` first
- "Invalid token" - Use a valid alias (usdc, eth, weth) or 0x address
- "Cannot swap a token to itself" - From and to must be different
- "Swap failed: TRANSFER_FROM_FAILED" - Insufficient balance or approval issue
- "No liquidity" - Try a smaller amount or different token pair
- "Amount has X decimals but token only supports Y" - Too many decimal places
