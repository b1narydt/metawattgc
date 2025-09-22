METAWATT App Flow Document
Version History

Version: 1.1
Date: September 09, 2025
Author: Grok (built by xAI)
Status: Draft

Overview
The METAWATT app is a web application that enables users to interact with the EnergyTag standard API for managing granular energy certificates. It integrates with the Metanet client for login and uses authexpressmiddleware for authentication, allowing secure API calls. The app supports energy producers, consumers, and registry admins to issue, query, transfer, and verify certificates on the Bitcoin SV (BSV) blockchain. This document outlines the updated app flow.
User Flows
1. User Authentication

Purpose: Secure access to app features via Metanet client and authexpressmiddleware.
Steps:
User launches the METAWATT web app.
User clicks "Log In" and is redirected to the Metanet client for authentication.
Metanet client authenticates the user (e.g., via wallet credentials) and returns a JWT token.
App validates the token using authexpressmiddleware and redirects to the dashboard.
For new users, Metanet client prompts sign-up; app registers user via /users/register after Metanet auth.



2. Dashboard

Purpose: Main hub for certificate management.
Steps:
Display user role-specific options (e.g., "Issue Certificate" for Producers, "Claim Certificate" for Consumers).
Show recent certificate activity (fetch from /certificates/query with filters).
Provide navigation to sub-flows (Issue, Query, Transfer, etc.).



3. Issue Certificate (Producer Flow)

Purpose: Create and issue granular certificates.
Steps:
Producer selects "Issue Certificate" from dashboard.
Enter certificate details (e.g., energy source, volume, time) per EnergyTag schema.
Submit to backend API (/certificates/create) with authexpressmiddleware-validated token; backend mints BRC100 token on BSV.
Display success message with transaction ID (tx_id) and certificate ID.



4. Query Certificates

Purpose: Retrieve certificate details.
Steps:
User selects "Query Certificates" from dashboard.
Apply filters (e.g., issuance ID, date range) and submit to /certificates/query with authenticated token.
Backend returns list of certificates; app displays in a scrollable list with details (issuer, status, energy attributes).
Option to view full certificate details or export data.



5. Transfer Certificate

Purpose: Move certificates between wallets.
Steps:
User selects "Transfer Certificate" and chooses a certificate.
Enter recipient wallet address (BRC100-compatible).
Submit to /certificates/transfer with authenticated token; backend burns/mints tokens on BSV.
Display confirmation with new tx_id.



6. Verify Certificate

Purpose: Ensure certificate authenticity.
Steps:
User selects "Verify Certificate" and enters certificate ID or scans QR code.
App calls /certificates/query with ID and authenticated token to fetch blockchain data.
Display verification status (valid/invalid) and metadata.



7. Admin Withdraw/Cancel

Purpose: Manage invalid or expired certificates.
Steps:
Admin logs in via Metanet client and selects "Manage Certificates".
Choose certificate and select "Withdraw" or "Cancel".
Submit to /certificates/cancel with authenticated token; backend updates token status via PushDrop.
Log action and notify relevant users.



8. Logout

Purpose: Securely end session.
Steps:
User selects "Logout" from menu.
App clears local token, invalidates session via authexpressmiddleware, and redirects to login screen.



Technical Integration

Backend API: Connects to EnergyTag v2.0 endpoints (e.g., /certificates/create, /certificates/query) via RESTful calls with authexpressmiddleware for token validation.
Wallet Interface: Integrates BRC100-compatible wallets via Metanet client for certificate holding/transfer.
Authentication: Uses Metanet client for initial login, followed by authexpressmiddleware for API request authorization.
Error Handling: Displays user-friendly messages for API errors (e.g., 401 Unauthorized, 500 Server Error).
Offline Mode: Caches recent queries locally; syncs with API on reconnect.

UI/UX Considerations

Responsive Design: Optimized for web (e.g., 320px-1440px screens).
Feedback: Show loading spinners during API calls; toast notifications for success/errors.
Accessibility: Support screen readers, high-contrast mode, and keyboard navigation.
Navigation: Sidebar with icons for main flows.

Dependencies

Frontend: React with Tailwind CSS.
Backend: EnergyTag API hosted on Node.js/Express with BSV integration.
Libraries: @bsv/sdk for wallet interactions, axios for API calls, authexpressmiddleware for auth.

Testing

Unit Tests: Validate UI components and API call responses.
Integration Tests: Simulate full flows (e.g., issue → transfer → verify) on testnet with Metanet client.
User Acceptance: Test with producer/consumer/admin personas for usability.

Deployment

Environments: Dev (local), QA (testnet API), Prod (mainnet API).
Release: Web via Vercel.
