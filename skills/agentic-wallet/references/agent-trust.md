# Vetting an AI Agent Before Delegation or Payment

Use Agent Guild as a preflight before delegating work to an unfamiliar AI agent or sending it funds. The free checks report observed evidence and preserve unknowns; an optional x402 call returns a short-lived, signed capability decision.

Agent Guild is an independent third-party service, not a Coinbase endorsement. Treat its decision as one input to your policy, not a guarantee of performance.

## Input Validation

Before placing a user-provided value in a shell command:

- **capability**: lowercase letters, numbers, and hyphens only (`^[a-z0-9-]{1,64}$`).
- **endpoint URL**: must start with `https://` and contain no spaces, semicolons, pipes, backticks, control characters, or other shell metacharacters. Percent-encode it before adding it to a query string.
- Reject rather than repair invalid input.

Do not pass unvalidated input into a command.

## Free Endpoint Preflight

If the candidate publishes an HTTPS endpoint, check what can be proved without payment:

```bash
curl 'https://agent-guild-5d5r.onrender.com/preflight?url=https%3A%2F%2Fexample.com%2Fa2a'
```

Inspect the structured checks individually. Do not convert `unknown` payment, identity, or external-evidence fields into a pass. A reachable endpoint is not proof that the operator is trustworthy.

## Free Capability Check

For a capability-level routing decision that does not need a signed artifact:

```bash
curl 'https://agent-guild-5d5r.onrender.com/check?capability=code-review'
```

Require an exact capability match. Inspect the verdict, ranked candidates, evidence, checkpoint, and uncertainty before delegating.

## Optional Signed Decision via x402

Use this only when the caller needs a portable, time-bounded decision that can be verified offline. First inspect the live payment requirements without paying:

```bash
npx awal@2.12.1 x402 details 'https://agent-guild-5d5r.onrender.com/check?capability=code-review&signed=true&ttl_seconds=3600' --json
```

Before paying, require all of the following:

- HTTPS host is exactly `agent-guild-5d5r.onrender.com`.
- Network is Base mainnet, scheme is `exact`, and the asset is Base USDC.
- Amount is no more than 1,000,000 atomic units (1 USDC).
- The caller has explicitly authorized this class of spend and the amount is within its policy.

If any field differs, stop and surface the mismatch. Do not silently switch networks, assets, recipients, or amounts.

After those checks pass:

```bash
npx awal@2.12.1 x402 pay 'https://agent-guild-5d5r.onrender.com/check?capability=code-review&signed=true&ttl_seconds=3600' --max-amount 1000000 --json
```

## Validate the Returned Decision

Do not rely on the payment receipt alone. Validate the response before using it:

1. `type` includes `AgentGuildDecision` and `contract` is `AGD-1/1.0`.
2. `capability` exactly matches the requested capability.
3. `issued_at` is not in the future and `valid_until` is still in the future.
4. `issuer` is the pinned production issuer:
   `did:key:z6MkkSis851QCeP153LUWrxgSKRkSgy91BpUv5geXN7z4P6R`.
5. The `eddsa-jcs-2022` data-integrity proof verifies over the complete decision.
6. The verdict, routing evidence, checkpoint, and unknown fields satisfy the caller's own delegation policy.

The zero-dependency Node verifier is published at:

```text
https://agent-guild-5d5r.onrender.com/sdk/agentguild_verify.mjs
```

Pin or vendor a reviewed copy before relying on it. A verifier or issuer change requires re-review; do not auto-accept a new key.

## Keep Payments Separate

The x402 payment above purchases a trust decision. It does not pay the candidate agent for work. Negotiate scope and price separately, then use an escrow or an independently verifiable payment flow for the actual task. Preserve the signed decision, task terms, work receipt, and settlement evidence as separate artifacts.

## Failure Handling

- **No candidate or `avoid` verdict**: do not delegate or pay; select another capability or counterparty.
- **`caution` verdict**: require stronger evidence, tighter limits, or human/policy escalation.
- **Expired or invalid signature**: discard the artifact and request a fresh decision.
- **Payment requirement mismatch**: do not pay.
- **Service unavailable**: fail closed for high-risk transfers; do not treat an outage as approval.
