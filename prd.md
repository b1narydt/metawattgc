# METAWATT Granular Certificate Platform PRD

## Version History
- **Version**: 1.0
- **Date**: September 09, 2025
- **Author**: Grok 4 (built by xAI)
- **Status**: Draft
- **Changes**: Initial draft based on EnergyTag API spec, BSV ts-sdk, BRC100, and related tools.

## Executive Summary
The METAWATT Granular Certificate (GC) Platform is a blockchain-based system for issuing, managing, and tracking granular energy certificates compliant with the EnergyTag standard. It leverages the Bitcoin SV (BSV) blockchain via the TypeScript SDK (ts-sdk) to implement BRC100-compatible tokens for certificates, ensuring immutability, transparency, and interoperability. The platform provides wallet-to-application interfaces for seamless user interactions, incorporates overlay services for UTXO tracking, PushDrop tokens for data-rich certificate representation, and authentication/payment middleware for secure, monetized API access.

This PRD guides Windsurf AI coding tools in building the platform, focusing on modular code generation, API endpoint implementation, blockchain integration, and monetization features. The core API follows the provided EnergyTag specification, with extensions for BSV-specific operations like token minting and transaction indexing.

## Goals and Objectives
- **Primary Goal**: Develop a secure, scalable platform for EnergyTag-compliant granular certificates using BSV blockchain to enable real-time issuance, transfer, and verification.
- **Key Objectives**:
  - Integrate ts-sdk for BSV interactions, including BRC100 token standards for certificate representation.
  - Support wallet interfaces for user authentication and transactions.
  - Implement monetization via auth and payment middleware.
  - Ensure low-latency operations (<500ms for API calls, <10s for blockchain confirmations).
  - Provide tools for Windsurf to generate TypeScript/FastAPI code aligned with the API spec.
  - Achieve 100% compliance with EnergyTag v2, including storage records (SCR/SDR) and SD-GC issuance.

## Scope
- **In Scope**:
  - Implementation of all EnergyTag API endpoints (e.g., certificate creation, query, transfer, cancellation).
  - BSV integration: Use ts-sdk for transaction signing, broadcasting, and BRC100 token minting/burning.
  - Wallet interfaces: BRC100-compatible for certificate holding/transfer.
  - Monetization: Express middleware for auth (e.g., JWT/OAuth) and payments (e.g., microtransactions via BSV).
  - Tools section for BSV stack guidance.
- **Out of Scope**:
  - Full frontend UI (focus on API and SDK interfaces).
  - Non-BSV blockchain integrations.
  - Advanced AI models beyond Windsurf code gen prompts.

## User Personas
- **Energy Producer**: Registers devices, issues certificates via API, tracks energy attributes on BSV.
- **Consumer/Beneficiary**: Queries/claims certificates, transfers via wallet interfaces.
- **Registry Admin**: Manages users/accounts, withdraws invalid certificates, monitors blockchain transactions.
- **Developer (Windsurf User)**: Uses PRD prompts to generate code for endpoints and integrations.

## Functional Requirements
1. **Certificate Management**:
   - Create GC bundles as BRC100 tokens on BSV, mapping EnergyTag schema fields to token metadata.
   - Query bundles with filters (e.g., issuance ID, time period, energy source), retrieving from BSV via overlay services.
   - Transfer bundles: Burn/mint tokens on BSV for immutable records.
   - Cancel/Withdraw: Update token status via PushDrop scripts.
   - Recurring actions: Schedule transfers/cancellations using ts-sdk for timed transactions.

2. **Storage Records**:
   - Create SCR/SDR, allocate to certificates, calculate efficiency factors.
   - Issue SD-GCs as specialized BRC100 tokens with storage attributes.

3. **User/Account/Device Management**:
   - CRUD operations for organisations, users, accounts, devices.
   - Role-based access (e.g., 'GC Issuer' can create bundles).

4. **Blockchain Integration**:
   - Use ts-sdk for key management, transaction building, and broadcasting.
   - Represent certificates as PushDrop tokens for data embedding.
   - Leverage overlay services for real-time UTXO tracking and indexing.

5. **Monetization**:
   - Auth Express middleware: JWT for API access control.
   - Auth Payment middleware: Require BSV micro-payments for premium actions (e.g., bulk transfers).

6. **API Endpoints**:
   - Implement all paths from the provided spec (e.g., /certificates/create, /storage/create_scr).
   - Extend with BSV-specific params (e.g., tx_id for confirmation).

## Non-Functional Requirements
- **Performance**: API latency <500ms; blockchain ops <10s confirmation.
- **Security**: Use ts-sdk for ECDSA signing; immutable records on BSV.
- **Scalability**: Handle 1,000+ certificates/hour via BSV's high throughput.
- **Compliance**: 100% EnergyTag v2 adherence; audit trails via blockchain.
- **Usability**: Wallet-friendly interfaces; detailed error responses.
- **Reliability**: ACID-compliant DB for off-chain state; sync with BSV ledger.

## Technical Architecture
- **Backend**: TypeScript/Node.js with Express for API.
- **Blockchain**: BSV mainnet/testnet; ts-sdk for core ops.
- **Token Standard**: BRC100 for extensible certificates; PushDrop for data-rich tokens.
- **Indexing**: Overlay services for querying UTXOs without full node.
- **Auth/Monetization**: Express middleware for JWT auth; payment gateway for BSV tx-based fees.
- **Database**: PostgreSQL for off-chain metadata (synced with BSV).
- **Deployment**: Docker/Kubernetes; CI/CD with GitHub Actions.

## Tools
This section provides guidance for Windsurf AI to incorporate the BSV stack in code generation. Use these components to build BRC100-compatible interfaces, ensuring modular, reusable code.

1. **BSV Stack Overview**:
   - Core blockchain for high-throughput transactions.
   - Use for immutable certificate logging (e.g., issuance as tx outputs).

2. **ts-sdk (@bsv/sdk)**:
   - Import for transaction building, signing, and broadcasting.
   - Key features: ECDSA keys, script templates (e.g., for BRC100).
   - Windsurf Prompt: "Generate TypeScript code using @bsv/sdk to mint a BRC100 token representing a GranularCertificateBundle."

3. **Overlay Services**:
   - Dynamic UTXO tracking engine.
   - Use for real-time certificate queries without scanning the full chain.
   - Integration: Connect via API to index BRC100 tokens.

4. **PushDrop Tokens (from ts-sdk)**:
   - Embed certificate data in scripts.
   - Use @babbage/tokenator for encrypted tokens.
   - Example: Represent GC bundles as PushDrop outputs with EnergyTag metadata.

5. **Auth Express Middleware**:
   - JWT-based auth for API endpoints.
   - Windsurf Prompt: "Create Express middleware to validate JWT tokens before allowing certificate creation."

6. **Auth Payment Middleware**:
   - Monetize API calls via BSV micropayments.
   - Integrate with ts-sdk to verify tx payments.
   - Example: Require 100 satoshis for /certificates/transfer; refund on failure.

Windsurf Integration Guidelines:
- Generate code snippets for each API path, importing ts-sdk where needed.
- Ensure BRC100 compliance: Tokens must support extensibility for future EnergyTag updates.
- Test prompts: Validate generated code against EnergyTag schemas using ts-sdk's script evaluator.

## API Specification
The platform implements the EnergyTag API v2.0 as provided. All schemas and paths are to be followed, with BSV extensions (e.g., return tx_id in responses). Reference the full OpenAPI JSON for details.

## Testing and QA
- **Unit Tests**: Cover API endpoints, ts-sdk interactions (mock blockchain).
- **Integration Tests**: Simulate BSV tx with testnet; verify BRC100 token creation.
- **Compliance Tests**: Validate against EnergyTag rules (e.g., bundle splitting).
- **Tools**: Use Jest for TS; Windsurf for auto-generated test cases.

## Deployment and CI/CD
- Environments: Dev (local), QA (testnet), Prod (mainnet).
- CI/CD: GitHub Actions; deploy to Vercel/AWS.
- Monitoring: Track API usage, BSV tx confirmations.

## Risks and Mitigations
- **Risk**: BSV network congestion – Mitigate with retry logic in ts-sdk.
- **Risk**: Schema changes in EnergyTag – Use modular code for easy updates.

## Appendices
- EnergyTag API OpenAPI JSON (attached).
- BSV Resources: ts-sdk docs, BRC100 protocol spec.