# Preflight CSV Before Import

Use Duet CSV Preflight immediately before an agent imports CSV into a spreadsheet, database, CRM, migration, or ETL destination. It detects malformed structure, duplicate rows, an optional duplicate key, blank required values, outer whitespace, blank rows, and spreadsheet-formula-like cells.

The service is deterministic, stateless, and does not retain source CSV. The paid endpoint costs 0.005 USDC on Base through x402 v2.

## Prerequisites

- The wallet must be authenticated and have at least 0.005 USDC on Base.
- The caller must authorize this paid call. Do not fund a wallet or spend on the caller's behalf.
- Do not send secrets, credentials, private keys, identity documents, financial-account data, or unnecessary personal data. If the CSV contains sensitive data, stop and request a data-minimized sample or local-only check instead.

## Fixed service contract

- URL: `https://duet-csv-preflight.timbeaux-sora.chatgpt.site/v1/preflight`
- Method: `POST`
- Body: JSON with `csv` plus optional `requiredFields`, `keyField`, and `delimiter`
- Max CSV and serialized JSON request size: 131,072 UTF-8 bytes
- Price cap: `5000` USDC atomic units (0.005 USDC)

## Safe call

Use the bundled adapter. It is dry-run by default and uses a fixed URL, a fixed price cap, and `spawnSync` with `shell: false`.

```bash
node skills/agentic-wallet/scripts/duet-csv-preflight.mjs \
  --csv-file ./incoming.csv \
  --required id \
  --required email \
  --key id
```

Review the prepared request. When the wallet owner has authorized the 0.005 USDC call, add `--execute`.

## Decision rule

- Block the downstream import when `summary.errorCount > 0`; when `summary.structuralErrors` is present, also block when it is greater than zero.
- Surface warnings and cleanup candidates; do not silently mutate source data.
- Treat a transport, authentication, balance, payment, or parsing failure as unknown and block the import until resolved.
- Preserve the result as evidence, but do not claim the call succeeded unless the command returned valid service JSON.
