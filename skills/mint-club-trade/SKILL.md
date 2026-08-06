---
name: mint-club-trade
description: Trade bonding curve tokens on Base via Mint Club V2. Use when the user wants to buy, sell, swap, or create bonding curve tokens, check token prices or info, or manage Mint Club tokens. Covers phrases like "buy SIGNET", "sell SIGNET for ETH", "swap ETH to HUNT", "create a token", "what's the price of SIGNET".
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(mc info *)", "Bash(mc price *)", "Bash(mc wallet*)", "Bash(mc buy *)", "Bash(mc sell *)", "Bash(mc swap *)", "Bash(mc zap-buy *)", "Bash(mc zap-sell *)", "Bash(mc send *)", "Bash(mc create *)"]
---

# Trading Bonding Curve Tokens with Mint Club V2

Use the `mc` CLI ([mint.club-cli](https://www.npmjs.com/package/mint.club-cli)) to trade bonding curve tokens on Base. Mint Club V2 is a permissionless protocol — tokens are created with programmable price curves backed by reserve assets (HUNT, ETH, USDC). No liquidity pool required.

## Prerequisites

```bash
npm install -g mint.club-cli
```

Set up a wallet:

```bash
mc wallet --generate                    # Generate new wallet
mc wallet --set-private-key 0x...       # Or import existing
```

The private key is stored at `~/.mintclub/.env`.

## Read Commands

### Get token info

```bash
mc info <token>
```

Returns: name, symbol, creator, reserve token, reserve balance, supply, royalties, bonding curve steps, current price, market cap.

**Token** can be an address (`0x...`) or known symbol (`SIGNET`, `HUNT`, `ONCHAT`).

### Get token price

```bash
mc price <token>
```

Returns: price in reserve token and USD (via 1inch Spot Price Aggregator).

### Check wallet balances

```bash
mc wallet
```

Returns: ETH balance, known token balances, Mint Club token balances, all with USD values.

## Trading Commands

### Buy (mint) tokens via bonding curve

```bash
mc buy <token> -a <amount>              # Buy tokens with reserve
mc buy <token> -a <amount> -m <max>     # With max cost limit
```

| Option | Description |
|--------|-------------|
| `-a, --amount <n>` | Number of tokens to buy **(required)** |
| `-m, --max-cost <n>` | Maximum reserve to spend |

### Sell (burn) tokens via bonding curve

```bash
mc sell <token> -a <amount>             # Sell tokens for reserve
mc sell <token> -a <amount> -m <min>    # With min refund
```

| Option | Description |
|--------|-------------|
| `-a, --amount <n>` | Number of tokens to sell **(required)** |
| `-m, --min-refund <n>` | Minimum reserve to receive |

### Smart swap (any token pair)

```bash
mc swap -i <input> -o <output> -a <amount>
```

Auto-detects the optimal route:
- **Bonding curve buy** — if output is a Mint Club token and input is its reserve
- **Bonding curve sell** — if input is a Mint Club token and output is its reserve
- **Zap buy** — if output is a Mint Club token and input is different (swap → bond)
- **Zap sell** — if input is a Mint Club token and output is different (bond → swap)
- **Uniswap V3/V4** — for all other token pairs

| Option | Description |
|--------|-------------|
| `-i, --input <token>` | Input token — address or `ETH`, `HUNT`, `USDC` **(required)** |
| `-o, --output <token>` | Output token **(required)** |
| `-a, --amount <n>` | Amount of input token **(required)** |
| `-s, --slippage <n>` | Slippage tolerance % (default: 1) |

### Zap buy (buy with any token)

```bash
mc zap-buy <token> -i <input-token> -a <amount>
```

Swaps input token via Uniswap into the reserve, then mints along the bonding curve.

| Option | Description |
|--------|-------------|
| `-i, --input-token <addr>` | Token to pay with — use `ETH` for native ETH **(required)** |
| `-a, --amount <n>` | Amount of input token to spend **(required)** |
| `-p, --path <p>` | Manual swap path: `token,fee,token,...` (auto-routes if omitted) |

### Zap sell (sell for any token)

```bash
mc zap-sell <token> -a <amount> -o <output-token>
```

Burns tokens for reserve, then swaps to desired output via Uniswap.

| Option | Description |
|--------|-------------|
| `-a, --amount <n>` | Tokens to sell **(required)** |
| `-o, --output-token <addr>` | Token to receive — use `ETH` for native ETH **(required)** |
| `-p, --path <p>` | Manual swap path (auto-routes if omitted) |

## Token Creation

```bash
mc create -n "My Token" -s MTK -r HUNT -x 1000000 --curve exponential --initial-price 0.01 --final-price 100
```

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Token name **(required)** |
| `-s, --symbol <sym>` | Token symbol **(required)** |
| `-r, --reserve <addr>` | Reserve token **(required)** |
| `-x, --max-supply <n>` | Maximum supply **(required)** |
| `--curve <type>` | Preset: `linear`, `exponential`, `logarithmic`, `flat` |
| `--initial-price <n>` | Starting price (with `--curve`) |
| `--final-price <n>` | End price (with `--curve`) |
| `-y, --yes` | Skip confirmation |

## Send Tokens

```bash
mc send <to> -a <amount>                # Send ETH
mc send <to> -a <amount> -t <token>     # Send ERC-20
```

## Examples

```bash
# Check SIGNET token price
mc price SIGNET

# Buy 100 SIGNET with its reserve token (HUNT)
mc buy SIGNET -a 100

# Buy SIGNET with ETH (auto-routes: ETH → HUNT → bond)
mc swap -i ETH -o SIGNET -a 0.01

# Swap ETH for HUNT via Uniswap V3
mc swap -i ETH -o HUNT -a 0.01

# Sell 50 SIGNET for ETH
mc swap -i SIGNET -o ETH -a 50

# Create a new token with exponential curve
mc create -n "MyToken" -s MYT -r HUNT -x 1000000 --curve exponential --initial-price 0.01 --final-price 100 -y
```

## Error Handling

Common errors:
- "Insufficient balance" — wallet needs more tokens or ETH for gas
- "No route found" — token pair has no Uniswap liquidity; try a different path
- "TRANSFER_FAILED" — likely an approval issue; the CLI auto-approves but check token permissions

## Links

- [Mint Club V2](https://mint.club) | [Docs](https://docs.mint.club)
- [CLI on npm](https://www.npmjs.com/package/mint.club-cli)
- [GitHub](https://github.com/Steemhunt/mint.club-v2-ai)
- [Community (OnChat)](https://onchat.sebayaki.com/mintclub)
