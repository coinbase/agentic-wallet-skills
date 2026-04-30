---
name: defi-dapp-search
description: Discover DeFi protocols, dapps, and yield opportunities — primarily on Base — using the free DefiLlama public API and the x402 bazaar. Use when the user wants to find a DeFi protocol, look up TVL, find lending/DEX/yield options, see what dapps exist on Base, or discover paid DeFi services on the bazaar.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(curl -s https://api.llama.fi/*)", "Bash(curl -s https://yields.llama.fi/*)", "Bash(curl -s https://stablecoins.llama.fi/*)", "Bash(npx awal@2.8.2 status*)", "Bash(npx awal@2.8.2 x402 bazaar*)"]
---

# DeFi Dapp Discovery (DefiLlama + x402 Bazaar)

This skill searches and browses DeFi protocols using **DefiLlama's free public API** (no key required) and surfaces paid DeFi services from the **x402 bazaar**. It is **discovery-only**: it tells you what protocols exist, their TVL, chains, audits, and yields. It does not interact with protocols — that requires per-protocol contract bindings the `awal` CLI does not currently expose.

For raw onchain activity numbers (e.g. recent swap counts on a specific protocol), pair this skill with `onchain-analysis`.

## When to use this skill

- "What DeFi protocols are on Base?"
- "Find a lending protocol with > $100M TVL"
- "What's the highest-yield USDC pool on Base?"
- "Tell me about Aerodrome — TVL, chains, audits"
- "Are there any paid DeFi APIs on the x402 bazaar?"

## Cost

- DefiLlama queries: **free** (no API key, no x402 payment)
- Bazaar search: **free**
- Optional enrichment via `onchain-analysis`: $0.10/query

## Input Validation

- **Slug / protocol name**: lowercase, alphanumeric and hyphens only (`^[a-z0-9-]+$`). Reject shell metacharacters.
- **Chain name**: one of `base`, `ethereum`, `arbitrum`, `optimism`, `polygon`, `solana`, etc. — pass through to DefiLlama, but reject shell metacharacters first.
- **Category**: one of `Dexes`, `Lending`, `Yield`, `Liquid Staking`, `CDP`, `Yield Aggregator`, `Bridge`, `Derivatives` (DefiLlama's official categories). Reject free-form input.
- **Numeric thresholds** (TVL min, APY min): positive numbers only. Use `printf '%g'` to sanitize before substitution.

Always wrap user input in single quotes inside the URL and never construct URLs with `$variable` directly in double-quoted strings.

---

## 1. `find-dapps` — Search protocols by name or symbol

DefiLlama doesn't have a dedicated search endpoint, so we list-and-filter client-side. List is ~3,000 protocols (~1.5 MB) — cache the result during the session if doing multiple searches.

```bash
curl -s 'https://api.llama.fi/protocols' \
  | jq --arg q '<query>' '
      [.[] | select(
        (.name | ascii_downcase | contains($q | ascii_downcase)) or
        (.symbol // "" | ascii_downcase | contains($q | ascii_downcase))
      )]
      | sort_by(-.tvl)
      | .[0:10]
      | map({name, symbol, slug, category, chains, tvl, url})
    '
```

Returns up to 10 matches sorted by TVL (highest first) with the protocol slug for follow-up detail queries.

---

## 2. `top-dapps-on-base` — Highest-TVL protocols on Base

```bash
curl -s 'https://api.llama.fi/protocols' \
  | jq --arg cat '<category-or-empty>' '
      [.[]
       | select(.chains | index("Base"))
       | select($cat == "" or .category == $cat)
      ]
      | sort_by(-.chainTvls.Base)
      | .[0:20]
      | map({name, slug, category, base_tvl: .chainTvls.Base, total_tvl: .tvl, url})
    '
```

**Parameters:** `category` (default empty = all categories), `limit` (default 20)

Categories common on Base: `Dexes`, `Lending`, `Yield`, `Liquid Staking`, `CDP`, `Yield Aggregator`, `Derivatives`, `Bridge`.

---

## 3. `dapp-detail` — Full metadata for a protocol

```bash
curl -s 'https://api.llama.fi/protocol/<slug>' \
  | jq '{
      name, symbol, category, url, twitter, audits, audit_links, audit_note,
      chains,
      currentTvl: (.currentChainTvls // {}),
      description,
      governanceID,
      treasury,
      methodology
    }'
```

Use the `slug` returned from `find-dapps` or `top-dapps-on-base`. Surface to the user:

- **TVL by chain** (`currentTvl`)
- **Audits** (number, with links)
- **Category** and methodology note
- **Governance** and treasury links if present

If `audits == "0"` or audit_links is empty, flag this prominently — unaudited protocols are higher risk.

---

## 4. `yield-opportunities-on-base` — Top APY pools on Base

```bash
curl -s 'https://yields.llama.fi/pools' \
  | jq --arg minTvl '<min-tvl-usd>' --arg minApy '<min-apy>' '
      [.data[]
       | select(.chain == "Base")
       | select(.tvlUsd >= ($minTvl | tonumber))
       | select(.apy >= ($minApy | tonumber))
      ]
      | sort_by(-.apy)
      | .[0:20]
      | map({project, symbol, pool: .pool, tvlUsd, apy, apyBase, apyReward, ilRisk, exposure, stablecoin})
    '
```

**Parameters:** `min_tvl` (default `100000` = $100k floor to filter dust pools), `min_apy` (default `0`), `limit` (default 20).

After filtering, surface:

- **Stablecoin pools** separately (lower IL risk) — those with `stablecoin: true`
- **`ilRisk: "yes"` pools** flagged as higher risk
- **`apyReward` vs. `apyBase` ratio** — high reward share = mercenary capital, may not last

---

## 5. `bazaar-defi-services` — Paid DeFi services on x402

```bash
npx awal@2.8.2 x402 bazaar search '<query>' -k 20 --network base --json
```

Useful queries: `defi`, `tvl`, `lending`, `yield`, `dex`, `liquidity`, `aerodrome`, `uniswap`, `morpho`, etc. Results are ranked by CDP's vector search.

This complements DefiLlama by surfacing services that go beyond public data (e.g. paid signal feeds, alpha-tier yield discovery, custom risk scores). The bazaar is also where to look for an **agent-callable** version of a protocol if one exists.

---

## 6. Optional: onchain activity verification

When the user wants to verify a protocol's recent activity (not just TVL), pair this skill with `onchain-analysis`:

- Use `top-pools` to see if the protocol's pools are actively trading.
- Use `contract-activity` against a specific contract to see what events fire.

Example: DefiLlama says Aerodrome has $X TVL on Base, but you want to know if it's actually being used — run `contract-activity` on the Aerodrome router and you'll see Swap event volume in real time.

---

## Risk callouts to surface to the user

When showing results, always include these signals when relevant:

1. **Audit status** — number of audits and whether links are valid. No audits = high risk.
2. **TVL trend** — DefiLlama `chainTvls` shows current. For trend, fetch `https://api.llama.fi/protocol/<slug>` and look at `tvl[]` time series. Flag protocols where TVL has dropped > 50% in the last 30 days.
3. **Category red flags** — `Yield Aggregator` and `CDP` carry leverage / smart-contract risk above passive DEX LP.
4. **Reward dependency** — for yield pools, if `apyReward > 2 * apyBase`, the headline APY is being inflated by emissions and will collapse if rewards stop.
5. **Chain exposure** — protocols spanning many chains may have bridge risk; surface `chains.length` if > 3.

## Caveats

1. **DefiLlama is a snapshot.** TVL and APY update on a delay (typically minutes to an hour). Not safe for execution decisions on volatile pools.
2. **Free tier rate limits.** DefiLlama's public API does not require a key but is rate-limited. Avoid loops — fetch once and filter client-side with `jq`.
3. **No interaction layer.** This skill discovers; it does not call protocols. Once the upstream CLI gains a generic contract-call primitive (see related issue thread), this skill can grow an `interact` analysis.
4. **No price oracle.** Pool TVL is in USD per DefiLlama, but token prices may differ from the wallet's view. For execution-grade prices, use a price API.

## Prerequisites

- `curl` available in PATH (standard on macOS / most Linux)
- `jq` available in PATH (standard on macOS via Homebrew, or `brew install jq`)
- For the bazaar query: `awal` CLI per the `authenticate-wallet` skill (auth not strictly required for `bazaar search`, but the binary must be available)

## Error Handling

- `curl: (6) Could not resolve host: api.llama.fi` — network issue; retry once, then surface to user.
- `jq: error` — input not JSON; DefiLlama may have returned HTML for rate-limit / outage. Surface the raw response and stop.
- DefiLlama returns 429 — backoff at least 60 seconds before retry. Do not loop.
- Empty results — relax filter thresholds (`min_tvl`, `min_apy`) or broaden the search query.

## Future extension

When the upstream CLI ships a generic contract-call primitive (`awal call <contract> <method> <args>`, see related discussion), this skill can grow:

- `simulate-deposit <protocol> <amount>` — query expected output / share price before depositing
- `estimate-yield <protocol> <amount>` — combine pool APY × position size

Until then, those flows require external tools.
