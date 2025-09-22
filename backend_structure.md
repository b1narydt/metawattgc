# METAWATT Backend Infrastructure Document

## Document Metadata
- **Title**: METAWATT Backend Infrastructure Outline
- **Version**: 1.0
- **Date**: September 09, 2025
- **Author**: Grok 4 (built by xAI)
- **Status**: Draft
- **Purpose**: This document outlines the backend infrastructure for the METAWATT platform, focusing on BSV stack components to implement an EnergyTag-compliant API for granular certificate registries. It emphasizes the use of PushDrop tokens, blockchain timestamping, wallet integration, and overlay services.

## Introduction
The METAWATT backend is an Express.js-based server that serves as an EnergyTag-compliant API for managing granular certificates (GCs). It leverages the Bitcoin SV (BSV) ecosystem for immutability, data storage, and querying. Key features include:
- Using PushDrop tokens to encapsulate certificate data.
- Blockchain timestamping via BSV for proof of creation and bundle timestamps.
- Automatic storage of tokens in the METAWATTS wallet basket.
- Token redemption via pushdrop.unlock and broadcasting to the METAWATT overlay service for public querying and purchasing.
- Full compliance with EnergyTag standards, including certificate issuance, transfer, cancellation, and storage records.

The infrastructure ensures secure, scalable operations with minimal latency, integrating ts-sdk for BSV interactions and Express for API handling.

## Architecture Overview
The backend architecture is modular, with Express as the core API layer interfacing with BSV components. High-level components:
- **API Layer**: Express server handling EnergyTag endpoints (e.g., /certificates/create, /certificates/transfer).
- **Blockchain Layer**: BSV mainnet/testnet for transaction broadcasting and timestamping, using ts-sdk.
- **Token Layer**: PushDrop tokens for data embedding, created and managed via ts-sdk.
- **Wallet Integration**: METAWATTS basket in local wallet clients for token storage and redemption.
- **Overlay Service**: METAWATT overlay for token broadcasting, topic management, and querying/purchasing GCs.
- **Database Layer**: Lightweight off-chain DB (e.g., PostgreSQL or MongoDB) for metadata indexing, synced with BSV ledger.
- **Middleware**: Auth and payment middleware for secure, monetized API access.

Data flow: API requests → Validation → Token creation/timestamping on BSV → Storage in METAWATTS → Optional broadcast to overlay.

## Key Components
### 1. Express Server
- **Role**: Hosts EnergyTag-compliant RESTful API endpoints.
- **Features**:
  - Implements all paths from EnergyTag spec (e.g., certificate creation, query, transfer).
  - Uses middleware for authentication (e.g., JWT) and payments (e.g., BSV microtransactions).
  - Integrates ts-sdk for blockchain operations within endpoint handlers.
- **Tech Stack**: Node.js, Express.js, TypeScript.

### 2. PushDrop Tokens
- **Role**: Holds certificate data (e.g., EnergyTag schema fields like energy_source, bundle_quantity).
- **Features**:
  - Created using ts-sdk's PushDrop scripts.
  - Data embedded in token outputs for immutability.
  - Automatically pushed to METAWATTS basket upon creation.
  - Redemption: Users unlock via pushdrop.unlock to claim GCs.
- **Integration**: API endpoints like /certificates/create generate PushDrop tokens and broadcast them.

### 3. BSV Blockchain (via ts-sdk)
- **Role**: Provides timestamping and proof of creation for bundles.
- **Features**:
  - ts-sdk handles transaction building, signing, and broadcasting.
  - Each bundle timestamped by including it in a BSV tx output.
  - Proofs verifiable via Merkle roots and tx confirmations.
- **Integration**: Called synchronously in API flows for real-time operations.

### 4. METAWATTS Wallet Basket
- **Role**: Local storage for PushDrop tokens in user's wallet client.
- **Features**:
  - Automatic deposit of tokens post-API actions.
  - Supports redemption (unlock) for individual claims.
  - BRC100-compatible for seamless wallet interactions.
- **Integration**: API notifies wallet client via callbacks or webhooks after token creation.

### 5. METAWATT Overlay Service
- **Role**: Manages broadcasted tokens for querying and purchasing.
- **Features**:
  - Tokens broadcast from API or wallet for public visibility.
  - Topic management (e.g., by energy_source or region) for efficient queries.
  - Enables GC purchases: Buyers query topics, purchase via BSV tx.
  - Indexing for fast searches without full chain scans.
- **Integration**: API endpoints include broadcast options; overlay APIs for query/purchase.

### 6. Database and Indexing
- **Role**: Off-chain storage for quick metadata access.
- **Features**:
  - Stores references to BSV tx_ids, token metadata.
  - Syncs with blockchain via ts-sdk listeners.
  - ACID compliance for API queuing and state consistency.
- **Tech Stack**: PostgreSQL with indexes on common query fields (e.g., issuance_id).

### 7. Middleware and Security
- **Role**: Secures and monetizes API access.
- **Features**:
  - Auth middleware: Validates user sessions via JWT or wallet signatures.
  - Payment middleware: Requires BSV payments for certain calls (e.g., bulk queries).
  - Rate limiting and logging for abuse prevention.
- **Integration**: Applied globally to Express routes.

## Data Flow
1. **Certificate Creation**: API request → Validate schema → Create PushDrop token → Timestamp on BSV → Store in METAWATTS → Optional broadcast to overlay.
2. **Query**: API filter request → Query DB/overlay → Return results with BSV proofs.
3. **Transfer/Purchase**: Select token → Unlock/redeem → Broadcast new state to overlay.
4. **Timestamp Proof**: Any bundle query includes BSV tx timestamp for verification.

## API Endpoints Integration
- All EnergyTag endpoints implemented in Express.
- Extensions: Return tx_id for BSV proofs; options for broadcast/unlock.
- Example: /certificates/create → Generates PushDrop, timestamps, stores in METAWATTS.

## Security and Compliance
- **Security**: Wallet-based auth, encrypted PushDrop data, BSV immutability.
- **Compliance**: 100% EnergyTag alignment; audit logs via blockchain.
- **Error Handling**: Graceful failures with retry for BSV tx.

## Deployment and Operations
- **Environments**: Dev (local BSV testnet), QA, Prod (mainnet).
- **CI/CD**: GitHub Actions for builds; Docker for containerization.
- **Monitoring**: Track API uptime, tx success rates, overlay queries.
- **Scalability**: BSV's high throughput; horizontal scaling for Express.

## Risks and Mitigations
- **Risk**: BSV network delays – Mitigate with async processing and retries.
- **Risk**: Token mismanagement – Use ts-sdk validation and DB sync.

## Appendices
- BSV ts-sdk Documentation.
- PushDrop Token Specs.
- EnergyTag API OpenAPI JSON.

#endregion