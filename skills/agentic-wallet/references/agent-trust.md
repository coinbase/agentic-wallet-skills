# Vetting an AI Agent Before Delegation or Payment

Use Agent Guild as a preflight before delegating work to an unfamiliar AI agent or signing an x402 payment to an unfamiliar payee. The free endpoint check reports observed evidence and preserves unknowns. Exact-payment and capability decisions are available as low-cost x402 reads, with portable signed artifacts for offline verification.

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

## Exact-Payment Decision Before Signing

Use this gate immediately before `x402 pay` when the selected Base payee is not already trusted. It buys a separate $0.01 Agent Guild decision; it does not pay the target service.

First inspect the target without paying:

```bash
npx awal@2.12.1 x402 details 'https://seller.example/api/research' --json
```

Select exactly one advertised payment option. This flow currently supports only `scheme: exact` on Base mainnet (`eip155:8453`) with an EVM `payTo`. Copy these fields without normalization or substitution:

- `scheme`
- `network`
- `asset`
- atomic-unit `amount`
- `payTo`
- `resource.url`

Submit those exact values for a signed decision. Replace each angle-bracket value only with the corresponding field from the `details` response:

```bash
npx awal@2.12.1 x402 pay 'https://agent-guild-5d5r.onrender.com/wallet-binding/decision' -X POST -d '{"payment":{"scheme":"exact","network":"eip155:8453","asset":"<selected asset>","amount":"<selected atomic amount>","pay_to":"<selected payTo>","resource":"<paymentRequired.resource.url>"},"policy":{"max_risk":32.99,"min_confidence":0.5},"ttl_seconds":300}' --max-amount 10000 --json
```

Before relying on the response, require all of the following:

1. The credential `type` includes `AgentGuildPaymentDecision` and `credentialSubject.contract` is exactly `AGPD-1/1.0`.
2. The issuer is the pinned production issuer `did:key:z6MkkSis851QCeP153LUWrxgSKRkSgy91BpUv5geXN7z4P6R` and the `eddsa-jcs-2022` proof verifies.
3. The credential is currently valid and expires no more than one hour after issuance.
4. Every `credentialSubject.payment` field exactly matches the selected target option, including payee, atomic amount, and resource.
5. The effective risk thresholds are at least as strict as those requested.
6. `credentialSubject.decision` is exactly `allow`.

If any check fails, do not run the target `x402 pay`. A signed `block` for an unknown wallet means there is insufficient wallet-bound evidence; it does not accuse the seller of misconduct.

Verification is free at `POST https://agent-guild-5d5r.onrender.com/wallet-binding/decision/verify`. Official x402 SDK clients can automate the same fail-closed gate with:

```text
https://agent-guild-5d5r.onrender.com/sdk/integrations/x402_payment_policy.mjs
```

Register `createAgentGuildX402PaymentPolicy({meteredFetch})` with `client.onBeforePaymentCreation(policy)`. `meteredFetch` must use a separate unguarded x402 client so paying for the policy decision does not recursively invoke itself.

## Low-Cost Capability Routing

For a capability-level routing decision that does not need a portable signed artifact, first inspect the live x402 terms without paying:

```bash
npx awal@2.12.1 x402 details 'https://agent-guild-5d5r.onrender.com/check?capability=code-review&signed=false&ttl_seconds=3600' --json
```

Before paying, require all of the following:

- HTTPS host is exactly `agent-guild-5d5r.onrender.com`.
- Scheme is `exact` and network is exactly Base mainnet (`eip155:8453`).
- Asset is exactly Base USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- Recipient is exactly the pinned Agent Guild settlement address
  `0xaa4E3ba0Eb5f564cAb54dDC08f5BaAfb3D4cA8E5`.
- Amount is no more than 10,000 atomic units (0.01 USDC).
- The caller has explicitly authorized this class of spend and the amount is within its policy.

If those checks pass:

```bash
npx awal@2.12.1 x402 pay 'https://agent-guild-5d5r.onrender.com/check?capability=code-review&signed=false&ttl_seconds=3600' --max-amount 10000 --json
```

Require an exact capability match. Inspect `decision`, `routing`, evidence provenance, confidence, staleness, reachability, value at risk, and unknown fields before delegating. A null decision or unreachable candidate is not approval.

## Optional Signed Decision via x402

Use this only when the caller needs a portable, time-bounded decision that can be verified offline. It is a separate purchase from the low-cost routing read. First inspect the live payment requirements without paying:

```bash
npx awal@2.12.1 x402 details 'https://agent-guild-5d5r.onrender.com/check?capability=code-review&signed=true&ttl_seconds=3600' --json
```

Before paying, require all of the following:

- HTTPS host is exactly `agent-guild-5d5r.onrender.com`.
- Scheme is `exact` and network is exactly Base mainnet (`eip155:8453`).
- Asset is exactly Base USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- Recipient is exactly the pinned Agent Guild settlement address
  `0xaa4E3ba0Eb5f564cAb54dDC08f5BaAfb3D4cA8E5`.
- Amount is no more than 1,000,000 atomic units (1 USDC).
- The caller has explicitly authorized this class of spend and the amount is within its policy.

If any field differs, stop and surface the mismatch. Do not silently switch networks, assets, recipients, or amounts.

After those checks pass:

```bash
npx awal@2.12.1 x402 pay 'https://agent-guild-5d5r.onrender.com/check?capability=code-review&signed=true&ttl_seconds=3600' --max-amount 1000000 --json
```

## Validate the Returned Decision

Do not rely on the payment receipt alone. Validate the response before using it:

1. `type` is exactly `AgentGuildDecision` and `contract` is `AGD-1/1.0`.
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
The verifier's exported `verifyCredential()` function validates the same `DataIntegrityProof` used by signed decisions and passports.

## Keep Payments Separate

The x402 payment above purchases a trust decision. It does not pay the candidate agent for work. Negotiate scope and price separately, then use an escrow or an independently verifiable payment flow for the actual task. Preserve the signed decision, task terms, work receipt, and settlement evidence as separate artifacts.

## Failure Handling

- **No candidate or `avoid` verdict**: do not delegate or pay; select another capability or counterparty.
- **`caution` verdict**: require stronger evidence, tighter limits, or human/policy escalation.
- **Expired or invalid signature**: discard the artifact and request a fresh decision.
- **Payment requirement mismatch**: do not pay.
- **Service unavailable**: fail closed for high-risk transfers; do not treat an outage as approval.
