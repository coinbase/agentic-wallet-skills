---
name: register-agent-identity
description: Register your agent's onchain identity on Helixa AgentDNA (ERC-8004). Use when you want to create an identity, get an agent NFT, register onchain, get an .agent name, add traits, or establish onchain reputation. Covers phrases like "register my identity", "mint my agent", "get an .agent name", "who am I onchain", or "add traits".
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx awal@latest status*)", "Bash(npx awal@latest send *)", "Bash(cast call *)", "Bash(cast send *)"]
---

# Register Agent Identity on Helixa

Give your agent a portable onchain identity using Helixa AgentDNA — the ERC-8004 identity protocol on Base.

## What You Get

- ERC-8004 compliant identity NFT on Base
- Traits, personality, and reputation stored onchain
- Optional `.agent` name (e.g. `mybot.agent`)
- Early adopter points (2x for first 100 agents) → future token allocation
- Shows up on OpenSea, Helixa Directory, and any ERC-8004 compatible service

## Prerequisites

1. Your wallet must be authenticated: `npx awal@latest status`
2. You need a tiny amount of ETH on Base for gas (~$0.003 per transaction)
3. The mint itself is **FREE** for the first 100 agents

## Contract Details

- **AgentDNA Contract**: `0x665971e7bf8ec90c3066162c5b396604b3cd7711` (Base mainnet)
- **AgentNames Contract**: `0xDE8c422D2076CbAE0cA8f5dA9027A03D48928F2d` (Base mainnet)

⚠️ **IMPORTANT**: Do NOT call `totalSupply()` or `paused()` — they will revert. Use `totalAgents()` instead.

## Step 1: Check Current Stats

```bash
# Check how many agents have been minted
cast call 0x665971e7bf8ec90c3066162c5b396604b3cd7711 "totalAgents()(uint256)" --rpc-url https://mainnet.base.org

# Check current mint price (0 = free beta)
cast call 0x665971e7bf8ec90c3066162c5b396604b3cd7711 "mintPrice()(uint256)" --rpc-url https://mainnet.base.org
```

## Step 2: Build Your Metadata

Create a metadata JSON for your agent:

```json
{
  "name": "YOUR_AGENT_NAME",
  "description": "What your agent does",
  "image": "",
  "external_url": "https://helixa.xyz/directory.html",
  "attributes": [
    { "trait_type": "framework", "value": "agentic-wallet" },
    { "trait_type": "model", "value": "your-model" },
    { "trait_type": "capabilities", "value": "trading,payments,research" }
  ]
}
```

Base64 encode it as a data URI: `data:application/json;base64,<base64-encoded-json>`

## Step 3: Mint Your Identity

```bash
# Get your wallet address
npx awal@latest status

# Mint (replace values)
cast send 0x665971e7bf8ec90c3066162c5b396604b3cd7711 \
  "mint(address,string,string,string,bool,uint256)" \
  YOUR_WALLET_ADDRESS \
  "YourAgentName" \
  "agentic-wallet" \
  "data:application/json;base64,YOUR_BASE64_METADATA" \
  true \
  115792089237316195423570985008687907853269984665640564039457584007913129639935 \
  --rpc-url https://mainnet.base.org \
  --value $(cast call 0x665971e7bf8ec90c3066162c5b396604b3cd7711 "mintPrice()(uint256)" --rpc-url https://mainnet.base.org)
```

Parameters:
- `address`: Your agent's wallet address
- `name`: Your agent's display name
- `framework`: Use `"agentic-wallet"` for Coinbase Agentic Wallet agents
- `tokenURI`: Your metadata as a data URI
- `soulbound`: `true` for non-transferable (recommended), `false` for transferable
- `parentTokenId`: Use max uint256 (the big number above) for no parent

## Step 4: Register a .agent Name (Optional)

```bash
# Check if a name is available
cast call 0xDE8c422D2076CbAE0cA8f5dA9027A03D48928F2d \
  "available(string)(bool)" "yourname" \
  --rpc-url https://mainnet.base.org

# Register the name
cast send 0xDE8c422D2076CbAE0cA8f5dA9027A03D48928F2d \
  "register(string)" "yourname" \
  --rpc-url https://mainnet.base.org
```

Names must be: lowercase a-z, 0-9, hyphens, 3-32 characters, no leading/trailing hyphens.

## Step 5: Add Traits (Recommended)

Each trait earns 10 bonus points (20 during 2x beta multiplier):

```bash
# Add personality trait
cast send 0x665971e7bf8ec90c3066162c5b396604b3cd7711 \
  "addTrait(uint256,string,string)" YOUR_TOKEN_ID "temperament" "analytical" \
  --rpc-url https://mainnet.base.org

# Add a skill
cast send 0x665971e7bf8ec90c3066162c5b396604b3cd7711 \
  "addTrait(uint256,string,string)" YOUR_TOKEN_ID "skill" "defi-trading" \
  --rpc-url https://mainnet.base.org
```

Recommended traits:
- `temperament`: analytical, creative, aggressive, cautious, chaotic
- `communication`: formal, casual, snarky, verbose, minimal
- `alignment`: lawful-good, neutral-good, chaotic-good, true-neutral, etc.
- `specialization`: trader, researcher, creator, guardian, oracle, operator
- `skill`: any freeform string describing a capability
- `model`: the LLM model powering the agent

## Step 6: Verify Your Identity

```bash
# Look up your agent by token ID
cast call 0x665971e7bf8ec90c3066162c5b396604b3cd7711 \
  "getAgent(uint256)" YOUR_TOKEN_ID \
  --rpc-url https://mainnet.base.org

# Check your points
cast call 0x665971e7bf8ec90c3066162c5b396604b3cd7711 \
  "getPoints(uint256)(uint256)" YOUR_TOKEN_ID \
  --rpc-url https://mainnet.base.org
```

## Pricing

| Agents Minted | Mint Price |
|---|---|
| 0-100 | FREE |
| 101-500 | 0.005 ETH |
| 501-1000 | 0.01 ETH |
| 1001+ | 0.02 ETH |

## Points System

| Action | Points (2x during beta) |
|---|---|
| Mint | 100 (200) |
| Add Trait | 10 (20) |
| Mutate | 50 (100) |
| Referral | 25 (50) |

Points convert to token allocation at TGE.

## Links

- 🌐 [helixa.xyz](https://helixa.xyz)
- 📖 [Agent Directory](https://helixa.xyz/directory.html)
- 🧬 [Full Skill Reference](https://helixa.xyz/skill.md)
- 🐦 [@HelixaXYZ](https://x.com/HelixaXYZ)
