# Coinbase Agentic Wallet Skills

[Agent Skills](https://agentskills.io) for crypto wallet operations. These skills enable AI agents to authenticate, send USDC, trade tokens and more using the [`awal`](https://www.npmjs.com/package/awal) CLI.

## Available Skills

| Skill | Description |
| ----- | ----------- |
| [authenticate-wallet](./skills/authenticate-wallet/SKILL.md) | Sign in to the wallet via email OTP |
| [fund](./skills/fund/SKILL.md) | Add money to the wallet via Coinbase Onramp |
| [send-usdc](./skills/send-usdc/SKILL.md) | Send USDC to Ethereum addresses or ENS names |
| [trade](./skills/trade/SKILL.md) | Swap/trade tokens on Base (USDC, ETH, WETH) |
| [search-for-service](./skills/search-for-service/SKILL.md) | Search the x402 bazaar for paid API services |
| [pay-for-service](./skills/pay-for-service/SKILL.md) | Make paid API requests via x402 |
| [monetize-service](./skills/monetize-service/SKILL.md) | Build and deploy a paid API that other agents can use via x402 |

## Installation

Install with [Vercel's Skills CLI](https:/skills.sh):

```bash
npx skills add coinbase/agentic-wallet-skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**
```
Sign-in to my wallet with me@email.com 
```
```
Send 10 USDC to barmstrong.eth
```

## Contributing

To add a new skill:

1. Create a folder in `./skills/` with a lowercase, hyphenated name
2. Add a `SKILL.md` file with YAML frontmatter and instructions

See the [Agent Skills specification](https://agentskills.io/specification) for the complete format.

## License

MIT
