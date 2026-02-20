---
name: authenticate-wallet
description: Sign in to the wallet. Use when you or the user want to log in, sign in, connect, or set up the wallet, or when any wallet operation fails with authentication or "not signed in" errors. This skill is a prerequisite before sending, trading, or funding.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx awal@2.0.3 status*)", "Bash(npx awal@2.0.3 auth *)", "Bash(npx awal@2.0.3 balance*)", "Bash(npx awal@2.0.3 address*)", "Bash(npx awal@2.0.3 show*)"]
---

# Authenticating with the Payments Wallet

When the wallet is not signed in (detected via `npx awal status` or when wallet operations fail with authentication errors), use the `npx awal` CLI to authenticate.

If you have access to email, you can authenticate the wallet yourself, otherwise you'll need to ask your human to give you an email address and to tell you the OTP code they receive.

## Authentication Flow

Authentication uses a two-step email OTP process:

### Step 1: Initiate login

```bash
npx awal@2.0.3 auth login <email>
```

This sends a 6-digit verification code to the email and outputs a `flowId`.

### Step 2: Verify OTP

```bash
npx awal@2.0.3 auth verify <flowId> <otp>
```

Use the `flowId` from step 1 and the 6-digit code from the user's email to complete authentication. If you have the ability to access the user's email, you can read the OTP code, or you can ask your human for the code.

## Input Validation

Before constructing the command, validate all user-provided values to prevent shell injection:

- **email**: Must match a standard email format (`^[^\s;|&`]+@[^\s;|&`]+$`). Reject if it contains spaces, semicolons, pipes, backticks, or other shell metacharacters.
- **flowId**: Must be alphanumeric (`^[a-zA-Z0-9_-]+$`).
- **otp**: Must be exactly 6 digits (`^\d{6}$`).

Do not pass unvalidated user input into the command.

## Checking Authentication Status

```bash
npx awal@2.0.3 status
```

Displays wallet server health and authentication status including wallet address.

## Example Session

```bash
# Check current status
npx awal@2.0.3 status

# Start login (sends OTP to email)
npx awal@2.0.3 auth login user@example.com
# Output: flowId: abc123...

# After user receives code, verify
npx awal@2.0.3 auth verify abc123 123456

# Confirm authentication
npx awal@2.0.3 status
```

## Available CLI Commands

| Command                                      | Purpose                                |
| -------------------------------------------- | -------------------------------------- |
| `npx awal@2.0.3 status`                     | Check server health and auth status    |
| `npx awal@2.0.3 auth login <email>`         | Send OTP code to email, returns flowId |
| `npx awal@2.0.3 auth verify <flowId> <otp>` | Complete authentication with OTP code  |
| `npx awal@2.0.3 balance`                    | Get USDC wallet balance                |
| `npx awal@2.0.3 address`                    | Get wallet address                     |
| `npx awal@2.0.3 show`                       | Open the wallet companion window       |

## JSON Output

All commands support `--json` for machine-readable output:

```bash
npx awal@2.0.3 status --json
npx awal@2.0.3 auth login user@example.com --json
npx awal@2.0.3 auth verify <flowId> <otp> --json
```
