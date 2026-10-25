# Coinbase Agentic Wallet Skills

[Agent Skills](https://agentskills.io) for crypto wallet operations. These skills enable AI agents to authenticate, send USDC, trade tokens and more using the [`awal`](https://www.npmjs.com/package/awal) CLI.

The optional cross-chain funding comparison is the sole exception: it calls the
independent third-party AssetFare public API directly for a read-only quote,
validates its unranked `continuation_v3`, and explains—but never performs—the
local explicit selection → exact v3 bounds/mode → exactly-one-path sequence. It
is not an `awal` capability or a Coinbase affiliation/endorsement, and it never
executes a bridge, swap, signature, or transaction.

## What it does

A single skill — [`agentic-wallet`](./skills/agentic-wallet/SKILL.md) — that routes the agent to topic-specific reference docs in [`./skills/agentic-wallet/references/`](./skills/agentic-wallet/references/):

| Capability | Reference |
| --- | --- |
| Sign in via email OTP | [`auth.md`](./skills/agentic-wallet/references/auth.md) |
| Check wallet balances across Base, Polygon, and Solana | [`balance.md`](./skills/agentic-wallet/references/balance.md) |
| Send USDC / ETH / POL / SOL on Base, Polygon, or Solana | [`send-usdc.md`](./skills/agentic-wallet/references/send-usdc.md) |
| Swap / trade tokens on Base or Polygon | [`trade.md`](./skills/agentic-wallet/references/trade.md) |
| Add funds via Coinbase Onramp | [`fund.md`](./skills/agentic-wallet/references/fund.md) |
| Compare an optional third-party AssetFare Solana↔Base aggregate funding route read-only, then explain the separate caller-owned unsigned-plan path only after explicit approval | [`crosschain-funding-quote.md`](./skills/agentic-wallet/references/crosschain-funding-quote.md) |
| Search the x402 bazaar for paid API services | [`x402-search.md`](./skills/agentic-wallet/references/x402-search.md) |
| Pay an x402 endpoint with automatic USDC payment | [`x402-pay.md`](./skills/agentic-wallet/references/x402-pay.md) |
| Build and deploy a paid API server (x402) | [`x402-monetize.md`](./skills/agentic-wallet/references/x402-monetize.md) |
| Query onchain data on Base via the CDP SQL API | [`query-onchain.md`](./skills/agentic-wallet/references/query-onchain.md) |

## Installation

Install with [Vercel's Skills CLI](https:/skills.sh):

```bash
npx skills add coinbase/agentic-wallet-skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```text
Sign-in to my wallet with me@email.com
```

```text
Send 10 USDC to barmstrong.eth
```

## Contributing

To add a new capability:

1. Create a new markdown file in `./skills/agentic-wallet/references/`
2. Add a row to the routing table in `./skills/agentic-wallet/SKILL.md` describing when the agent should read it
3. If the capability needs a new shell tool, add it to `allowed-tools` in `SKILL.md` frontmatter

See the [Agent Skills specification](https://agentskills.io/specification) for the complete format.

### Updating the `awal` version

The `awal` CLI version is pinned in every code block in `SKILL.md` and the reference docs. When a new version is published to npm, run:

```bash
# Make sure you're using Node v22+
node ./scripts/bump-awal.js
```

This fetches the latest version from the npm registry and rewrites every `awal@<version>` reference under `./skills/`.

## License

MIT
