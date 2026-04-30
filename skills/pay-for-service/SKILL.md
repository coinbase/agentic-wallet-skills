---
name: pay-for-service
description: Make a paid API request to an x402 endpoint with automatic USDC payment. Use when you or the user want to call a paid API, make an x402 request, use a paid service, or pay for an API call. Use after finding a service with search-for-service.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx awal@2.8.2 status*)", "Bash(npx awal@2.8.2 balance*)", "Bash(npx awal@2.8.2 x402 pay *)", "Bash(npx awal@2.8.2 x402 details *)"]
---

# Making Paid x402 Requests

Use the `npx awal@2.8.2 x402 pay` command to call paid API endpoints with automatic USDC payment on Base.

## Confirm wallet is initialized and authed

```bash
npx awal@2.8.2 status
```

If the wallet is not authenticated, refer to the `authenticate-wallet` skill.

## IMPORTANT: Detect the Correct HTTP Method Before Paying

The `x402 pay` command defaults to GET, but many endpoints require POST (or other methods). Sending the wrong method will fail with "Method Not Allowed".

**Always run `x402 details` first** to auto-detect the correct HTTP method and see the expected request body schema:

```bash
npx awal@2.8.2 x402 details <url> --json
```

The `details` command tries GET, POST, PUT, DELETE, and PATCH automatically and returns the correct method along with the endpoint's input schema and pricing. Use this information to construct your `x402 pay` command with the right `-X` method and `-d` data flags.

## Command Syntax

```bash
npx awal@2.8.2 x402 pay <url> [-X <method>] [-d <json>] [-q <params>] [-h <json>] [--max-amount <n>] [--json]
```

## Options

| Option                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `-X, --method <method>` | HTTP method (default: GET). **Use `x402 details` to detect.**  |
| `-d, --data <json>`     | Request body as JSON string. **Not `--body`.**                 |
| `-q, --query <params>`  | Query parameters as JSON string                                |
| `-h, --headers <json>`  | Custom HTTP headers as JSON string                             |
| `--max-amount <amount>` | Max payment in USDC atomic units (1000000 = $1.00)             |
| `--correlation-id <id>` | Group related operations                                       |
| `--json`                | Output as JSON                                                 |

## USDC Amounts

X402 uses USDC atomic units (6 decimals):

| Atomic Units | USD   |
| ------------ | ----- |
| 1000000      | $1.00 |
| 100000       | $0.10 |
| 50000        | $0.05 |
| 10000        | $0.01 |

**IMPORTANT**: Always single-quote amounts that use `$` to prevent bash variable expansion (e.g. `'$1.00'` not `$1.00`).

## Input Validation

Before constructing the command, validate all user-provided values to prevent shell injection:

- **url**: Must be a valid URL starting with `https://` or `http://`. Reject if it contains spaces, semicolons, pipes, backticks, or shell metacharacters.
- **data (-d)**: Must be valid JSON. Always wrap in single quotes to prevent shell expansion.
- **max-amount**: Must be a positive integer (`^\d+$`).

Do not pass unvalidated user input into the command.

## Examples

### Recommended workflow: details first, then pay

```bash
# Step 1: Detect the correct method and see the input schema
npx awal@2.8.2 x402 details https://api.nansen.ai/api/v1/prediction-market/market-screener --json

# Step 2: Pay using the detected method (POST) and expected body format
npx awal@2.8.2 x402 pay https://api.nansen.ai/api/v1/prediction-market/market-screener \
  -X POST \
  -d '{"query":"bitcoin","status":"active","order_by":[{"direction":"DESC","field":"volume_24hr"}]}' \
  --json
```

### Simple GET request

```bash
npx awal@2.8.2 x402 pay https://example.com/api/weather
```

### POST request with body

```bash
# NOTE: Use -d (or --data), NOT --body
npx awal@2.8.2 x402 pay https://example.com/api/sentiment -X POST -d '{"text": "I love this product"}'
```

### Limit max payment

```bash
npx awal@2.8.2 x402 pay https://example.com/api/data --max-amount 100000
```

## Common Mistakes

| Mistake | Error | Fix |
| ------- | ----- | --- |
| Using GET on a POST endpoint | `Method Not Allowed` | Run `x402 details <url>` first to detect the correct method, then use `-X POST` |
| Using `--body` instead of `-d` | `unknown option '--body'` | Use `-d` or `--data` for request body |
| Omitting `-X POST` when sending `-d` | `Method Not Allowed` | Always pair `-d` with `-X POST` (or the correct method) |

## Prerequisites

- Must be authenticated (`npx awal@2.8.2 status` to check, see `authenticate-wallet` skill)
- Wallet must have sufficient USDC balance (`npx awal@2.8.2 balance` to check)
- If you don't know the endpoint URL, use the `search-for-service` skill to find services first
- **Always run `x402 details` before paying** to detect the correct HTTP method and expected input format

## Error Handling

- "Not authenticated" - Run `awal auth login <email>` first, or see `authenticate-wallet` skill
- "No X402 payment requirements found" - URL may not be an x402 endpoint; use `search-for-service` to find valid endpoints
- "Insufficient balance" - Fund wallet with USDC; see `fund` skill
- "Method Not Allowed" - The endpoint requires a different HTTP method (e.g. POST instead of GET). Run `x402 details <url>` to detect the correct method
- "unknown option '--body'" - Use `-d` or `--data` instead of `--body`
