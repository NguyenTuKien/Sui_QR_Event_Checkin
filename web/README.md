# Next.js integration (Event Check-in)

This folder contains example Next.js 14 (App Router) code to call `marketplace::event_manager::check_in_secure`.

## Env

Set:

- `ADMIN_SECRET_KEY` = Ed25519 Sui private key (recommended format: `suiprivkey...`) of the organizer/backend signer.

## Backend

- API route: `web/app/api/sign/route.ts`
- It BCS-serializes `CheckInMsg { event_id: ID, user: address }` exactly like Move and returns `{ signature, msg }` as base64.
	- `signature` is Ed25519 signature bytes (typically 64 bytes)
	- `msg` is the raw BCS bytes that were signed

## Frontend

- Component: `web/components/CheckInButton.tsx`
- Calls `/api/sign`, then builds a PTB calling `check_in_secure(event, signature, msg, 0x6)`.

## Important

- `CheckInButton` uses `useCurrentAccount()` from `@mysten/dapp-kit` to send the connected wallet address to the backend.
- The backend should also enforce who is allowed to request signatures (auth / rate limit / event ownership checks).
