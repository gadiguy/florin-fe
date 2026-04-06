# Florin Frontend — Architecture & Technical Reference

## Overview

**Florin** is the frontend for the **Florin Bridge** — a trustless cross-chain bridge that allows users to swap assets between **Litecoin** and **Ethereum-compatible networks**. The bridge operates in three directions:

- **Litecoin → Sepolia**: Users send LTC and receive **zkLTC** (ERC-20) on Ethereum Sepolia.
- **Litecoin → Liteforge**: Users send LTC and receive **zkLTC** on **Liteforge**, an Arbitrum-based L2 rollup. The settlement flows through Sepolia and is bridged automatically by the florin-mm relayer via the `LiteforgeDepositor` contract.
- **Ethereum → Litecoin**: Users send zkLTC on Ethereum and receive LTC on-chain.

The frontend handles wallet connection, form input, destination chain selection, smart contract interaction, real-time transaction tracking, and transaction history.

---

## Tech Stack

| Category | Technology |
| --- | --- |
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
| Deployment | Netlify |

---

## Project Structure

```text
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
│   │   ├── abis.ts                # Smart contract ABIs (AMMExchange, ERC20, NativeBridge, LiteforgeDepositor)
│   │   ├── contracts.ts           # Contract addresses per chain ID
│   │   ├── assets.ts              # Asset logos and token symbols
│   │   └── index.ts               # Barrel export
│   ├── context/
│   │   └── walletDialogContext.tsx # Wallet modal open/close state
│   ├── hooks/
│   │   ├── useExchange.ts              # Core hook: openPosition, reservePosition, gas estimation
│   │   ├── useTransactions.ts          # Transform raw history into display-ready format
│   │   ├── useTxConfirmations.ts       # Poll EVM block confirmations for a tx hash
│   │   ├── useEVMPositionPolling.ts    # Poll smart contract for position state
│   │   ├── useEVMReservationPolling.ts # Poll smart contract for reservation state
│   │   ├── useLiteforgeEvent.ts        # Poll LiteforgeDepositor for Bridged events
│   │   ├── useBitSnarkBalance.ts       # Fetch user's zkLTC (ERC-20) balance
│   │   ├── useBitcoinPrice.ts          # BTC price from CoinGecko
│   │   ├── useLitecoinPrice.ts         # LTC price from CoinGecko
│   │   ├── useBtcBlockConfirmations.ts # Bitcoin confirmation counting
│   │   ├── useSupportedChains.ts       # Detect if connected chain is supported
│   │   ├── useContractManager.ts       # ContractManager singleton accessor
│   │   ├── useToast.tsx                # Sonner toast notifications
│   │   ├── useWalletDialog.tsx         # Access wallet dialog context
│   │   └── queries/                    # React Query data-fetching hooks
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
│   │   └── chains.ts              # ChainId enum + TargetChain type
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
| --- | --- | --- |
| Server / async state | TanStack Query | API responses, polling, caching |
| UI state | React Context | Wallet modal visibility |
| Local component state | `useState` | Form input, animations, loading |

**React Query key conventions:**

- `['position', id]`
- `['reservation', id]`
- `['transactions', 'history', ownerAddress]`
- `['btcBlockCount']`

### Data Flow

```text
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
| --- | --- | --- |
| `/` | `HomePage` | Main bridge interface |
| `/terms` | `TermsPage` | Terms of service |
| `*` | `NotFoundPage` | 404 fallback |

---

## Core Services

### `ContractManager` (`services/ContractManager.ts`)

Singleton that wraps Viem's public and wallet clients.

- **Public client** — read-only calls (no wallet required)
- **Wallet client** — signed transactions (requires connected wallet)
- Initialized via `ContractManager.getInstance()`
- Registered contracts: `AMMExchange`, `ERC20BitSnark`, `LiteforgeDepositor`
- Exposes `readContract`, `writeContract`, `signTypedData`

### `FlorinApiService` (`services/Api.ts`)

REST client for the florin-fe-be backend. Base URL set by `VITE_API_BASE_URL`.

| Method | Endpoint | Returns |
| --- | --- | --- |
| GET | `/position/{id}` | Position details |
| GET | `/reservation/{id}` | Reservation details + BTC block count |
| GET | `/history/{ownerAddress}` | Full transaction history |
| GET | `/btcBlockCount` | Current Bitcoin block height |

---

## Smart Contract Integration

### Supported Networks

| Network | Chain ID | Use |
| --- | --- | --- |
| Sepolia | 11155111 | Primary testnet |
| Hardhat | 31337 | Local development |

### Contract Addresses (Sepolia)

```text
ammExchange:          0x15EF38c3e42150e8B0156C22f27f93B26804e3bd
marketMakerProxy:     0xD7b953b8930C103589E10d4Ff30F4Ed4D64A4d85
florinForwarder:      0xa9f24c03A309bF72086CF7496771eFa02C3b99D9
erc20BitSnark:        0xaE9190aEca45F50dCDa0483c0223E191E6811ad2
nativeBridge:         0x8A381f8822E512E50dd4679E678271E9a83226E6
liteforgeDepositor:   0x4C16c6cd9DC8e21F1EaF52F11167199CF3C8F934
contractRegistry:     0x204652c13363cc43a7bC87B23b13870A0DB20a03
defaultPositionId:    0xf0e94d3b55389b66f693bf6a4ae0eec46a1e61342c9efeaa96ba6ada1d555ca2
```

### Key Contract Methods

**AMMExchange:**

- `openPosition(uint256, uint256, bytes32, uint256, uint8, bytes32, bytes32)` — Open a position (ETH→LTC). Requires an EIP-2612 permit signature.
- `reservePosition(bytes32, address, uint256)` — Reserve a position for LTC→ETH (or LTC→Liteforge). `address` is either the user's wallet or the `LiteforgeDepositor` contract.

**zkLTC ERC-20 (ERC20BitSnark):**

- `permit(owner, spender, value, deadline, v, r, s)` — EIP-2612 gasless approval
- `balanceOf(address)` — Token balance
- `nonces(address)` — Current nonce for permit signing

**LiteforgeDepositor:**

- `bridge(address l2Recipient, uint256 amount)` — Called by the florin-mm relayer after settlement. Approves and calls `createRetryableTicket` on the native bridge. Emits `Bridged(address indexed l2Recipient, uint256 amount, uint256 messageNum)`.

**Native Bridge (ERC20Inbox / Arbitrum):**

- `createRetryableTicket(to, l2CallValue, maxSubmissionCost, excessFeeRefundAddress, callValueRefundAddress, gasLimit, maxFeePerGas, tokenTotalFeeAmount, data)` — Bridges ERC-20 tokens to the Liteforge L2.

---

## Transaction Flows

### ETH → LTC (`openPosition`)

1. User enters LTC amount and a Litecoin destination address.
2. Frontend encodes the Bech32 Litecoin address to `bytes32`.
3. **EIP-2612 Permit**: User signs typed data (no separate approval tx).
4. `ContractManager.writeContract('AMMExchange', 'openPosition', ...)` submits the transaction.
5. Backend (florin-mm) detects the event, generates a taproot Bitcoin address, and broadcasts a LTC payment.
6. `useEVMPositionPolling` tracks state: `Active → Closed`.

Tracker steps: **Initiating transaction** → **Bridging complete**

### LTC → Sepolia (`reservePosition`, targetChain = `sepolia`)

1. User enters amount, selects **Sepolia** as destination.
2. `reservePosition(positionId, userWalletAddress, amount)` is called on-chain.
3. User sends LTC to the taproot address shown in the tracker.
4. florin-mm monitors Bitcoin; once confirmed, settles the reservation — zkLTC lands in the user's wallet.
5. `useReservation` polls the backend API every 5 seconds.

Tracker steps: **Request transfer** → **Send LTC** → **LTC detected** → **Bridging complete**

### LTC → Liteforge (`reservePosition`, targetChain = `liteforge`)

1. User enters amount, selects **Liteforge** as destination.
2. `reservePosition(positionId, LiteforgeDepositorAddress, amount)` is called — the depositor contract is the EVM recipient, not the user.
3. User sends LTC to the taproot address shown in the tracker.
4. florin-mm detects the settlement, sees the recipient is `LiteforgeDepositor`, and calls `bridge(ownerAddress, amount)`.
5. `LiteforgeDepositor` approves the native bridge and calls `createRetryableTicket`.
6. zkLTC arrives at the user's same address on Liteforge.
7. `useLiteforgeEvent` polls Sepolia for the `Bridged` event on the depositor contract.

Tracker steps: **Request transfer** → **Send LTC** → **LTC detected** → **zkLTC on Sepolia** → **Bridging to Liteforge** → **Arrived on Liteforge**

### Confirmation Thresholds

- **EVM confirmations**: `VITE_EVM_CONFIRMATIONS` (default 10)
- **Fast settlement**: amounts below `VITE_EVM_CONFIRMATIONS_USD_AMOUNT` (default $100) skip the wait
- **Bitcoin confirmations**: `VITE_BTC_CONFIRMATIONS` (default 1)

---

## Destination Chain Selection

The `TargetChain` type (`src/types/chains.ts`) drives the LTC→ETH direction:

```typescript
export type TargetChain = 'sepolia' | 'liteforge';
```

- Selected via a pill toggle in the transfer form (visible in LTC→ETH direction only).
- Defaults to `'sepolia'`.
- When `'liteforge'` is selected, `evmReceivingAddress` in `reservePosition` is set to the `liteforgeDepositor` contract address instead of the user's wallet.
- The `ReservationTracker` renders 2 additional steps when `targetChain === 'liteforge'`.

---

## Wallet Integration

### Connectors (in priority order)

1. OKX Wallet
2. MetaMask
3. WalletConnect (modal, supports mobile)
4. Injected (generic EIP-1193 fallback)

### Connection Flow

```text
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
- EIP-712 typed data signing — wallet displays human-readable approval details.

---

## Data Types

### `TargetChain`

```typescript
export type TargetChain = 'sepolia' | 'liteforge';
```

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
  createdAt: string;          // ISO 8601
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
  originTxhash?: string;
  targetTxhash?: string;
  liteforgeTxhash?: string;   // set by backend after LiteforgeDepositor.bridge()
}
```

---

## Environment Variables

Validated at startup using Zod (`config/env.ts`). If any required variable is missing the app throws at boot.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_WALLETCONNECT_PROJECT_ID` | Yes | — | WalletConnect v2 project ID |
| `VITE_API_BASE_URL` | Yes | — | Backend base URL |
| `VITE_RPC_URL` | No | — | Custom RPC (local dev only) |
| `VITE_EXPIRATION_HOURS` | No | `24` | Hours before position expires |
| `VITE_MIN_AMOUNT` | No | `0.0004` | Minimum swap amount (LTC) |
| `VITE_MAX_AMOUNT` | No | `3` | Maximum swap amount (LTC) |
| `VITE_EVM_CONFIRMATIONS` | No | `10` | Required EVM confirmations |
| `VITE_EVM_CONFIRMATIONS_USD_AMOUNT` | No | `100` | USD threshold for fast settlement |
| `VITE_BTC_CONFIRMATIONS` | No | `1` | Required Bitcoin confirmations |

**Production**: All environment variables are managed in **Netlify** — do not commit production values to `.env`.

---

## Build & Deployment

### Local Development

```bash
npm install
npm run dev          # Vite dev server at localhost:5173
npm run build        # TypeScript check + Vite production build
npm run test         # Vitest
npm run lint         # ESLint
```

### CI/CD

- **GitHub Actions** runs lint + tests on pull requests.
- **Netlify** auto-deploys:
  - `develop` branch → preview
  - `main` branch → production
- Required Netlify secrets: `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`

### Build Rule

`npm run build` **must pass** before any task is considered done.

---

## Testing

- **Vitest** — unit and integration tests
- **React Testing Library** — component-level tests
- **MirageJS** — in-memory mock API server for tests
- Test files live in `src/test/`

---

## Key Utilities

### Bech32 ↔ bytes32 (`lib/utils.ts`)

Smart contracts store Bitcoin/Litecoin addresses as `bytes32`. These utilities encode/decode between the human-readable Bech32 format (e.g. `ltc1q...`) and the on-chain 32-byte representation.

### Error Handling (`lib/errors.ts`)

Custom error subclasses for:

- Contract revert errors
- API errors
- Wallet rejection errors
