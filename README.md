# Florin Frontend

## Overview

Florin is the frontend for the Florin Bridge — a trustless cross-chain bridge between **Litecoin** and **Ethereum-compatible networks**. Users can swap assets in three directions:

- **Litecoin → Sepolia**: Send LTC, receive **zkLTC** (ERC-20) on Ethereum Sepolia.
- **Litecoin → Liteforge**: Send LTC, receive **zkLTC** directly on **Liteforge** — an Arbitrum-based L2 rollup.
- **Ethereum → Litecoin**: Send zkLTC on Ethereum, receive LTC on-chain.

## Tech Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Routing**: TanStack Router
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI
- **Blockchain Integration**: wagmi, viem
- **Testing**: Vitest, React Testing Library
- **Code Quality**: ESLint, Prettier

## Setup

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone git@github.com:gadiguy/florin-fe.git
cd florin-fe
```

1. Install dependencies:

```bash
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```env
# WalletConnect project ID for wallet connection functionality
VITE_WALLETCONNECT_PROJECT_ID=""

# RPC URL for connecting to the Ethereum network
VITE_RPC_URL=""

# Base URL for the Florin API endpoints
VITE_API_BASE_URL="https://florin.bitcoinos.build"

# Number of hours until a transaction expires
VITE_EXPIRATION_HOURS=24

# Minimum amount allowed for transactions (in LTC)
VITE_MIN_AMOUNT="0.0004"

# Maximum amount allowed for transactions (in LTC)
VITE_MAX_AMOUNT="3"

# Number of confirmations required for EVM transactions to be completed
VITE_EVM_CONFIRMATIONS=10

# USD amount threshold: below this value EVM confirmations are skipped
VITE_EVM_CONFIRMATIONS_USD_AMOUNT=100

# Number of confirmations required for Bitcoin/Litecoin transactions
VITE_BTC_CONFIRMATIONS=6

# Default position id for reservation
VITE_DEFAULT_POSITION_ID=
```

> **Production**: All environment variables are managed in **Netlify** — do not commit production values to `.env`.

## Contract Addresses (Sepolia)

Contract addresses are configured in `src/constants/contracts.ts`.

| Contract | Address |
| --- | --- |
| AMMExchange | `0x15EF38c3e42150e8B0156C22f27f93B26804e3bd` |
| MarketMakerProxy | `0xD7b953b8930C103589E10d4Ff30F4Ed4D64A4d85` |
| FlorinForwarder | `0xa9f24c03A309bF72086CF7496771eFa02C3b99D9` |
| zkLTC (ERC-20) | `0xaE9190aEca45F50dCDa0483c0223E191E6811ad2` |
| Native Bridge (ERC20Inbox) | `0x8A381f8822E512E50dd4679E678271E9a83226E6` |
| LiteforgeDepositor | `0x4C16c6cd9DC8e21F1EaF52F11167199CF3C8F934` |
| ContractRegistry | `0x204652c13363cc43a7bC87B23b13870A0DB20a03` |

## Main Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage report

## Tests

The project uses Vitest and React Testing Library for testing.

```bash
# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:coverage
```

## Deployment

The project is deployed on **Netlify** via GitHub Actions.

- `develop` branch → Netlify preview
- `main` branch → Netlify production

Required secrets: `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `npm run build` and confirm it passes
4. Submit a pull request
