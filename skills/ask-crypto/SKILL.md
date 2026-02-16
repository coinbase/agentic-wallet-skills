````markdown
---
name: ask-crypto
description: Ask Velvet Unicorn (VelvetDAO) for AI-powered crypto answers (token analysis, wallet analysis, market/trade commentary). Use when the user asks “what do you think about $TOKEN?”, “analyze this wallet”, “should I buy/sell”, “summarize risk/momentum”, or wants structured crypto intelligence beyond simple price lookups. Returns { meta_category, vu_category, answer, txdata } (txdata is a proposal only; never executed by this skill).
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(curl *)"]
---

# ask-crypto (Velvet Unicorn)

This skill calls the Velvet Unicorn `/ask` endpoint to answer natural-language crypto questions about:
- Tokens & protocols (fundamentals, narrative, risk)
- Wallet analysis (exposure, behavior, patterns)
- Trading / “should I buy/sell” analysis (may return **proposed** transaction intent data)

Default endpoint: `https://gentweet.velvetdao.xyz/ask`

## Safety & Boundaries (important)
- This skill is **read-only**: it does not sign, send, trade, or broadcast transactions.
- If `txdata` is returned, treat it as **proposed transaction data only**.
- Never claim a transaction happened.
- If the user wants execution, hand off to the appropriate wallet execution skill after getting explicit confirmation.

## Inputs

Send JSON in this shape:

```json
{
  "question": "string",
  "context": "string",
  "userid": "string | null",
  "userid_sol": "string | null",
  "previous_questions": ["string", "..."]
}
````

Guidance:

* `question` (required): the user’s question
* `context` (optional): risk tolerance, timeframe, constraints, etc.
* `userid` (optional): EVM address (0x...) for wallet analysis
* `userid_sol` (optional): Solana address if relevant (otherwise null/empty)
* `previous_questions` (optional): short list of prior related questions

## How to Call

### Using curl (preferred)

Set environment variables (recommended):

* `ASK_CRYPTO_ENDPOINT` (optional) — defaults to `https://gentweet.velvetdao.xyz/ask`
* `ASK_CRYPTO_API_KEY` (optional) — if required by your deployment; sent as `Authorization: Bearer <key>`

```bash
ENDPOINT="${ASK_CRYPTO_ENDPOINT:-https://gentweet.velvetdao.xyz/ask}"

curl -sS "$ENDPOINT" \
  -H "Content-Type: application/json" \
  ${ASK_CRYPTO_API_KEY:+-H "Authorization: Bearer $ASK_CRYPTO_API_KEY"} \
  -d '{
    "question": "Analyze ARB and summarize risk + momentum",
    "context": "User is interested in short-term swing trades; medium risk tolerance.",
    "userid": "0xYourEvmWallet",
    "userid_sol": "",
    "previous_questions": ["compare ARB to OP", "what is the downside risk?"]
  }'
```

## Expected Response

The endpoint is expected to return JSON shaped like:

```json
{
  "meta_category": 0,
  "vu_category": 1,
  "answer": "string",
  "txdata": { "...": "..." }
}
```

Interpretation:

* `answer`: show this to the user (summarize if long, but don’t distort meaning)
* `txdata`: may be `null` or `{}`; if present, it is a **proposal** (not executed)

## How to Respond to the User

1. Return the `answer` clearly and directly.
2. If `txdata` is present:

   * Say explicitly it’s **proposed** transaction data.
   * Ask for explicit confirmation before any execution.
   * If the user confirms, pass the intent to an execution skill (e.g., trade/send) rather than executing here.

## Examples of When to Use

* “What do you think about SOL right now?”
* “Analyze this wallet: 0xabc…”
* “Should I rotate from UNI into ARB?”
* “Summarize risks for OP vs ARB over 3 months”

## Examples of When NOT to Use

* “Send 10 USDC to vitalik.eth” → use `send-usdc`
* “Swap 50 USDC to ETH” → use `trade`
* “I can’t trade, it says not signed in” → use `authenticate-wallet`

```

::contentReference[oaicite:0]{index=0}
```
