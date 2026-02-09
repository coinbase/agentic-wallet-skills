# Coinbase Agent Wallet Skills

[Agent Skills](https://agentskills.io) for crypto wallet operations. These skills enable AI agents to authenticate, send USDC, trade tokens and more using the [`awal`](https://www.npmjs.com/package/awal) CLI.

## Available Skills

| Skill | Description |
| ----- | ----------- |
| [authenticate-wallet](./skills/authenticate-wallet/SKILL.md) | Email OTP authentication flow for wallet sign-in |
| [fund](./skills/fund/SKILL.md) | Add money to wallet via Coinbase Onramp |
| [send-usdc](./skills/send-usdc/SKILL.md) | Transfer USDC to Ethereum addresses or ENS names |
| [trade](./skills/trade/SKILL.md) | Swap tokens on Base network (USDC, ETH, WETH) |

## Installation

Install with [Vercel's Skills CLI](https:/skills.sh):

```bash
npx skills add coinbase/agent-wallet-skills
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
