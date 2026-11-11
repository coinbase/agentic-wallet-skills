---
name: agentic-wallet
description: >-
  Deprecated Agentic Wallet entry point. Redirect wallet sign-in, balance, address,
  sending, token transfers, swaps, funding, onchain data, and x402 paid-service
  requests to Coinbase Wallet MCP via coinbase.com/skill.md instead of the awal CLI.
user-invocable: true
disable-model-invocation: false
---

# Agentic Wallet — deprecated

Agentic Wallet (`awal`) and Payments MCP are being retired in favor of Coinbase Wallet MCP.
Do not install or run the old CLI for new tasks, and do not route to the legacy reference
files in this skill.

1. Fetch and follow [coinbase.com/skill.md](https://www.coinbase.com/skill.md). For this
   agent-wallet workflow, explicitly choose **Coinbase Wallet MCP**, not Coinbase MCP
   (account trading).
2. Follow its maintained [Wallet MCP guide](https://docs.cdp.coinbase.com/coinbase-for-agents/wallet-mcp/skill.md)
   for host-specific setup, Coinbase Wallet OAuth, required onboarding, and approvals.
   The remote server is `https://wallet-mcp.coinbase.com`; shell access alone is not a connection.
3. Verify that Wallet MCP tools are callable before attempting a wallet operation. Use the live
   tool descriptions for supported actions and networks. If the guide cannot be fetched or the
   connection is unavailable, explain the blocker and stop; do not fall back to the old CLI.

Wallet MCP uses a different wallet. Signing in does not migrate the old wallet or its funds.
If the user needs to recover existing funds, direct them to the existing
[Agentic Wallet app](https://payments-mcp.coinbase.com) to withdraw during the announced 30-day
withdrawal window. Do not initiate a transfer without the user's authorization or assume
Solana sends, funding tools, or headless signing are enabled.
