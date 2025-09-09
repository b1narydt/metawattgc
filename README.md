# MetawattGC

MetawattGC is a work-in-progress application for exploring and managing EnergyTag-compliant Granular Certificates (GCs).

## Monorepo Layout

- `metawattgc/frontend/` — React + Vite app. Initial UI scaffold copied from `lab-l8` and rebranded.
- `metawattgc/local-data/` — Local development data, if needed.

## Getting Started

Install dependencies and run the frontend in dev mode:

```bash
# from the repo root
cd metawattgc/frontend
npm install
npm run dev
```

## EnergyTag Scope (Initial)

We will evolve the data model and APIs to support the EnergyTag standard (Accounts, Devices, GC Bundles, Queries, Claims, Cancellations, etc.).
This repo will begin by implementing read/query flows against the following schema groups:

- Account, Device
- GranularCertificateBundle and Query/Response
- Claim and Cancellation (action request/response scaffolds)

Further actions (transfers, recurring actions) will be added iteratively.

## Next Steps

- Rebrand in-code UI elements from the original lab to MetawattGC.
- Define TypeScript interfaces for key EnergyTag objects under `frontend/src/types/`.
- Stub API layer for querying GC Bundles (e.g., `frontend/src/api/energyTag.ts`).
- Implement basic list/search UI for GC Bundles.
- Add tests and sample data.
