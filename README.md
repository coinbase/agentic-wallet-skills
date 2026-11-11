# Coinbase Agentic Wallet Skills

> **Deprecated:** Agentic Wallet (`awal`) and Payments MCP are being retired in favor of
> [Coinbase Wallet MCP](https://docs.cdp.coinbase.com/coinbase-for-agents/wallet-mcp/skill.md).
> For new wallet tasks, start at [coinbase.com/skill.md](https://www.coinbase.com/skill.md)
> and follow **Coinbase Wallet MCP**, not Coinbase MCP (account trading).

## Use Coinbase Wallet MCP

Fetch and follow the maintained [Coinbase skill](https://www.coinbase.com/skill.md), choosing
**Coinbase Wallet MCP** for agent-wallet and onchain tasks. It connects to
`https://wallet-mcp.coinbase.com` using Coinbase Wallet OAuth. Follow the linked
[Wallet MCP setup guide](https://docs.cdp.coinbase.com/coinbase-for-agents/wallet-mcp/skill.md)
for your app, required onboarding, supported tools, and payment approvals.

The [`agentic-wallet` skill](./skills/agentic-wallet/SKILL.md) now points agents to that
maintained entry point instead of installing or running the `awal` CLI. Previously installed
copies do not update automatically; replace or re-fetch the old skill before using it.

## Existing wallets and funds

Wallet MCP uses a different wallet from the CDP embedded wallet used by Agentic Wallet.
Signing in to Wallet MCP does **not** move your funds. You must withdraw or transfer them
yourself, checking the receiving address and network before sending.

Use the existing [Agentic Wallet app](https://payments-mcp.coinbase.com) to withdraw during the
30-day withdrawal window announced with the sunset. Do not add funds to the retiring wallet.
Check the current Wallet MCP guide and live tools before transferring assets: receiving an
asset does not mean that sending it is enabled, particularly on Solana.

The old files in [`references/`](./skills/agentic-wallet/references/) are retained for legacy
reference, not as setup or payment instructions for new tasks. This repository will be
archived at shutdown.

## Contributing

This repository is deprecated. Direct new wallet setup and usage improvements to the
maintained Wallet MCP guide linked above rather than adding CLI capabilities here.

## License

MIT
