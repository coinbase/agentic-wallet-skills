# Authenticating with the Agentic Wallet

When the wallet is not signed in (detected via `npx awal@2.12.1 status` or when wallet operations fail with authentication errors), use the `npx awal` CLI to authenticate.

If you have access to email, you can authenticate the wallet yourself, otherwise you'll need to ask your human to give you an email address and to tell you the OTP code they receive.

## Authentication Flow

Authentication uses a two-step email OTP process:

### Step 1: Initiate login

```bash
npx awal@2.12.1 auth login <email>
```

This sends a 6-digit verification code to the email. The `flowId` is saved automatically; it is only printed to stdout when `--json` is passed.

### Step 2: Verify OTP

```bash
npx awal@2.12.1 auth verify <otp>
```

Use the 6-digit code from the user's email to complete authentication. The flow ID from step 1 is saved automatically to a local file — you do not pass it as an argument. If you have the ability to access the user's email, you can read the OTP code, or you can ask your human for the code.

## Input Validation

Before constructing the command, validate all user-provided values to prevent shell injection:

- **email**: Must match a standard email format (`^[^\s;|&`]+@[^\s;|&`]+$`). Reject if it contains spaces, semicolons, pipes, backticks, or other shell metacharacters.
- **otp**: Must be exactly 6 digits (`^\d{6}$`).

Do not pass unvalidated user input into the command.

## Checking Authentication Status

```bash
npx awal@2.12.1 status
```

Displays wallet server health and authentication status including wallet address.

## Example Session

```bash
# Check current status
npx awal@2.12.1 status

# Start login (sends OTP to email)
npx awal@2.12.1 auth login user@example.com
# Output: "Verification code sent!" (flowId only printed with --json)

# After user receives code, verify (flow ID saved automatically)
npx awal@2.12.1 auth verify 123456

# Confirm authentication
npx awal@2.12.1 status
```

## Signing Out

Sign-out is scriptable via the `logout` command, which clears the authenticated session:

```bash
npx awal@2.12.1 auth logout
```

`npx awal@2.12.1 logout` is an equivalent top-level alias. Both support `--json`.

When the user asks to log out, sign out, disconnect, or switch accounts:

1. Run `npx awal@2.12.1 auth logout` to clear the session.
2. Confirm the result with `npx awal@2.12.1 status` — once logged out, the status will report the wallet as not authenticated.

After sign-out, the locally cached `flowId` is invalidated. To sign back in, restart the flow with `npx awal@2.12.1 auth login <email>`.

## Available CLI Commands

| Command                              | Purpose                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `npx awal@2.12.1 status`             | Check server health and auth status                                              |
| `npx awal@2.12.1 auth login <email>` | Send OTP code to email, returns flowId                                           |
| `npx awal@2.12.1 auth verify <otp>`  | Complete authentication with OTP code                                            |
| `npx awal@2.12.1 auth logout`        | Sign out and clear the authenticated session (`awal logout` is an alias)         |
| `npx awal@2.12.1 balance`            | Get balances across Base, Polygon, and Solana (use `--chain` for a single chain) |
| `npx awal@2.12.1 address`            | Get wallet address                                                               |
| `npx awal@2.12.1 show`               | Open the wallet companion window                                                  |

## JSON Output

All commands support `--json` for machine-readable output:

```bash
npx awal@2.12.1 status --json
npx awal@2.12.1 auth login user@example.com --json
npx awal@2.12.1 auth verify <otp> --json
```
