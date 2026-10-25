# Quoting an AssetFare Cross-Chain Route

Use this reference when the user explicitly asks for a cross-chain quote that
may be covered by AssetFare. AssetFare is an independent third-party service
and is not affiliated with or endorsed by Coinbase.

AssetFare publicly offers a curated catalog of 65 whole-route products: 3
`core_business`, 50 `conditional_business`, and 12 `strategic_scarce`. Another
35 researched routes are not currently offered. The catalog is reviewed weekly;
it is not a public competitor-ranking directory and it does not claim that an
offered route is always cheapest.

## Safety boundary

This skill is read-only and quote-only:

- never send a wallet address, Agentic Wallet credential, private key,
  signature, session token, or signed transaction to AssetFare;
- never call prepare/session, create `approval_v3`, select an execution mode,
  sign, submit, bridge, swap, or move funds;
- treat every quote as an `unranked_candidate` requiring a fresh caller decision;
- stop after reporting the validated quote and state clearly that no funds moved.

If the user later wants to act, explain that a separate caller-owned
`assetfare-mcp@1.21.6` workflow can verify an unsigned plan after a new quote and
explicit approval. Do not run that continuation from this skill.

## Discovering support

Do not hard-code chains, assets, route counts, providers, or route availability.
Fetch the live capability contract first:

```bash
curl --fail-with-body --max-time 20 -sS \
  https://api.assetfare.dev/v2/capabilities
```

Require the response to report the no-sign/no-submit boundary and the current
65-route product policy. Confirm the requested exact `chain:token -> chain:token`
pair is present in the offered route list. A researched but non-offered route is
not quotable; do not substitute another pair or amount.

The amount must be a finite JSON number of at least USD 1. Reject booleans,
strings, NaN, infinity, and shell metacharacters. There is no business maximum,
but live liquidity, provider, balance, and capacity limits still apply.

## Requesting one quote

Construct JSON only from the capability-validated enums and amount. Example:

```bash
curl --fail-with-body --max-time 45 -sS \
  https://api.assetfare.dev/v2/quote \
  -H 'content-type: application/json' \
  -d '{"from_chain":"solana","from_token":"USDC","to_chain":"base","to_token":"USDC","amount_usd":1000}'
```

Do not add query parameters, wallet data, authentication headers, or credentials.

## Validating the response

Fail closed unless all of these checks pass:

1. The status and quote version match the live v2 capability contract; the UUID,
   issue time, positive TTL, exact intent endpoints, and exact requested amount
   are present and unexpired.
2. Expected and minimum receive values are finite and positive, expected is not
   below minimum, the destination symbol matches, and the complete cost summary
   identifies priced and unpriced components.
3. `direct_route_summary` matches the requested route and raw route exactly;
   step indices and endpoints are continuous; decimal base-unit strings,
   providers, actions, fee step, and the exact 1bp AssetFare research fee agree.
4. `route_aggregator_used`, `server_signing`, and `server_submission` are false
   at every applicable level. Preserve any external-intent or provider-internal
   liquidity caveat exactly as returned; never relabel it as direct.
5. `continuation_v3` is server-enforced, quote-bound, unexpired,
   `selection_status: unranked_candidate`, and forbids automatic selection.
   Recompute its summary, typed-canonical payload, and fingerprint hashes using
   the exact published specification. Reject any mismatch or weakened bound.
6. The route guidance identifies one of the current whole-route product classes
   (`core_business`, `conditional_business`, or `strategic_scarce`), says the
   public route is offered, uses whole-route rather than amount-specific product
   gating, keeps competitor rankings out of the public product, and requires a
   fresh quote and caller decision. Do not require or infer a legacy best-from
   threshold.

Do not report partial output after a validation failure. The maintained
`assetfare-mcp@1.21.6` evaluator is the reference implementation for the hash
and contract checks; this skill must not weaken those checks with an ad-hoc
parser.

## Presenting the result

Report the exact endpoints and amount, expected and minimum receive, the complete
cost disclosure, estimated time, ordered provider/action path, fee-bearing step,
whole-route product class, non-atomic status, and quote expiry. State that the
route is offered and freshly quoted, not that it is guaranteed cheapest. Tell
the user to compare executable alternatives at the intended amount if price is
material, and keep that evaluation separate from any later execution approval.

## Errors

- `400`: invalid or unsupported input; re-read capabilities and do not retry the
  same request unchanged.
- `409`: route is not publicly offered or current policy/continuation validation
  failed; do not bypass it.
- `429`: respect `Retry-After` and do not loop.
- `502`/`503` or timeout: report that no usable quote was obtained; retry only
  after a bounded delay if the user still wants one.

## References

- Agent guide: https://assetfare.dev/agents/
- Quote-only OpenAPI: https://assetfare.dev/openapi-quote-only.json
- Live OpenAPI: https://api.assetfare.dev/v2/openapi.json
- Product policy: https://assetfare.dev/route-economics/
- Security: https://assetfare.dev/security/
