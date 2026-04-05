# Florin Frontend — Architecture & Technical Reference

## Overview

**Florin** is the frontend for the **Grail Bridge** — a trustless cross-chain bridge that allows users to swap assets between **Litecoin** and **Ethereum-compatible networks**. The bridge operates in two directions:

- **Litecoin → Ethereum**: Users send LTC and receive **zkLTC** (an ERC-20 wrapped representation of Litecoin) on Ethereum.
- **Ethereum → Litecoin**: Users send zkLTC on Ethereum and receive LTC on-chain.

The frontend handles wallet connection, form input, smart contract interaction, real-time transaction tracking, and transaction history.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript ~5.7 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| State Management | TanStack Query (React Query) v5 |
| Routing | TanStack Router v1 (file-based) |
| Form Handling | React Hook Form v7 + Zod v3 |
| UI Components | Radix UI (Dialog, Dropdown, Accordion, etc.) |
| Icons | Lucide React, Radix UI Icons |
| Animations | Motion |
| Notifications | Sonner |
| Blockchain | Wagmi v2, Viem v2 |
| Wallet Protocols | WalletConnect v2, MetaMask, Injected |
| Testing | Vitest, React Testing Library, MirageJS |
| Deployment | Netlify (primary), AWS via SST (secondary) |

---

## Project Structure

```
florin-fe/
├── src/
│   ├── assets/                    # Images, logos, icons
│   ├── components/
│   │   ├── ui/                    # Base UI primitives (Button, Dialog, Card, etc.)
│   │   ├── amount-input/          # Amount entry with validation and balance display
│   │   ├── community-links/       # Social / community footer links
│   │   ├── evm-wallet-connector/  # Wallet connection button + modal
│   │   ├── faq/                   # FAQ accordion section
│   │   ├── footer/                # Page footer
│   │   ├── history-table/         # Transaction history display + table
│   │   ├── tabs-switcher/         # Transfer & History tab layout
│   │   ├── transaction-tracker/   # Live position and reservation trackers
│   │   ├── header.tsx             # Top navigation + wallet button
│   │   └── hero.tsx               # Hero / marketing section
│   ├── config/
│   │   ├── env.ts                 # Zod-validated environment variables
│   │   ├── evm-chains.ts          # Chain definitions (Sepolia, Base Sepolia, Hardhat)
│   │   └── wagmi.ts               # Wagmi + WalletConnect configuration
│   ├── constants/
│   │   ├── abis.ts                # Smart contract ABIs (~2300 lines)
│   │   ├── contracts.ts           # Contract addresses per chain ID
│   │   ├── assets.ts              # Asset logos and token symbols
│   │   └── index.ts               # Barrel export
│   ├── context/
│   │   └── walletDialogContext.tsx # Wallet modal open/close state
│   ├── hooks/
│   │   ├── useExchange.ts          # Core hook: openPosition, reservePosition, gas estimation
│   │   ├── useTransactions.ts      # Transform raw history into display-ready format
│   │   ├── useTxConfirmations.ts   # Poll EVM block confirmations for a tx hash
│   │   ├── useEVMPositionPolling.ts    # Poll smart contract for position state
│   │   ├── useEVMReservationPolling.ts # Poll smart contract for reservation state
│   │   ├── useBitSnarkBalance.ts   # Fetch user's zkLTC (ERC-20) balance
│   │   ├── useBitcoinPrice.ts      # LTC price from CoinGecko
│   │   ├── useLitecoinPrice.ts     # LTC price from CoinGecko
│   │   ├── useBtcBlockConfirmations.ts # Bitcoin confirmation counting
│   │   ├── useSupportedChains.ts   # Detect if connected chain is supported
│   │   ├── useContractManager.ts   # ContractManager singleton accessor
│   │   ├── useToast.tsx            # Sonner toast notifications
│   │   ├── useWalletDialog.tsx     # Access wallet dialog context
│   │   └── queries/                # React Query data-fetching hooks
│   │       ├── useMaxMinBtc.ts
│   │       ├── usePosition.ts
│   │       ├── useReservation.ts
│   │       └── useTransactionHistory.ts
│   ├── lib/
│   │   ├── utils.ts               # Bech32 ↔ bytes32 conversion, address validation
│   │   └── errors.ts              # Custom error classes
│   ├── pages/
│   │   ├── home-page.tsx
│   │   ├── not-found-page.tsx
│   │   └── terms-page.tsx
│   ├── providers/
│   │   └── index.tsx              # WagmiProvider + QueryClientProvider + WalletDialogProvider
│   ├── routes/
│   │   ├── __root.tsx             # Root layout
│   │   ├── index.tsx              # Home route (/)
│   │   └── terms.tsx              # Terms route (/terms)
│   ├── services/
│   │   ├── Api.ts                 # Backend API client (FlorinApiService)
│   │   ├── ContractManager.ts     # Smart contract read/write (singleton)
│   │   └── BitcoinOracle.ts       # CoinGecko price fetching
│   ├── styles/                    # Global CSS
│   ├── types/
│   │   ├── index.ts               # Core types: Position, Reservation, status enums
│   │   └── chains.ts              # Supported chain ID type
│   ├── test/                      # Vitest + RTL test files
│   ├── main.tsx                   # App entry point
│   └── index.css                  # Tailwind + global styles
├── public/                        # Static assets
├── .env                           # Local env vars (production is in Netlify)
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── eslint.config.js
```

---

## Architecture

### State Management

Three layers of state, each with a distinct concern:

| Layer | Tool | Manages |
|---|---|---|
| Server / async state | TanStack Query | API responses, polling, caching |
| UI state | React Context | Wallet modal visibility |
| Local component state | `useState` | Form input, animations, loading |

**React Query key conventions:**
- `['position', id]`
- `['reservation', id]`
- `['transactions', 'history', ownerAddress]`
- `['btcBlockCount']`

### Data Flow

```
User Input (TransferTab form)
  → useExchange() hook
    → ContractManager.openPosition() / reservePosition()
      → Signed on-chain transaction
        → Transaction hash returned
          → useEVMPositionPolling / useEVMReservationPolling
            → React Query polling against API + contract
              → History cache invalidated on settlement
                → UI reflects final state
```

### Routing

File-based routing via TanStack Router. Routes are generated from files in `src/routes/`:

| Route | Component | Purpose |
|---|---|---|
| `/` | `HomePage` | Main bridge interface |
| `/terms` | `TermsPage` | Terms of service |
| `*` | `NotFoundPage` | 404 fallback |

---

## Core Services

### `ContractManager` (`services/ContractManager.ts`)

Singleton that wraps Viem's public and wallet clients.

- **Public client** — read-only calls (no wallet required)
- **Wallet client** — signed transactions (requires connected wallet)
- Initialized via `ContractManager.getInstance(wagmiConfig)`
- Exposes:
  - `openPosition(...)` — creates an ETH→LTC bridge position
  - `reservePosition(...)` — creates a LTC→ETH reservation
  - `getPosition(id)` / `getReservation(id)` — contract reads
  - Gas estimation helpers

### `FlorinApiService` (`services/Api.ts`)

REST client for the backend. Base URL set by `VITE_API_BASE_URL`.

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/position/{id}` | Position details |
| GET | `/reservation/{id}` | Reservation + block count |
| GET | `/positions/active` | All active positions |
| GET | `/reservations/active` | All active reservations |
| POST | `/positions/find-for-amount` | Best position for a given amount |
| GET | `/history/{ownerAddress}` | Full transaction history |
| GET | `/btcBlockCount` | Current Bitcoin block height |
| GET | `/bitcoin/taproot-address` | Bitcoin deposit address |

### `BitcoinOracle` (`services/BitcoinOracle.ts`)

Fetches Litecoin and Bitcoin USD prices from the CoinGecko public API (no authentication required).

---

## Smart Contract Integration

### Supported Networks

| Network | Chain ID | Use |
|---|---|---|
| Sepolia | 11155111 | Primary testnet |
| Base Sepolia | 84532 | Secondary testnet |
| Hardhat | 31337 | Local development |

### Contract Addresses (Sepolia)

```
ammExchange:        0x15EF38c3e42150e8B0156C22f27f93B26804e3bd
marketMakerProxy:   0xD7b953b8930C103589E10d4Ff30F4Ed4D64A4d85
florinForwarder:    0xa9f24c03A309bF72086CF7496771eFa02C3b99D9
erc20BitSnark:      0xaE9190aEca45F50dCDa0483c0223E191E6811ad2
contractRegistry:   0x204652c13363cc43a7bC87B23b13870A0DB20a03
defaultPositionId:  0xf0e94d3b55389b66f693bf6a4ae0eec46a1e61342c9efeaa96ba6ada1d555ca2
```

Contract addresses and the default position ID are centralized in `constants/contracts.ts`.

### Key Contract Methods

**AMMExchange:**
- `openPosition(uint256, uint256, bytes32, uint256, uint8, bytes32, bytes32)` — Open a position (ETH→LTC direction). Requires an EIP-2612 permit signature for the zkLTC spend.
- `reservePosition(bytes32, address, uint256)` — Reserve a position for a LTC→ETH swap.
- `getPosition(bytes32)` → position state struct
- `getReservation(bytes32)` → reservation state struct

**zkLTC ERC-20 (BitSnark):**
- `permit(owner, spender, value, deadline, v, r, s)` — EIP-2612 gasless approval
- `balanceOf(address)` — Token balance
- `nonces(address)` — Current nonce for permit signing

---

## Transaction Flows

### ETH → LTC (openPosition)

1. User enters LTC amount and a Litecoin destination address.
2. Frontend encodes the Bech32 Litecoin address to `bytes32`.
3. **EIP-2612 Permit**: User signs typed data (no separate approval tx needed).
4. `ContractManager.openPosition()` submits transaction with the permit.
5. Backend detects the Ethereum event, generates a taproot Bitcoin address, and broadcasts a LTC payment.
6. `useEVMPositionPolling` polls for position state transitions: `Active → Closed/Settled`.
7. Tracker UI shows multi-step progress and confirmation counts.

### LTC → ETH (reservePosition)

1. User enters zkLTC amount.
2. `ContractManager.reservePosition()` submits transaction on Ethereum.
3. Backend returns a Bitcoin taproot deposit address.
4. User sends LTC to that address (shown in UI with QR code).
5. Backend monitors Bitcoin confirmations.
6. On sufficient confirmations, backend settles the reservation and mints zkLTC to the user's Ethereum address.
7. `useEVMReservationPolling` + `useBtcBlockConfirmations` track progress.

### Confirmation Thresholds

Transaction amount (in USD) determines confirmation requirements:

- **EVM confirmations required:** controlled by `VITE_EVM_CONFIRMATIONS` (default 10)
- **Fast settlement threshold:** `VITE_EVM_CONFIRMATIONS_USD_AMOUNT` (default $100) — transactions under this value settle with fewer confirmations
- **Bitcoin confirmations:** `VITE_BTC_CONFIRMATIONS` (default 1)

---

## Wallet Integration

### Connectors (in priority order)

1. OKX Wallet (listed first in UI)
2. MetaMask
3. WalletConnect (modal, supports mobile)
4. Injected (generic EIP-1193 fallback)

### Connection Flow

```
"Connect Wallet" button
  → WalletDialogContext.openDialog()
    → ConnectorsListDialog renders available connectors
      → User selects a connector
        → wagmi.connect({ connector })
          → ContractManager initialized with wallet client
            → Signed transactions enabled
```

### Security Notes

- No backend authentication — all signing is client-side.
- Token approvals use EIP-2612 permit (off-chain signature), avoiding a separate approval transaction.
- EIP-712 typed data signing used for permits — wallet displays human-readable approval details.

---

## Data Types

### Position

```typescript
{
  positionId: string;
  chainId: number;
  ownerAddress: string;
  tokenAddress: Address;
  bitcoinAddress: string;
  exchangeRate: string;
  state: 'None' | 'Active' | 'Paused' | 'Closed';
  finality: 'UNKNOWN' | 'FINAL' | 'REVERTED';
  amount: string;
  hash: string;
  createdAt: string;            // ISO 8601
  originTxHash?: string;
  destinationTxHash?: string;
}
```

### Reservation

```typescript
{
  reservationId: string;
  ownerAddress: string;
  positionId?: string;
  tokenAddress: Address;
  amount: string;
  state: 'None' | 'Pending' | 'Expired' | 'Canceled' | 'Settled';
  finality: 'UNKNOWN' | 'FINAL' | 'REVERTED';
  chainId: number;
  bitcoinAddress?: string;
  hash: string;
  createdAt: string;
}
```

---

## Environment Variables

Validated at startup using Zod (`config/env.ts`). If any required variable is missing or invalid, the app throws at boot.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | Yes | — | WalletConnect v2 project ID |
| `VITE_API_BASE_URL` | Yes | `https://api.florin-litvm.net` | Backend base URL |
| `VITE_RPC_URL` | No | — | Custom RPC (local dev only) |
| `VITE_EXPIRATION_HOURS` | No | `24` | Hours before position expires |
| `VITE_MIN_AMOUNT` | No | `0.0004` | Minimum swap amount |
| `VITE_MAX_AMOUNT` | No | `3` | Maximum swap amount |
| `VITE_EVM_CONFIRMATIONS` | No | `10` | Required EVM confirmations |
| `VITE_EVM_CONFIRMATIONS_USD_AMOUNT` | No | `100` | USD threshold for fast settlement |
| `VITE_BTC_CONFIRMATIONS` | No | `1` | Required Bitcoin confirmations |

**Production**: All environment variables are managed in **Netlify** — do not commit production values to `.env`.

---

## Build & Deployment

### Local Development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite production build
npm run test         # Vitest
npm run lint         # ESLint
```

### CI/CD

- **GitHub Actions** runs lint + tests on pull requests.
- **Netlify** auto-deploys:
  - `develop` branch → staging/preview
  - `main` branch → production
- Required Netlify secrets: `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`

### Build Rule

`npm run build` **must pass** before any task is considered done. The build command runs both TypeScript compilation (`tsc -b`) and Vite's production bundler, so it catches type errors and bundle issues simultaneously.

---

## Testing

- **Vitest** — unit and integration tests
- **React Testing Library** — component-level tests
- **MirageJS** — in-memory mock API server for tests
- Test files live in `src/test/`

---

## Key Utilities

### Bech32 ↔ bytes32 (`lib/utils.ts`)

Smart contracts store Bitcoin addresses as `bytes32`. The utilities encode/decode between the human-readable Bech32 Litecoin address format (e.g. `ltc1q...`) and the on-chain 32-byte representation.

### Error Handling (`lib/errors.ts`)

Custom error subclasses allow specific catch logic for:
- Contract revert errors
- API errors
- Wallet rejection errors

---

## Recent Notable Changes

From recent git history:

- History cache is now **invalidated** when the transaction tracker detects settlement, keeping the history tab consistent without a full page reload.
- Position status in the history list uses the `state` field from the API (not derived from on-chain data alone).
- zkLTC token was rebranded from `xLTC` and its contract address was updated.
- `defaultPositionId` was centralized into `constants/contracts.ts`.
- AMM exchange contract address was updated.
