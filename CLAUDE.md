# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Denar is a P2P money transfer app targeting Macedonia ("Venmo for the Balkans"). The repo is a monorepo with two independent packages:
- `api/` — Node.js/Express REST API with PostgreSQL + Sequelize
- `ui/` — React Native app built with Expo SDK 55

## Commands

### API (run from `api/`)
```bash
npm run dev             # Start with nodemon (watch mode)
npm start               # Production start
npm run migrate         # Run Sequelize migrations
npm run migrate:undo    # Revert last migration
npm run seed            # Seed database with bank data
npm test                # Run Jest tests (tests/ dir exists but is currently empty)
npm run lint            # ESLint
npm run lint:fix        # ESLint with auto-fix
```

### UI (run from `ui/`)
```bash
npx expo start          # Start Expo dev server (scan QR with Expo Go)
npx expo start --ios    # Open in iOS simulator
npx expo start --android
```

### Database
The API connects to PostgreSQL. Dev credentials are in `api/src/config/config.js` (`denar_user / denar_password_2024`). To reset schema from scratch: `psql -U denar_user -d denar_db -f setup-database.sql`.

If Sequelize models have fields missing from the DB (common after model changes), add them manually:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "columnName" TYPE DEFAULT value;
```

## Architecture

### API (`api/src/`)
- `index.js` — Express app entry: helmet → cors → rateLimit → session → json → compression → morgan → routes → errorHandler
- `middleware/auth.js` — JWT verification; exports `authenticate`, `optionalAuth`, `requireKYC`
- `middleware/errorHandler.js` — Global error handler; `APIError` class; **response shape in development**: `{ success: false, error: { message: "...", stack: "..." } }`
- `models/` — Sequelize models with UUID PKs: User, Bank, BankAccount, Transaction, Friend, Contact, ActivityFeed
- `routes/` — One file per resource; all protected routes apply `authenticate` via `router.use(authenticate)`
- `utils/logger.js` — Winston logger; files in `logs/`; also prints to console in dev

**Auth flow**: POST `/auth/login` → returns `{ requiresTwoFactor: true, userId, phoneHint }` → POST `/auth/verify-login` → returns `{ user, accessToken, refreshToken }`

**Phone verification flow**: POST `/verification/phone/send` → POST `/verification/phone/verify` (6-digit code, 10-min expiry). The `requirePhoneVerification` middleware in `auth.js` gates sensitive routes on `phoneVerifiedAt`.

**Payment mode**: Controlled by `PAYMENT_MODE` env var (`simulated` default or `tpp`). In `simulated` mode, balances adjust directly in DB and KYC is skipped. In `tpp` mode, the app calls real bank PIS APIs (requires mTLS certs). See `api/src/config/payment.js`.

**Rate limits**: Auth endpoints: 100 req/15min in dev, 5 in prod. Global: 100 req/15min per IP.

### UI (`ui/src/`)
- `services/api.ts` — Axios instance; `authToken` is in-memory only (no AsyncStorage — forces login every session by design); `getErrorMessage()` utility handles all backend error shapes
- `context/AuthContext.tsx` — `login(user, token)`, `logout()`, `updateUser(partial)` — no persistence
- `navigation/AppNavigator.tsx` — AuthStack (Login → Register → TwoFactor → AddBankAccount) and TabNavigator with HomeStack, FriendsStack, ProfileStack
- `utils/theme.ts` — Single source of truth for all colors, spacing, radius, font sizes

**After 2FA success**: checks if user has bank accounts; if none, navigates to `AddBankAccount` with `isOnboarding: true` before calling `login()`.

## Critical Rules for React Native (New Architecture / Expo Go SDK 55)

These patterns **crash the app** and must never be used:

1. **Never call `Alert.alert()` after an `await`** — causes SIGABRT on iOS New Architecture. Use inline error state (`setErrorMessage(...)`) and render a `<Text>` or banner in JSX instead.

2. **Never define components inside render functions** — inline component definitions (e.g. `const Foo = () => ...` inside another component) cause React to unmount/remount on every render. Always define sub-components at module level.

3. **Never use `gap:` in StyleSheet** — crashes Expo Go on iOS. Use `columnGap:` and `rowGap:` instead.

4. **Sequelize DECIMAL columns return Decimal.js objects** — never render `account.balance` directly. Always convert: `parseFloat(String(account.balance)).toFixed(2)`.

5. **Backend error shape**: The API returns `{ error: { message: "...", stack?: "..." } }` (not `{ message: "..." }` at the top level). The `getErrorMessage()` utility in `api.ts` handles this — always use it, never access `error.response.data.message` directly.

## Database Models — Key Notes

- All PKs are UUIDs (`defaultValue: DataTypes.UUIDV4`)
- `User` has both `email` and `username` (unique, 3-30 chars, alphanumeric + underscore). `User.toJSON()` strips `password`, `twoFactorSecret`, `phoneVerificationCode` and adds a computed `name` field.
- `User.password` is auto-hashed via `beforeCreate`/`beforeUpdate` hooks; use `user.comparePassword(plain)` to verify
- Phone numbers must match `+389XXXXXXXX` (Macedonian format); validated at model level
- `BankAccount` is soft-deleted (`isActive = false`), not hard-deleted; setting `isDefault: true` auto-unsets other defaults via hook
- `Transaction.isRequest` — boolean flag for payment requests; includes `requestExpiresAt` and `requestMessage`. Transaction references auto-generated as `TXN{timestamp}{9-char random}` if not provided.
- `ActivityFeed` model and associations exist but no routes are exposed yet
- `twoFactorEnabled`/`twoFactorSecret` fields exist on User (backend ready) but 2FA UI is not yet implemented
- Sequelize associations are set up in `models/index.js`; bank accounts include `bank` via `as: 'bank'` — access as `account.bank.name`, not `account.bankName`
